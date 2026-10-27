import { describe, expect, it } from 'vitest';
import { batchCost, costPerBase, costPerYieldUnit, lineCost, priceForCostPercent, wouldCreateCycle } from './cost';
import { parseNumber } from './format';
import type { Ingredient, Item, Recipe } from './types';

const ing = (id: string, price: number, packQty: number, packUnit: string): Ingredient => ({
  id, kind: 'ingredient', name: id, category: '', price, packQty, packUnit, notes: '', updatedAt: 0,
});
const rec = (id: string, lines: [string, number, string][], yieldQty: number, yieldUnit: string): Recipe => ({
  id, kind: 'recipe', name: id, category: '', yieldQty, yieldUnit, sellPrice: null, notes: '', updatedAt: 0,
  components: lines.map(([itemId, qty, unit], i) => ({ id: `${id}-${i}`, itemId, qty, unit })),
});
const db = (...list: Item[]) => Object.fromEntries(list.map((i) => [i.id, i]));

describe('costs', () => {
  it('prices an ingredient per base unit', () => {
    const items = db(ing('flour', 20, 25, 'kg'));
    const c = costPerBase(items, 'flour');
    expect(c.ok && c.value).toBeCloseTo(20 / 25000); // per gram
  });

  it('converts units inside a recipe line', () => {
    const items = db(ing('flour', 20, 25, 'kg'));
    const c = lineCost(items, { id: 'l', itemId: 'flour', qty: 500, unit: 'g' });
    expect(c.ok && c.value).toBeCloseTo(0.4);
  });

  it('rolls nested recipes up (dough inside pizza)', () => {
    const items = db(
      ing('flour', 10, 10, 'kg'), // 1 per kg
      ing('salt', 2, 1, 'kg'), // 2 per kg
      ing('box', 50, 100, 'pcs'), // 0.5 each
      rec('dough', [['flour', 1, 'kg'], ['salt', 500, 'g']], 2, 'kg'), // batch 2 → 1 per kg
      rec('pizza', [['dough', 250, 'g'], ['box', 1, 'pcs']], 1, 'pcs'),
    );
    const dough = costPerYieldUnit(items, items.dough as Recipe);
    expect(dough.ok && dough.value).toBeCloseTo(1);
    const pizza = costPerYieldUnit(items, items.pizza as Recipe);
    expect(pizza.ok && pizza.value).toBeCloseTo(0.25 + 0.5);
  });

  it('handles time and energy (labor, electricity)', () => {
    const items = db(ing('labor', 15, 1, 'h'), ing('power', 0.2, 1, 'kwh'), rec('thing', [['labor', 30, 'min'], ['power', 500, 'wh']], 1, 'pcs'));
    const c = batchCost(items, items.thing as Recipe);
    expect(c.ok && c.value).toBeCloseTo(7.5 + 0.1);
  });

  it('reports a unit mismatch instead of a wrong number', () => {
    const items = db(ing('flour', 10, 10, 'kg'));
    const c = lineCost(items, { id: 'l', itemId: 'flour', qty: 1, unit: 'pcs' });
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.error.code).toBe('unitMismatch');
  });

  it('detects loops', () => {
    const items = db(rec('a', [['b', 1, 'pcs']], 1, 'pcs'), rec('b', [], 1, 'pcs'));
    expect(wouldCreateCycle(items, 'b', 'a')).toBe(true);
    expect(wouldCreateCycle(items, 'a', 'a')).toBe(true);
    expect(wouldCreateCycle(items, 'a', 'b')).toBe(false);
  });

  it('suggests a price from a target cost %', () => {
    expect(priceForCostPercent(3, 30)).toBeCloseTo(10);
    expect(priceForCostPercent(3, 0)).toBeNull();
  });
});

describe('parseNumber', () => {
  it.each([
    ['12', 12],
    ['1.5', 1.5],
    ['1,500', 1500],
    ['۱۵۰٬۰۰۰', 150000],
    ['۲/۵', 2.5],
    ['۲٫۵', 2.5],
    ['٣', 3],
    ['', 0],
  ])('%s → %d', (text, n) => expect(parseNumber(text)).toBe(n));

  it.each(['abc', '-3', '1.2.3', '.'])('rejects %s', (text) => expect(parseNumber(text)).toBeNull());
});
