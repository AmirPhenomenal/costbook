import { batchCost, lineCost, type Items } from './cost';
import type { Cost } from './cost';

/** material = bought, part = made and used inside something else, product = made and not used elsewhere. */
export type NodeKind = 'material' | 'part' | 'product';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  /** 0 for materials; for made things, 1 + the deepest thing they use. */
  level: number;
  /** Ids this item uses directly. */
  uses: string[];
  /** Ids of items that use this one directly. */
  usedBy: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  /** Share of `to`'s batch cost that comes from `from` (0–1), or 0 if unknown. */
  share: number;
}

export interface Graph {
  nodes: GraphNode[];
  byId: Map<string, GraphNode>;
  edges: GraphEdge[];
}

export function buildGraph(items: Items): Graph {
  const byId = new Map<string, GraphNode>();
  for (const it of Object.values(items)) {
    byId.set(it.id, { id: it.id, kind: it.kind === 'ingredient' ? 'material' : 'product', level: 0, uses: [], usedBy: [] });
  }
  const edges: GraphEdge[] = [];
  const memo = new Map<string, Cost>();
  for (const it of Object.values(items)) {
    if (it.kind !== 'recipe') continue;
    const total = batchCost(items, it, memo);
    // One edge per used item, even if it appears on several lines.
    const shares = new Map<string, number>();
    for (const line of it.components) {
      if (!byId.has(line.itemId) || line.itemId === it.id) continue;
      const c = lineCost(items, line, memo);
      const s = total.ok && total.value > 0 && c.ok ? c.value / total.value : 0;
      shares.set(line.itemId, (shares.get(line.itemId) ?? 0) + s);
    }
    for (const [from, share] of shares) {
      edges.push({ from, to: it.id, share });
      byId.get(it.id)!.uses.push(from);
      byId.get(from)!.usedBy.push(it.id);
    }
  }
  for (const n of byId.values()) if (n.kind === 'product' && n.usedBy.length > 0) n.kind = 'part';

  // Longest path from materials; loops (which the editor prevents) are cut.
  const level = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    const known = level.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const n = byId.get(id)!;
    const d = n.kind === 'material' ? 0 : 1 + Math.max(0, ...n.uses.map(depth));
    visiting.delete(id);
    level.set(id, d);
    return d;
  };
  for (const n of byId.values()) n.level = depth(n.id);

  return { nodes: [...byId.values()], byId, edges };
}

/** Everything `id` is made from (all the way down) and everything it ends up in (all the way up). */
export function connected(g: Graph, id: string): { down: Set<string>; up: Set<string> } {
  const walk = (start: string, next: (n: GraphNode) => string[]) => {
    const seen = new Set<string>();
    const stack = [...next(g.byId.get(start)!)];
    while (stack.length) {
      const cur = stack.pop()!;
      if (seen.has(cur) || cur === start) continue;
      seen.add(cur);
      stack.push(...next(g.byId.get(cur)!));
    }
    return seen;
  };
  return { down: walk(id, (n) => n.uses), up: walk(id, (n) => n.usedBy) };
}

export interface Point {
  x: number;
  y: number;
}

export const COLUMN = 420;

/** Small, stable pseudo-random number from a string, so the map looks the same every time. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Places nodes like a map: bought materials on one side, final products on the other,
 * things that are used together pulled close. A small force simulation, run once.
 */
export function layout(g: Graph, ticks = 360): Map<string, Point> {
  const nodes = g.nodes;
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const n = nodes.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const tx = new Float64Array(n);

  // Start: columns by level, rows ordered by group so neighbours begin near each other.
  const byLevel = new Map<number, GraphNode[]>();
  for (const node of nodes) byLevel.set(node.level, [...(byLevel.get(node.level) ?? []), node]);
  for (const [lvl, list] of byLevel) {
    list.sort((a, b) => a.id.localeCompare(b.id));
    list.forEach((node, i) => {
      const k = index.get(node.id)!;
      tx[k] = lvl * COLUMN;
      x[k] = tx[k] + (hash01(node.id) - 0.5) * 40;
      y[k] = (i - list.length / 2) * 34 + (hash01(node.id + 'y') - 0.5) * 20;
    });
  }

  // Like d3: a link to a hub (salt, labour…) pulls weakly, so hubs don't glue everything into one ball.
  const degree = new Float64Array(n);
  for (const e of g.edges) {
    degree[index.get(e.from)!]++;
    degree[index.get(e.to)!]++;
  }
  const links = g.edges.map((e) => {
    const a = index.get(e.from)!;
    const b = index.get(e.to)!;
    return [a, b, 0.12 / Math.min(degree[a], degree[b])] as const;
  });
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);
  const REPEL = 9000;
  const LINK = COLUMN * 0.75;
  const mid = (Math.max(0, ...nodes.map((nd) => nd.level)) * COLUMN) / 2;

  for (let t = 0; t < ticks; t++) {
    const alpha = 1 - t / ticks;
    fx.fill(0);
    fy.fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = x[i] - x[j];
        let dy = y[i] - y[j];
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = hash01(String(i * 31 + j)) - 0.5;
          dy = 0.5;
          d2 = 1;
        }
        if (d2 > 360_000) continue; // far apart: ignore
        const f = REPEL / d2;
        fx[i] += dx * f;
        fy[i] += dy * f;
        fx[j] -= dx * f;
        fy[j] -= dy * f;
      }
    }
    for (const [a, b, strength] of links) {
      const dx = x[b] - x[a];
      const dy = y[b] - y[a];
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = ((d - LINK) / d) * strength;
      fx[a] += dx * f;
      fy[a] += dy * f;
      fx[b] -= dx * f;
      fy[b] -= dy * f;
    }
    for (let i = 0; i < n; i++) {
      fx[i] += (tx[i] - x[i]) * 0.03; // lean toward your column
      fy[i] -= y[i] * 0.014; // drift to the middle
      fx[i] -= (x[i] - mid) * 0.006;
      const step = Math.min(30, Math.hypot(fx[i], fy[i])) / (Math.hypot(fx[i], fy[i]) || 1);
      x[i] += fx[i] * step * alpha;
      y[i] += fy[i] * step * alpha;
    }
  }

  const out = new Map<string, Point>();
  nodes.forEach((node, i) => out.set(node.id, { x: x[i], y: y[i] }));
  return out;
}
