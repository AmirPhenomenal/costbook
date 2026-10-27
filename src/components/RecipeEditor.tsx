import { useMemo, useState } from 'react';
import {
  batchCost,
  breakdown,
  costPerYieldUnit,
  itemBaseUnit,
  lineCost,
  priceForCostPercent,
  usedIn,
  wouldCreateCycle,
} from '../cost';
import { money, percent, qty } from '../format';
import { useI18n } from '../i18n';
import { useApp } from '../state';
import type { Component, Item, Recipe } from '../types';
import { newId } from '../types';
import { getUnit, LINE_DEFAULT_UNIT } from '../units';
import { Breakdown } from './Breakdown';
import { EditorHeader, Notes } from './EditorHeader';
import { ItemSearch } from './ItemSearch';
import { MoneyField } from './MoneyField';
import { NumberField } from './NumberField';
import { UnitSelect } from './UnitSelect';

interface Props {
  item: Recipe;
  onSelect: (id: string | null) => void;
  returnTo?: Item | null;
}

/** Round a suggested price UP to 3 significant digits (12.37 → 12.4, 15,333 → 15,400). */
function niceRound(v: number): number {
  if (!(v > 0)) return 0;
  const step = 10 ** (Math.floor(Math.log10(v)) - 2);
  return Number((Math.ceil(v / step - 1e-9) * step).toPrecision(12));
}

export function RecipeEditor({ item, onSelect, returnTo }: Props) {
  const { data, dispatch, fmt, createItem, priceLabel } = useApp();
  const { t, unit, unitOne, error, locale } = useI18n();
  const [focusLine, setFocusLine] = useState<string | null>(null);
  const [scaleQty, setScaleQty] = useState(10);
  const set = (patch: Partial<Recipe>) => dispatch({ type: 'upsert', item: { ...item, ...patch } });
  const setLine = (id: string, patch: Partial<Component>) =>
    set({ components: item.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const batch = batchCost(data.items, item);
  const perUnit = costPerYieldUnit(data.items, item);
  const yieldLabel = unit(item.yieldUnit); // after an amount: "10 pcs"
  const yieldOne = unitOne(item.yieldUnit); // after "per": "per piece"
  const hasLines = item.components.length > 0;

  const candidates = useMemo(
    () => Object.values(data.items).filter((it) => !wouldCreateCycle(data.items, item.id, it.id)),
    [data.items, item.id],
  );

  const addLine = (child: Item) => {
    const fam = getUnit(itemBaseUnit(child))?.family ?? 'count';
    const lineUnit = child.kind === 'recipe' ? child.yieldUnit : LINE_DEFAULT_UNIT[fam];
    const line: Component = { id: newId(), itemId: child.id, qty: 1, unit: lineUnit };
    set({ components: [...item.components, line] });
    setFocusLine(line.id);
  };

  const lineCosts = item.components.map((c) => lineCost(data.items, c));
  const batchTotal = batch.ok ? batch.value : lineCosts.reduce((s, c) => s + (c.ok ? c.value : 0), 0);
  const nodes = useMemo(() => breakdown(data.items, item, item.yieldQty > 0 ? 1 / item.yieldQty : 1), [data.items, item]);
  const hasNested = item.components.some((c) => data.items[c.itemId]?.kind === 'recipe');
  const users = usedIn(data.items, item.id);

  const cost = perUnit.ok ? perUnit.value : null;
  const sell = item.sellPrice;
  const profit = cost !== null && sell ? sell - cost : null;

  const suggestions = useMemo(() => {
    if (cost === null || cost <= 0) return [];
    const target = data.targetCostPercent;
    const pcts = [...new Set([25, 30, 35, target])].sort((a, b) => a - b);
    return [
      ...pcts.map((p) => ({
        key: `p${p}`,
        label: t('pricing.costShare', { p: percent(p, locale) }),
        price: niceRound(priceForCostPercent(cost, p) ?? 0),
      })),
      ...[2, 3].map((x) => ({
        key: `x${x}`,
        label: t('pricing.markup', { x: x.toLocaleString(locale) }),
        price: niceRound(cost * x),
      })),
    ];
  }, [cost, data.targetCostPercent, t, locale]);

  return (
    <div className="editor">
      <EditorHeader item={item} onChange={(i) => set(i as Recipe)} onSelect={onSelect} returnTo={returnTo} />

      {/* ---------- New product: show the way ---------- */}
      {!hasLines && (
        <section className="guide">
          <h2>{t('guide.title')}</h2>
          <ol>
            {([1, 2, 3] as const).map((n) => (
              <li key={n}>
                <span className="step-num">{n.toLocaleString(locale)}</span>
                {t(`guide.${n}`)}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- The answer: what it costs you, and what you make ---------- */}
      {hasLines && (
        <section className="hero">
          <div className="hero-cost">
            <span className="label">{t('costPer', { unit: yieldOne })}</span>
            <span className="value">{cost !== null && hasLines ? money(cost, fmt) : '—'}</span>
            {!perUnit.ok && hasLines ? (
              <span className="warn small">{error(perUnit.error)}</span>
            ) : (
              hasLines && <span className="small explain">{t('costExplain')}</span>
            )}
          </div>
          <div className="hero-side">
            <label className="field">
              <span className="field-label">{t('sellPrice', { unit: yieldOne })}</span>
              <MoneyField id="sell" value={sell ?? 0} onChange={(v) => set({ sellPrice: v > 0 ? v : null })} />
            </label>
            <div className={`profit ${profit === null ? '' : profit >= 0 ? 'good' : 'bad'}`}>
              {profit !== null && sell ? (
                <>
                  <span className="field-label">{t('profitPer', { unit: yieldOne })}</span>
                  <span className="value">{money(profit, fmt)}</span>
                  <span className="small">
                    {profit < 0
                      ? t('loss', { x: money(-profit, fmt) })
                      : t('margin', { m: percent((profit / sell) * 100, locale), c: percent((cost! / sell) * 100, locale) })}
                  </span>
                </>
              ) : (
                <span className="muted small">{t('enterSell')}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Step 1: what goes into it ---------- */}
      <section className="card">
        <h2>{t('components')}</h2>
        <p className="hint">{t('components.hint')}</p>

        {hasLines ? (
          <div className="lines" role="table">
            <div className="line head" role="row">
              <span role="columnheader">{t('col.item')}</span>
              <span role="columnheader">{t('col.amount')}</span>
              <span role="columnheader" className="end">
                {t('col.cost')}
              </span>
              <span />
            </div>
            {item.components.map((line, i) => {
              const child = data.items[line.itemId];
              const c = lineCosts[i];
              const fam = child ? getUnit(itemBaseUnit(child))?.family : undefined;
              const share = c.ok && batchTotal > 0 ? (c.value / batchTotal) * 100 : 0;
              const noPrice = child?.kind === 'ingredient' && child.price === 0;
              return (
                <div className="line" role="row" key={line.id}>
                  <span className="line-name">
                    <span className={`dot ${child?.kind ?? ''}`} />
                    <span className="line-name-text">
                      {child ? (
                        <button className="link ellipsis" onClick={() => onSelect(child.id)} title={t('open')}>
                          {child.name || t('untitled')}
                        </button>
                      ) : (
                        <span className="warn">{t('deleted')}</span>
                      )}
                      {child && !noPrice && <span className="muted small">{priceLabel(child)}</span>}
                      {noPrice && (
                        <button className="link warn small" onClick={() => onSelect(child.id)}>
                          {t('setPrice')}
                        </button>
                      )}
                    </span>
                  </span>
                  <span className="line-amount">
                    <NumberField
                      value={line.qty}
                      autoFocus={focusLine === line.id}
                      onChange={(v) => setLine(line.id, { qty: v })}
                      aria-label={`${t('col.amount')}: ${child?.name ?? ''}`}
                    />
                    <UnitSelect
                      value={line.unit}
                      family={fam}
                      onChange={(u) => setLine(line.id, { unit: u })}
                      aria-label={t('col.amount')}
                    />
                  </span>
                  <span className="line-cost end">
                    {c.ok ? (
                      <>
                        <span className="money">{money(c.value, fmt)}</span>
                        <span className="share">
                          <span className="bar" aria-hidden>
                            <span style={{ width: `${Math.min(100, share)}%` }} />
                          </span>
                          <span className="muted small">{percent(share, locale)}</span>
                        </span>
                      </>
                    ) : (
                      <span className="warn small">{error(c.error)}</span>
                    )}
                  </span>
                  <button
                    className="icon-btn"
                    aria-label={`${t('remove')}: ${child?.name ?? ''}`}
                    title={t('remove')}
                    onClick={() => set({ components: item.components.filter((x) => x.id !== line.id) })}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <div className="line total" role="row">
              <span>{t('total')}</span>
              <span className="muted small">{t('batch', { qty: qty(item.yieldQty, locale), unit: yieldLabel })}</span>
              <span className="end money">{batch.ok ? money(batch.value, fmt) : '—'}</span>
              <span />
            </div>
          </div>
        ) : (
          <p className="empty-lines">{t('emptyLines')}</p>
        )}

        <ItemSearch
          candidates={candidates}
          describe={priceLabel}
          onPick={(id) => addLine(data.items[id])}
          onCreate={(name, kind) => addLine(createItem(kind, name))}
        />
      </section>

      {/* ---------- Step 2: how many it makes ---------- */}
      <section className="card">
        <h2>{t('yield.title')}</h2>
        <p className="hint">{t('yield.hint')}</p>
        <div className="yield">
          <span>{t('batchMakes')}</span>
          <span className="qty-unit">
            <NumberField
              value={item.yieldQty}
              onChange={(yieldQty) => set({ yieldQty })}
              aria-label={t('yield.title')}
              className="short"
            />
            <UnitSelect value={item.yieldUnit} onChange={(yieldUnit) => set({ yieldUnit })} aria-label={t('yield.title')} />
          </span>
        </div>
      </section>

      {/* ---------- Pricing helper ---------- */}
      {suggestions.length > 0 && (
        <section className="card">
          <h2>{t('pricing.title')}</h2>
          <p className="hint">{t('pricing.hint')}</p>
          <div className="suggestions">
            {suggestions.map((s) => {
              const current = sell !== null && Math.abs(sell - s.price) < 1e-9;
              return (
                <button key={s.key} className={`suggestion ${current ? 'on' : ''}`} onClick={() => set({ sellPrice: s.price })}>
                  <span className="suggestion-label">{s.label}</span>
                  <span className="money">{money(s.price, fmt)}</span>
                  <span className="suggestion-profit">{t('pricing.profit', { x: money(s.price - cost!, fmt) })}</span>
                  <span className="pill">{current ? t('pricing.current') : t('pricing.use')}</span>
                </button>
              );
            })}
          </div>
          <div className="custom-target">
            <span>{t('pricing.custom')}</span>
            <NumberField
              className="short"
              value={data.targetCostPercent}
              onChange={(v) => v > 0 && v < 100 && dispatch({ type: 'settings', patch: { targetCostPercent: v } })}
              aria-label={t('pricing.custom')}
            />
            <span>{t('pricing.ofPrice')}</span>
          </div>
        </section>
      )}

      {/* ---------- Quick calculator ---------- */}
      {cost !== null && hasLines && (
        <section className="card">
          <h2>{t('quick.title')}</h2>
          <div className="quick">
            <span>{t('quick.costOf')}</span>
            <NumberField value={scaleQty} onChange={setScaleQty} aria-label={t('quick.title')} className="short" />
            <span>{yieldLabel}</span>
            <span>=</span>
            <b className="big-inline">{money(cost * scaleQty, fmt)}</b>
            {sell ? (
              <span className="muted">
                ({t('quick.sells', { x: money(sell * scaleQty, fmt), p: money((sell - cost) * scaleQty, fmt) })})
              </span>
            ) : null}
          </div>
        </section>
      )}

      {/* ---------- Full breakdown ---------- */}
      {hasNested && cost !== null && (
        <section className="card">
          <h2>{t('breakdown.title', { unit: yieldOne })}</h2>
          <p className="hint">{t('breakdown.hint')}</p>
          <Breakdown nodes={nodes} total={cost} fmt={fmt} />
        </section>
      )}

      {users.length > 0 && (
        <section className="card">
          <h2>{t('usedIn')}</h2>
          <ul className="used-in">
            {users.map((r) => (
              <li key={r.id}>
                <button className="link" onClick={() => onSelect(r.id)}>
                  {r.name || t('untitled')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Notes value={item.notes} onChange={(notes) => set({ notes })} />
    </div>
  );
}
