/**
 * Everything is saved ONLY in this browser's localStorage.
 * There is no server, no account, no sync, no analytics.
 */
import type { AppData, Component, Item } from './types';
import { getUnit } from './units';

const KEY = 'costbook:data:v1';

export function emptyData(lang: 'en' | 'fa' = 'en'): AppData {
  return lang === 'fa'
    ? { version: 1, currency: 'تومان', currencyAfter: true, targetCostPercent: 30, lastBackup: null, items: {} }
    : { version: 1, currency: '$', currencyAfter: false, targetCostPercent: 30, lastBackup: null, items: {} };
}

export function loadData(lang: 'en' | 'fa' = 'en'): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData(lang);
    return sanitize(JSON.parse(raw)) ?? emptyData(lang);
  } catch {
    return emptyData(lang);
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_KEY = KEY;

/** Ask the browser not to auto-delete our storage (no network involved). */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* not supported */
  }
}

/** Download a backup file. Created locally — nothing is uploaded. */
export function exportBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `costbook-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readBackup(file: File): Promise<AppData | null> {
  try {
    return sanitize(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}

// ---------- validation (never trust a file or stored blob blindly) ----------

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const unit = (v: unknown, fallback: string): string => (typeof v === 'string' && getUnit(v) ? v : fallback);

function sanitizeItem(v: unknown): Item | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = str(o.id, 100);
  if (!id) return null;
  const base = {
    id,
    name: str(o.name) || 'Untitled',
    category: str(o.category, 80),
    notes: str(o.notes, 5000),
    updatedAt: num(o.updatedAt, Date.now()),
  };
  if (o.kind === 'ingredient') {
    return {
      ...base,
      kind: 'ingredient',
      price: num(o.price),
      packQty: num(o.packQty, 1),
      packUnit: unit(o.packUnit, 'kg'),
    };
  }
  if (o.kind === 'recipe') {
    const comps: Component[] = Array.isArray(o.components)
      ? o.components.flatMap((c): Component[] => {
          if (!c || typeof c !== 'object') return [];
          const r = c as Record<string, unknown>;
          const itemId = str(r.itemId, 100);
          if (!itemId) return [];
          return [{ id: str(r.id, 100) || crypto.randomUUID(), itemId, qty: num(r.qty), unit: unit(r.unit, 'g') }];
        })
      : [];
    return {
      ...base,
      kind: 'recipe',
      components: comps,
      yieldQty: num(o.yieldQty, 1),
      yieldUnit: unit(o.yieldUnit, 'pcs'),
      sellPrice: typeof o.sellPrice === 'number' && Number.isFinite(o.sellPrice) ? o.sellPrice : null,
    };
  }
  return null;
}

export function sanitize(v: unknown): AppData | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!o.items || typeof o.items !== 'object') return null;
  const items: Record<string, Item> = {};
  for (const raw of Object.values(o.items as Record<string, unknown>)) {
    const it = sanitizeItem(raw);
    if (it) items[it.id] = it;
  }
  const target = num(o.targetCostPercent, 30);
  return {
    version: 1,
    currency: str(o.currency, 12) || '$',
    currencyAfter: o.currencyAfter === true,
    targetCostPercent: target > 0 && target < 100 ? target : 30,
    lastBackup: typeof o.lastBackup === 'number' && Number.isFinite(o.lastBackup) ? o.lastBackup : null,
    items,
  };
}
