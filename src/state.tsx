import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { costPerBase, costPerYieldUnit, type Cost } from './cost';
import { money, type MoneyFormat } from './format';
import { useI18n } from './i18n';
import { loadData, requestPersistentStorage, saveData, STORAGE_KEY } from './storage';
import type { AppData, Ingredient, Item, Recipe } from './types';
import { newId } from './types';
import { DISPLAY_UNIT, getUnit } from './units';

type Settings = Pick<AppData, 'currency' | 'currencyAfter' | 'targetCostPercent' | 'lastBackup'>;

export type Action =
  | { type: 'upsert'; item: Item }
  | { type: 'remove'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'addMany'; items: Record<string, Item> }
  | { type: 'replace'; data: AppData };

function reducer(state: AppData, a: Action): AppData {
  switch (a.type) {
    case 'upsert':
      return { ...state, items: { ...state.items, [a.item.id]: { ...a.item, updatedAt: Date.now() } } };
    case 'remove': {
      const items: AppData['items'] = {};
      for (const it of Object.values(state.items)) {
        if (it.id === a.id) continue;
        items[it.id] =
          it.kind === 'recipe' && it.components.some((c) => c.itemId === a.id)
            ? { ...it, components: it.components.filter((c) => c.itemId !== a.id) }
            : it;
      }
      return { ...state, items };
    }
    case 'settings':
      return { ...state, ...a.patch };
    case 'addMany':
      return { ...state, items: { ...state.items, ...a.items } };
    case 'replace':
      return a.data;
  }
}

interface Ctx {
  data: AppData;
  fmt: MoneyFormat;
  saveFailed: boolean;
  dispatch: (a: Action) => void;
  createItem: (kind: Item['kind'], name?: string, category?: string) => Item;
  /** Short price label like "$0.72 / kg". */
  priceLabel: (item: Item) => string;
  /** Cost of one display unit (ingredient: per kg/L/pcs…, recipe: per yield unit). */
  unitCost: (item: Item) => Cost;
  /** Unit that unitCost() refers to. */
  displayUnit: (item: Item) => string;
}

const AppContext = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { lang, locale, unit } = useI18n();
  const [data, dispatch] = useReducer(reducer, lang, loadData);
  const [saveFailed, setSaveFailed] = useState(false);
  const skipSave = useRef(true);

  // Save to this browser's localStorage whenever data changes.
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const t = setTimeout(() => setSaveFailed(!saveData(data)), 200);
    return () => clearTimeout(t);
  }, [data]);

  // Keep several open tabs in sync.
  useEffect(() => {
    requestPersistentStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        skipSave.current = true;
        dispatch({ type: 'replace', data: loadData() });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fmt = useMemo<MoneyFormat>(
    () => ({ currency: data.currency, currencyAfter: data.currencyAfter, locale }),
    [data.currency, data.currencyAfter, locale],
  );

  const createItem = useCallback((kind: Item['kind'], name = '', category = ''): Item => {
    const base = { id: newId(), name, category, notes: '', updatedAt: Date.now() };
    const item: Item =
      kind === 'ingredient'
        ? ({ ...base, kind, price: 0, packQty: 1, packUnit: 'kg' } satisfies Ingredient)
        : ({ ...base, kind, components: [], yieldQty: 1, yieldUnit: 'pcs', sellPrice: null } satisfies Recipe);
    dispatch({ type: 'upsert', item });
    return item;
  }, []);

  const displayUnit = useCallback(
    (item: Item) => (item.kind === 'recipe' ? item.yieldUnit : DISPLAY_UNIT[getUnit(item.packUnit)?.family ?? 'mass']),
    [],
  );

  const unitCost = useCallback(
    (item: Item): Cost => {
      if (item.kind === 'recipe') return costPerYieldUnit(data.items, item);
      const per = costPerBase(data.items, item.id);
      if (!per.ok) return per;
      return { ok: true, value: per.value * getUnit(displayUnit(item))!.toBase };
    },
    [data.items, displayUnit],
  );

  const priceLabel = useCallback(
    (item: Item): string => {
      const c = unitCost(item);
      return c.ok ? `${money(c.value, fmt)} / ${unit(displayUnit(item))}` : '—';
    },
    [unitCost, fmt, unit, displayUnit],
  );

  const value = useMemo<Ctx>(
    () => ({ data, fmt, saveFailed, dispatch, createItem, priceLabel, unitCost, displayUnit }),
    [data, fmt, saveFailed, createItem, priceLabel, unitCost, displayUnit],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---- tiny hash router: #/item/<id> makes the phone "back" button work ----

export function useSelection(): [string | null, (id: string | null) => void] {
  const read = () => {
    const m = /^#\/item\/(.+)$/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : null;
  };
  const [id, setId] = useState<string | null>(read);
  useEffect(() => {
    const on = () => setId(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const select = useCallback((next: string | null) => {
    if (next) location.hash = `#/item/${encodeURIComponent(next)}`;
    else if (location.hash) history.pushState(null, '', location.pathname + location.search);
    setId(next);
  }, []);
  return [id, select];
}
