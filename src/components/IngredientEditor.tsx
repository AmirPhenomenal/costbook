import { lineCost, usedIn } from '../cost';
import { money, qty } from '../format';
import { useI18n } from '../i18n';
import { useApp } from '../state';
import type { Ingredient, Item } from '../types';
import { getUnit, unitsInFamily } from '../units';
import { EditorHeader, Notes } from './EditorHeader';
import { MoneyField } from './MoneyField';
import { NumberField } from './NumberField';
import { UnitSelect } from './UnitSelect';

/** Handy second units to show the price in, per language. */
const EN_EXTRA = ['g', 'lb', 'ml', 'floz', 'cm', 'ft', 'min', 'dozen', 'cm2'];
const FA_EXTRA = ['g', 'sir', 'ml', 'cm', 'min', 'dozen', 'cm2'];

interface Props {
  item: Ingredient;
  onSelect: (id: string | null) => void;
  returnTo?: Item | null;
}

export function IngredientEditor({ item, onSelect, returnTo }: Props) {
  const { data, dispatch, fmt, unitCost, displayUnit } = useApp();
  const { t, unit, unitOne, error, locale, lang } = useI18n();
  const set = (patch: Partial<Ingredient>) => dispatch({ type: 'upsert', item: { ...item, ...patch } });

  const family = getUnit(item.packUnit)?.family ?? 'mass';
  const cost = unitCost(item);
  const display = displayUnit(item);
  const perBase = cost.ok ? cost.value / getUnit(display)!.toBase : 0;
  const otherUnits = unitsInFamily(family)
    .filter((u) => u.id !== display && (lang === 'fa' ? FA_EXTRA : EN_EXTRA).includes(u.id))
    .slice(0, 2);
  const users = usedIn(data.items, item.id);

  return (
    <div className="editor">
      <EditorHeader item={item} onChange={(i) => set(i as Ingredient)} onSelect={onSelect} returnTo={returnTo} />

      <section className="card">
        <h2>{t('whatYouPay')}</h2>
        <p className="hint">{t('material.intro')}</p>
        <div className="buy-grid">
          <label className="field">
            <span className="field-label">{t('price.label')}</span>
            <MoneyField value={item.price} onChange={(price) => set({ price })} />
          </label>
          <div className="field">
            <span className="field-label">{t('pack.label')}</span>
            <span className="qty-unit">
              <NumberField value={item.packQty} onChange={(packQty) => set({ packQty })} aria-label={t('pack.label')} />
              <UnitSelect value={item.packUnit} onChange={(packUnit) => set({ packUnit })} aria-label={t('pack.label')} />
            </span>
          </div>
        </div>

        <div className="result">
          {cost.ok ? (
            <>
              <div className="big">{t('pricePer', { price: money(cost.value, fmt), unit: unitOne(display) })}</div>
              {otherUnits.length > 0 && (
                <div className="muted small">
                  {otherUnits.map((u) => t('pricePer', { price: money(perBase * u.toBase, fmt), unit: unitOne(u.id) })).join(' · ')}
                </div>
              )}
            </>
          ) : (
            <div className="warn">{error(cost.error)}</div>
          )}
        </div>

        <ul className="hint-list">
          <li>{t('buy.hint1')}</li>
          <li>{t('buy.hint2')}</li>
          <li>{t('buy.hint3')}</li>
        </ul>
      </section>

      <section className="card">
        <h2>{t('usedIn')}</h2>
        {users.length === 0 ? (
          <p className="muted small">{t('notUsed')}</p>
        ) : (
          <ul className="used-in">
            {users.map((r) => {
              const lines = r.components.filter((c) => c.itemId === item.id);
              const total = lines.reduce((s, l) => {
                const c = lineCost(data.items, l);
                return s + (c.ok ? c.value : 0);
              }, 0);
              return (
                <li key={r.id}>
                  <button className="link" onClick={() => onSelect(r.id)}>
                    {r.name || t('untitled')}
                  </button>
                  <span className="muted small">
                    {lines.map((l) => `${qty(l.qty, locale)} ${unit(l.unit)}`).join(' + ')} = {money(total, fmt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Notes value={item.notes} onChange={(notes) => set({ notes })} />
    </div>
  );
}
