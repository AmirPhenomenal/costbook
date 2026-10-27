import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { buildGraph, connected, layout, type GraphNode, type NodeKind, type Point } from '../graph';
import { money, percent } from '../format';
import { useI18n, type Key } from '../i18n';
import { useApp } from '../state';

interface Props {
  /** Item to start focused on, if any. */
  focusId: string | null;
  onSelect: (id: string | null) => void;
}

/** screen = world × k + (x, y) */
interface View {
  k: number;
  x: number;
  y: number;
}

type Drag =
  | { type: 'pan'; sx: number; sy: number; view: View; moved: boolean }
  | { type: 'node'; id: string; sx: number; sy: number; start: Point; moved: boolean }
  | { type: 'pinch'; d0: number; mid: Point; view: View };

const MIN_K = 0.12;
const MAX_K = 3;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
const KIND_LABEL: Record<NodeKind, Key> = { material: 'map.material', part: 'map.part', product: 'map.product' };

export function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="5" cy="6" r="2.2" />
        <circle cx="5" cy="18" r="2.2" />
        <circle cx="19" cy="12" r="2.6" />
        <path d="M7.2 6.6c5 .8 5.6 4.6 9.2 5.2M7.2 17.4c5-.8 5.6-4.6 9.2-5.2" />
      </g>
    </svg>
  );
}

function radius(n: GraphNode): number {
  if (n.kind === 'product') return 10;
  if (n.kind === 'part') return 8 + Math.min(5, n.usedBy.length * 0.6);
  // Materials used in many places are bigger: they are the hubs of the kitchen.
  return 4.5 + Math.min(7, Math.sqrt(n.usedBy.length) * 1.7);
}

export function MapView({ focusId, onSelect }: Props) {
  const { data } = useApp();
  const { t, dir, locale } = useI18n();
  const items = data.items;
  const flip = dir === 'rtl' ? -1 : 1;

  const graph = useMemo(() => buildGraph(items), [items]);
  // The layout only depends on what uses what, so editing a price doesn't reshuffle the map.
  const shape = graph.nodes
    .map((n) => `${n.id}<${n.uses.join(',')}`)
    .sort()
    .join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const base = useMemo(() => layout(graph), [shape]);
  const [moved, setMoved] = useState<Map<string, Point>>(() => new Map());
  useEffect(() => setMoved(new Map()), [shape, flip]);
  const pos = useCallback(
    (id: string): Point => {
      const m = moved.get(id);
      if (m) return m;
      const p = base.get(id) ?? { x: 0, y: 0 };
      return { x: p.x * flip, y: p.y };
    },
    [moved, base, flip],
  );

  const counts = useMemo(() => {
    const c: Record<NodeKind, number> = { material: 0, part: 0, product: 0 };
    for (const n of graph.nodes) c[n.kind]++;
    return c;
  }, [graph]);

  const [showMaterials, setShowMaterials] = useState(true);
  const [focus, setFocus] = useState<string | null>(focusId && items[focusId] ? focusId : null);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => graph.nodes.filter((n) => showMaterials || n.kind !== 'material' || n.id === focus),
    [graph, showMaterials, focus],
  );
  const visibleIds = useMemo(() => new Set(visible.map((n) => n.id)), [visible]);
  const focused = focus ? graph.byId.get(focus) : undefined;
  const links = useMemo(() => (focused ? connected(graph, focused.id) : null), [graph, focused]);

  // ---------- view: size, fit, zoom ----------
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ k: 0.5, x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (!size.w || !visible.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of visible) {
      const p = pos(n.id);
      x0 = Math.min(x0, p.x);
      x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    // Leave room on the sides for names, measured on screen.
    const k = clampK(Math.min((size.w - 140) / (x1 - x0 || 1), (size.h - 60) / (y1 - y0 || 1)));
    setView({ k, x: size.w / 2 - ((x0 + x1) / 2) * k, y: size.h / 2 - ((y0 + y1) / 2) * k });
  }, [size, visible, pos]);

  const centerOn = useCallback(
    (id: string) => {
      if (!size.w) return;
      const p = pos(id);
      // On wide screens the info card covers one side; keep the node clear of it.
      const shift = size.w > 760 ? -160 * (dir === 'rtl' ? -1 : 1) : 0;
      const cy = size.w > 760 ? size.h / 2 : size.h * 0.3;
      setView((v) => {
        const k = Math.max(v.k, 0.8);
        return { k, x: size.w / 2 + shift - p.x * k, y: cy - p.y * k };
      });
    },
    [size, pos, dir],
  );

  // First paint: show everything, or the item we came from.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !size.w) return;
    started.current = true;
    if (focus) centerOn(focus);
    else fit();
  }, [size, fit, centerOn, focus]);

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    setView((v) => {
      const k = clampK(v.k * factor);
      const f = k / v.k;
      return { k, x: sx - (sx - v.x) * f, y: sy - (sy - v.y) * f };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // ---------- pointer: pan, drag a dot, pinch, tap ----------
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<Drag | null>(null);
  const local = (e: RPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view };
      return;
    }
    const id = (e.target as Element).closest('[data-id]')?.getAttribute('data-id');
    drag.current = id
      ? { type: 'node', id, sx: p.x, sy: p.y, start: pos(id), moved: false }
      : { type: 'pan', sx: p.x, sy: p.y, view, moved: false };
  };

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const d = drag.current;
    if (!d) return;
    if (d.type === 'pinch') {
      const [a, b] = [...pointers.current.values()];
      if (!b) return;
      const k = clampK((d.view.k * Math.hypot(a.x - b.x, a.y - b.y)) / d.d0);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const wx = (d.mid.x - d.view.x) / d.view.k;
      const wy = (d.mid.y - d.view.y) / d.view.k;
      setView({ k, x: mid.x - wx * k, y: mid.y - wy * k });
      return;
    }
    const dx = p.x - d.sx;
    const dy = p.y - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    if (d.type === 'pan') setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy });
    else setMoved((m) => new Map(m).set(d.id, { x: d.start.x + dx / view.k, y: d.start.y + dy / view.k }));
  };

  const onPointerUp = (e: RPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    const d = drag.current;
    if (d?.type === 'pinch') {
      drag.current = null; // lifting one finger of a pinch shouldn't start a pan
      return;
    }
    drag.current = null;
    if (!d || d.moved || e.type === 'pointercancel') return;
    if (d.type === 'node') {
      const next = focus === d.id ? null : d.id;
      setFocus(next);
      // On phones the card covers the lower half: bring the dot into view above it.
      if (next && size.w <= 860) centerOn(next);
    } else setFocus(null);
  };

  const pick = (id: string) => {
    setFocus(id);
    setQuery('');
    if (!visibleIds.has(id)) setShowMaterials(true);
    centerOn(id);
  };

  // ---------- what to draw ----------
  const stateOf = (id: string): string => {
    if (!focused || !links) return '';
    if (id === focused.id) return 'focus';
    if (links.down.has(id)) return 'down';
    if (links.up.has(id)) return 'up';
    return 'dim';
  };
  const edgeState = (from: string, to: string): string => {
    if (!focused || !links) return '';
    const f = focused.id;
    if (links.down.has(from) && (to === f || links.down.has(to))) return 'down';
    if ((from === f || links.up.has(from)) && links.up.has(to)) return 'up';
    return 'dim';
  };

  // Dots and labels keep a readable size on screen when zoomed out.
  const font = Math.max(12, 10.5 / view.k);
  const grow = Math.max(1, 0.5 / view.k);

  // Like a printed map: the most important names first, and a name that would
  // overlap one already placed is left out (zoom in to see it).
  const labeled = useMemo(() => {
    const rank = (nd: GraphNode) => {
      const st = stateOf(nd.id);
      if (st === 'focus' || hover === nd.id) return 0;
      if (st === 'dim') return 9;
      return (focused ? 1 : 2) + (nd.kind === 'product' ? 0 : nd.kind === 'part' ? 1 : 2);
    };
    const boxes: [number, number, number, number][] = [];
    const out = new Set<string>();
    const sorted = [...visible].filter((nd) => rank(nd) < 9).sort((a, b) => rank(a) - rank(b));
    for (const nd of sorted) {
      const p = pos(nd.id);
      const sx = p.x * view.k + view.x;
      const sy = p.y * view.k + view.y;
      const px = font * view.k * (nd.kind === 'material' ? 0.9 : 1);
      const w = (items[nd.id]?.name.length ?? 6) * px * 0.55 + 4;
      const gap = (radius(nd) * grow + 5) * view.k;
      const bx = flip > 0 ? sx + gap : sx - gap - w;
      const box: [number, number, number, number] = [bx, sy - px * 0.65, bx + w, sy + px * 0.65];
      if (box[0] < 0 || box[2] > size.w || box[3] < 0 || box[1] > size.h) continue; // off screen or cut at the edge
      const hits = boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      if (hits && rank(nd) > 0) continue;
      boxes.push(box);
      out.add(nd.id);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pos, view, font, grow, flip, focused, links, hover, items, size]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(items)
      .filter((it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [items, query]);

  if (graph.nodes.length === 0) {
    return (
      <div className="map-view">
        <MapToolbar onBack={() => onSelect(null)} />
        <p className="map-empty muted">{t('map.empty')}</p>
      </div>
    );
  }

  const n = (v: number) => v.toLocaleString(locale);

  return (
    <div className="map-view">
      <MapToolbar onBack={() => onSelect(null)}>
        <span className="map-stats muted small hide-phone">
          {t('map.stats', { m: n(counts.material), p: n(counts.part), f: n(counts.product) })}
        </span>
        <span className="grow" />
        <div className="map-search">
          <input
            type="search"
            value={query}
            placeholder={t('map.find')}
            aria-label={t('map.find')}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) pick(results[0].id);
              if (e.key === 'Escape') setQuery('');
            }}
          />
          {results.length > 0 && (
            <ul className="map-results" role="listbox">
              {results.map((it) => (
                <li key={it.id}>
                  <button role="option" aria-selected={false} onClick={() => pick(it.id)}>
                    <span className={`map-dot ${graph.byId.get(it.id)?.kind}`} />
                    <span className="ellipsis">{it.name || t('untitled')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </MapToolbar>

      <div className="map-stage" ref={stageRef}>
        <svg
          ref={svgRef}
          className="map-canvas"
          role="img"
          aria-label={t('map.title')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <g className="map-edges">
              {graph.edges.map((e) => {
                if (!visibleIds.has(e.from) || !visibleIds.has(e.to)) return null;
                const a = pos(e.from);
                const b = pos(e.to);
                const mx = (a.x + b.x) / 2;
                return (
                  <path
                    key={`${e.from}>${e.to}`}
                    className={`map-edge ${edgeState(e.from, e.to)}`}
                    d={`M${a.x},${a.y}C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
                    strokeWidth={0.8 + e.share * 6}
                  />
                );
              })}
            </g>
            <g className="map-nodes">
              {visible.map((node) => {
                const p = pos(node.id);
                const r = radius(node) * grow;
                const st = stateOf(node.id);
                const name = items[node.id]?.name || t('untitled');
                return (
                  <g
                    key={node.id}
                    data-id={node.id}
                    className={`map-node ${node.kind} ${st}`}
                    transform={`translate(${p.x} ${p.y})`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${name}, ${t(KIND_LABEL[node.kind])}`}
                    aria-pressed={st === 'focus'}
                    onPointerEnter={() => setHover(node.id)}
                    onPointerLeave={() => setHover((h) => (h === node.id ? null : h))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        pick(node.id);
                      }
                    }}
                  >
                    <circle r={r + 6 / view.k} className="hit" />
                    <circle r={r} />
                    {labeled.has(node.id) && (
                      <text x={(r + 5) * flip} dy="0.35em" fontSize={node.kind === 'material' ? font * 0.9 : font}>
                        {name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        <div className="map-controls">
          <button className="icon-btn" onClick={() => zoomAt(size.w / 2, size.h / 2, 1.3)} aria-label={t('map.zoomIn')}>
            +
          </button>
          <button className="icon-btn" onClick={() => zoomAt(size.w / 2, size.h / 2, 1 / 1.3)} aria-label={t('map.zoomOut')}>
            −
          </button>
          <button className="icon-btn fit" onClick={fit} aria-label={t('map.fit')} title={t('map.fit')}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="map-legend">
          {(['material', 'part', 'product'] as const).map((k) =>
            k === 'material' ? (
              <label key={k} className="map-legend-row toggle">
                <input type="checkbox" checked={showMaterials} onChange={(e) => setShowMaterials(e.target.checked)} />
                <span className={`map-dot ${k}`} />
                {t(KIND_LABEL[k])}
              </label>
            ) : (
              <span key={k} className="map-legend-row">
                <span className={`map-dot ${k}`} />
                {t(KIND_LABEL[k])}
              </span>
            ),
          )}
        </div>

        {!focused && <p className="map-hint">{t('map.hint')}</p>}

        {focused && items[focused.id] && (
          <FocusCard
            node={focused}
            downCount={links?.down.size ?? 0}
            productsAffected={[...(links?.up ?? [])].filter((id) => graph.byId.get(id)?.kind === 'product').length}
            edges={graph.edges.filter((e) => e.to === focused.id).sort((a, b) => b.share - a.share)}
            onPick={pick}
            onOpen={() => onSelect(focused.id)}
            onClose={() => setFocus(null)}
          />
        )}
      </div>
    </div>
  );
}

function MapToolbar({ onBack, children }: { onBack: () => void; children?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="map-toolbar">
      <button className="btn ghost back" onClick={onBack}>
        {t('back')}
      </button>
      <h1 className="map-title">
        <MapIcon />
        {t('map.title')}
      </h1>
      {children}
    </div>
  );
}

interface CardProps {
  node: GraphNode;
  downCount: number;
  productsAffected: number;
  edges: { from: string; share: number }[];
  onPick: (id: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

function FocusCard({ node, downCount, productsAffected, edges, onPick, onOpen, onClose }: CardProps) {
  const { t, locale } = useI18n();
  const { data, fmt, priceLabel, unitCost } = useApp();
  const items = data.items;
  const item = items[node.id];
  const cost = unitCost(item);
  const pct = (v: number) => percent(v, locale);
  const sell = item.kind === 'recipe' ? item.sellPrice : null;
  const n = (v: number) => v.toLocaleString(locale);

  return (
    <aside className={`map-card ${node.kind}`} aria-live="polite">
      <div className="map-card-head">
        <span className={`map-dot ${node.kind}`} />
        <div className="grow">
          <h2>{item.name || t('untitled')}</h2>
          <span className="muted small">
            {t(KIND_LABEL[node.kind])}
            {item.category ? ` · ${item.category}` : ''}
          </span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      </div>

      <div className="map-card-cost">
        <span className="muted small">{t('map.cost')}</span>
        <b>{priceLabel(item)}</b>
        {sell && cost.ok && sell > 0 && (
          <span className="small">{t('map.sells', { price: money(sell, fmt), pct: pct((100 * cost.value) / sell) })}</span>
        )}
      </div>

      {node.kind === 'material' && productsAffected > 0 && (
        <p className="map-card-note small">{t('map.reach', { n: n(productsAffected) })}</p>
      )}
      {node.kind !== 'material' && downCount > 0 && (
        <p className="map-card-note small muted">{t('map.depth', { n: n(downCount) })}</p>
      )}

      {edges.length > 0 && (
        <section>
          <h3>{t('map.biggest')}</h3>
          <ul className="map-shares">
            {edges.slice(0, 6).map((e) => (
              <li key={e.from}>
                <button onClick={() => onPick(e.from)}>
                  <span className="ellipsis">{items[e.from]?.name || t('untitled')}</span>
                  <span className="map-share-num">{pct(e.share * 100)}</span>
                  <span className="map-share-bar" style={{ inlineSize: `${Math.max(2, e.share * 100)}%` }} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {node.usedBy.length > 0 && (
        <section>
          <h3>{t('map.usedIn')}</h3>
          <div className="map-chips">
            {node.usedBy.map((id) => (
              <button key={id} className="chip" onClick={() => onPick(id)}>
                {items[id]?.name || t('untitled')}
              </button>
            ))}
          </div>
        </section>
      )}

      <button className="btn primary map-open" onClick={onOpen}>
        {t('map.openItem')}
      </button>
    </aside>
  );
}
