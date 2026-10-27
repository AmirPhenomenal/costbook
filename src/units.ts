export type UnitFamily = 'mass' | 'volume' | 'count' | 'length' | 'area' | 'energy' | 'time';

export interface Unit {
  id: string;
  /** English label */
  en: string;
  /** Persian label */
  fa: string;
  family: UnitFamily;
  /** How many base units (g, ml, pcs, m, m², kWh, hour) one of this unit equals. */
  toBase: number;
}

export const UNITS: Unit[] = [
  { id: 'g', en: 'g', fa: 'گرم', family: 'mass', toBase: 1 },
  { id: 'kg', en: 'kg', fa: 'کیلوگرم', family: 'mass', toBase: 1000 },
  { id: 'mg', en: 'mg', fa: 'میلی‌گرم', family: 'mass', toBase: 0.001 },
  { id: 'ton', en: 'ton', fa: 'تن', family: 'mass', toBase: 1_000_000 },
  { id: 'lb', en: 'lb', fa: 'پوند', family: 'mass', toBase: 453.59237 },
  { id: 'oz', en: 'oz', fa: 'اونس', family: 'mass', toBase: 28.349523125 },
  { id: 'sir', en: 'sir (75 g)', fa: 'سیر', family: 'mass', toBase: 75 },
  { id: 'mesghal', en: 'mesghal (4.6 g)', fa: 'مثقال', family: 'mass', toBase: 4.608 },

  { id: 'ml', en: 'ml', fa: 'میلی‌لیتر', family: 'volume', toBase: 1 },
  { id: 'l', en: 'L', fa: 'لیتر', family: 'volume', toBase: 1000 },
  { id: 'tsp', en: 'tsp', fa: 'قاشق چای‌خوری', family: 'volume', toBase: 4.92892 },
  { id: 'tbsp', en: 'tbsp', fa: 'قاشق غذاخوری', family: 'volume', toBase: 14.7868 },
  { id: 'cup', en: 'cup', fa: 'پیمانه', family: 'volume', toBase: 236.588 },
  { id: 'floz', en: 'fl oz', fa: 'اونس مایع', family: 'volume', toBase: 29.5735 },
  { id: 'gal', en: 'gal', fa: 'گالن', family: 'volume', toBase: 3785.41 },

  { id: 'pcs', en: 'pcs', fa: 'عدد', family: 'count', toBase: 1 },
  { id: 'dozen', en: 'dozen', fa: 'دوجین', family: 'count', toBase: 12 },
  { id: 'hundred', en: '×100', fa: 'صدتایی', family: 'count', toBase: 100 },

  { id: 'mm', en: 'mm', fa: 'میلی‌متر', family: 'length', toBase: 0.001 },
  { id: 'cm', en: 'cm', fa: 'سانتی‌متر', family: 'length', toBase: 0.01 },
  { id: 'm', en: 'm', fa: 'متر', family: 'length', toBase: 1 },
  { id: 'in', en: 'in', fa: 'اینچ', family: 'length', toBase: 0.0254 },
  { id: 'ft', en: 'ft', fa: 'فوت', family: 'length', toBase: 0.3048 },

  { id: 'cm2', en: 'cm²', fa: 'سانتی‌متر مربع', family: 'area', toBase: 0.0001 },
  { id: 'm2', en: 'm²', fa: 'متر مربع', family: 'area', toBase: 1 },

  { id: 'wh', en: 'Wh', fa: 'وات‌ساعت', family: 'energy', toBase: 0.001 },
  { id: 'kwh', en: 'kWh', fa: 'کیلووات‌ساعت', family: 'energy', toBase: 1 },

  { id: 'sec', en: 'sec', fa: 'ثانیه', family: 'time', toBase: 1 / 3600 },
  { id: 'min', en: 'min', fa: 'دقیقه', family: 'time', toBase: 1 / 60 },
  { id: 'h', en: 'hour', fa: 'ساعت', family: 'time', toBase: 1 },
];

/** Unit used to display "price per …" for each family. */
export const DISPLAY_UNIT: Record<UnitFamily, string> = {
  mass: 'kg',
  volume: 'l',
  count: 'pcs',
  length: 'm',
  area: 'm2',
  energy: 'kwh',
  time: 'h',
};

/** Sensible unit for a new recipe line (you add 250 g of flour, not 0.25 kg). */
export const LINE_DEFAULT_UNIT: Record<UnitFamily, string> = {
  mass: 'g',
  volume: 'ml',
  count: 'pcs',
  length: 'cm',
  area: 'cm2',
  energy: 'kwh',
  time: 'min',
};

export const FAMILIES: UnitFamily[] = ['mass', 'volume', 'count', 'length', 'area', 'energy', 'time'];

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));

export function getUnit(id: string): Unit | undefined {
  return BY_ID.get(id);
}

export function unitsInFamily(family: UnitFamily): Unit[] {
  return UNITS.filter((u) => u.family === family);
}
