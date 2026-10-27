import type { Component, Item, Recipe } from './types';
import { getUnit } from './units';

export type Items = Record<string, Item>;

/** Why a cost can't be calculated. Turned into words by the UI (see i18n). */
export type CostError =
  | { code: 'missing' }
  | { code: 'loop'; name: string }
  | { code: 'unknownUnit' }
  | { code: 'packZero' }
  | { code: 'badPrice' }
  | { code: 'yieldZero' }
  | { code: 'badAmount' }
  | { code: 'unitMismatch'; name: string; unit: string }
  | { code: 'inside'; name: string; inner: CostError };

export type Cost = { ok: true; value: number } | { ok: false; error: CostError };

const fail = (error: CostError): Cost => ({ ok: false, error });

/** The unit an item is measured in when used inside another recipe. */
export function itemBaseUnit(item: Item): string {
  return item.kind === 'ingredient' ? item.packUnit : item.yieldUnit;
}

/**
 * Cost of ONE base unit (1 g, 1 ml, 1 pcs, 1 m, 1 kWh, 1 hour…) of an item.
 * Recipes are resolved recursively, so a dough used in a pizza brings
 * the cost of its own flour, salt, etc. with it.
 */
export function costPerBase(items: Items, id: string, memo = new Map<string, Cost>(), path = new Set<string>()): Cost {
  const cached = memo.get(id);
  if (cached) return cached;
  const item = items[id];
  if (!item) return fail({ code: 'missing' });
  if (path.has(id)) return fail({ code: 'loop', name: item.name });

  let result: Cost;
  if (item.kind === 'ingredient') {
    const unit = getUnit(item.packUnit);
    const amount = item.packQty * (unit?.toBase ?? NaN);
    if (!unit) result = fail({ code: 'unknownUnit' });
    else if (!(amount > 0)) result = fail({ code: 'packZero' });
    else if (!Number.isFinite(item.price) || item.price < 0) result = fail({ code: 'badPrice' });
    else result = { ok: true, value: item.price / amount };
  } else {
    path.add(id);
    const batch = batchCost(items, item, memo, path);
    path.delete(id);
    const unit = getUnit(item.yieldUnit);
    const amount = item.yieldQty * (unit?.toBase ?? NaN);
    if (!batch.ok) result = batch;
    else if (!unit) result = fail({ code: 'unknownUnit' });
    else if (!(amount > 0)) result = fail({ code: 'yieldZero' });
    else result = { ok: true, value: batch.value / amount };
  }
  memo.set(id, result);
  return result;
}

/** Cost of one component line in a recipe. */
export function lineCost(items: Items, line: Component, memo = new Map<string, Cost>(), path = new Set<string>()): Cost {
  const child = items[line.itemId];
  if (!child) return fail({ code: 'missing' });
  const lineUnit = getUnit(line.unit);
  const childUnit = getUnit(itemBaseUnit(child));
  if (!lineUnit || !childUnit) return fail({ code: 'unknownUnit' });
  if (lineUnit.family !== childUnit.family) {
    return fail({ code: 'unitMismatch', name: child.name, unit: childUnit.id });
  }
  if (!Number.isFinite(line.qty) || line.qty < 0) return fail({ code: 'badAmount' });
  const per = costPerBase(items, child.id, memo, path);
  if (!per.ok) return per.error.code === 'inside' || per.error.code === 'loop' ? per : fail({ code: 'inside', name: child.name, inner: per.error });
  return { ok: true, value: per.value * line.qty * lineUnit.toBase };
}

/** Total cost of one full batch of a recipe. */
export function batchCost(items: Items, recipe: Recipe, memo = new Map<string, Cost>(), path = new Set<string>()): Cost {
  let total = 0;
  for (const line of recipe.components) {
    const c = lineCost(items, line, memo, path);
    if (!c.ok) return c;
    total += c.value;
  }
  return { ok: true, value: total };
}

/** Cost of one yield unit as the user sees it (e.g. per 1 pizza, per 1 kg of dough). */
export function costPerYieldUnit(items: Items, recipe: Recipe): Cost {
  const per = costPerBase(items, recipe.id);
  if (!per.ok) return per;
  const unit = getUnit(recipe.yieldUnit);
  return { ok: true, value: per.value * (unit?.toBase ?? 1) };
}

/** True if putting `candidateId` inside `recipeId` would make a loop. */
export function wouldCreateCycle(items: Items, recipeId: string, candidateId: string): boolean {
  if (candidateId === recipeId) return true;
  const seen = new Set<string>();
  const stack = [candidateId];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === recipeId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const it = items[id];
    if (it?.kind === 'recipe') for (const c of it.components) stack.push(c.itemId);
  }
  return false;
}

/** Recipes that directly use this item. */
export function usedIn(items: Items, id: string): Recipe[] {
  return Object.values(items).filter(
    (it): it is Recipe => it.kind === 'recipe' && it.components.some((c) => c.itemId === id),
  );
}

export interface BreakdownNode {
  key: string;
  name: string;
  qty: number;
  unit: string;
  cost: number | null;
  error?: CostError;
  children: BreakdownNode[];
}

/** Full cost tree for a recipe, scaled to `scale` batches. */
export function breakdown(items: Items, recipe: Recipe, scale = 1, depth = 0, keyPrefix = ''): BreakdownNode[] {
  if (depth > 20) return [];
  const memo = new Map<string, Cost>();
  return recipe.components.map((line, i) => {
    const child = items[line.itemId];
    const c = lineCost(items, line, memo);
    const key = `${keyPrefix}${i}-${line.id}`;
    let children: BreakdownNode[] = [];
    if (c.ok && child?.kind === 'recipe') {
      const childUnit = getUnit(child.yieldUnit)!;
      const lineUnit = getUnit(line.unit)!;
      const batchesUsed = (line.qty * lineUnit.toBase) / (child.yieldQty * childUnit.toBase);
      children = breakdown(items, child, batchesUsed * scale, depth + 1, key + '/');
    }
    return {
      key,
      name: child?.name ?? '',
      qty: line.qty * scale,
      unit: line.unit,
      cost: c.ok ? c.value * scale : null,
      error: c.ok ? undefined : c.error,
      children,
    };
  });
}

/**
 * Price you need to charge so that your cost is `costPercent` % of the price.
 * Restaurants usually aim for food cost around 25–35 %.
 */
export function priceForCostPercent(cost: number, costPercent: number): number | null {
  return costPercent > 0 && costPercent < 100 ? cost / (costPercent / 100) : null;
}
