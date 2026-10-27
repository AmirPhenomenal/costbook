import { describe, expect, it } from 'vitest';
import { buildGraph, connected, layout } from './graph';
import type { Ingredient, Item, Recipe } from './types';

const mat = (id: string, price: number): Ingredient => ({
  id, kind: 'ingredient', name: id, category: '', notes: '', updatedAt: 0, price, packQty: 1, packUnit: 'kg',
});
const rec = (id: string, lines: [string, number][], sellPrice: number | null = null): Recipe => ({
  id, kind: 'recipe', name: id, category: '', notes: '', updatedAt: 0, yieldQty: 1, yieldUnit: 'kg', sellPrice,
  components: lines.map(([itemId, qty], i) => ({ id: `${id}${i}`, itemId, qty, unit: 'kg' })),
});

// flour + water → dough → pizza (+ cheese); salt used twice
const items: Record<string, Item> = Object.fromEntries(
  [
    mat('flour', 1),
    mat('salt', 2),
    mat('cheese', 10),
    rec('dough', [['flour', 1], ['salt', 0.5]]),
    rec('pizza', [['dough', 1], ['cheese', 0.4], ['salt', 0.5]], 20),
  ].map((i) => [i.id, i]),
);

describe('map graph', () => {
  const g = buildGraph(items);

  it('tells bought, in-between and final things apart', () => {
    expect(g.byId.get('flour')!.kind).toBe('material');
    expect(g.byId.get('dough')!.kind).toBe('part');
    expect(g.byId.get('pizza')!.kind).toBe('product');
  });

  it('puts things after what they are made from', () => {
    expect(g.byId.get('salt')!.level).toBe(0);
    expect(g.byId.get('dough')!.level).toBe(1);
    expect(g.byId.get('pizza')!.level).toBe(2);
  });

  it('knows each ingredient’s share of the cost', () => {
    // pizza batch: dough 2 + cheese 4 + salt 1 = 7
    const share = (from: string) => g.edges.find((e) => e.from === from && e.to === 'pizza')!.share;
    expect(share('cheese')).toBeCloseTo(4 / 7);
    expect(share('dough')).toBeCloseTo(2 / 7);
  });

  it('follows connections all the way up and down', () => {
    const c = connected(g, 'dough');
    expect([...c.down].sort()).toEqual(['flour', 'salt']);
    expect([...c.up]).toEqual(['pizza']);
    expect([...connected(g, 'flour').up].sort()).toEqual(['dough', 'pizza']);
  });

  it('lays out every item at a finite spot, the same way every time', () => {
    const a = layout(g, 50);
    const b = layout(buildGraph(items), 50);
    expect(a.size).toBe(5);
    for (const [id, p] of a) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      expect(b.get(id)).toEqual(p);
    }
  });

  it('survives a loop in old data without hanging', () => {
    const loop = { ...items, a: rec('a', [['b', 1]]), b: rec('b', [['a', 1]]) };
    const lg = buildGraph(loop);
    expect(lg.byId.get('a')!.level).toBeGreaterThanOrEqual(0);
    expect(connected(lg, 'a').down.has('b')).toBe(true);
  });
});
