export interface Ingredient {
  id: string;
  kind: 'ingredient';
  name: string;
  category: string;
  /** What you paid for one pack. */
  price: number;
  /** How much is in that pack… */
  packQty: number;
  /** …and in which unit. */
  packUnit: string;
  notes: string;
  updatedAt: number;
}

export interface Component {
  id: string;
  itemId: string;
  qty: number;
  unit: string;
}

export interface Recipe {
  id: string;
  kind: 'recipe';
  name: string;
  category: string;
  components: Component[];
  /** How much one batch of this recipe makes. */
  yieldQty: number;
  yieldUnit: string;
  /** Optional selling price for one yield unit, to show profit & margin. */
  sellPrice: number | null;
  notes: string;
  updatedAt: number;
}

export type Item = Ingredient | Recipe;

export interface AppData {
  version: 1;
  currency: string;
  /** Show the currency after the number (e.g. 1,200 €) instead of before ($1,200). */
  currencyAfter: boolean;
  /** Default target: cost should be this % of the selling price (pricing helper). */
  targetCostPercent: number;
  /** When the user last downloaded a backup (ms), or null. */
  lastBackup: number | null;
  items: Record<string, Item>;
}

export function newId(): string {
  return crypto.randomUUID();
}
