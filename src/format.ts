export interface MoneyFormat {
  currency: string;
  currencyAfter: boolean;
  locale: string;
}

export function money(v: number, f: MoneyFormat): string {
  const abs = Math.abs(v);
  const max = abs === 0 ? 0 : abs < 0.01 ? 4 : abs < 1 ? 3 : abs >= 1000 ? 0 : 2;
  const min = abs >= 1000 || abs === 0 ? 0 : 2;
  const n = v.toLocaleString(f.locale, { minimumFractionDigits: Math.min(min, max), maximumFractionDigits: max });
  return f.currencyAfter ? `${n} ${f.currency}` : `${f.currency}${n}`;
}

export function qty(v: number, locale: string): string {
  return Number(v.toPrecision(10)).toLocaleString(locale, { maximumFractionDigits: 3 });
}

export function percent(v: number, locale: string): string {
  const n = v.toLocaleString(locale, { maximumFractionDigits: 1 });
  return locale.startsWith('fa') ? `${n}٪` : `${n}%`;
}

/** Number shown inside an input box: grouped, in the user's digits. */
export function inputNumber(v: number, locale: string): string {
  return Number(v.toPrecision(12)).toLocaleString(locale, { maximumFractionDigits: 6 });
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Read a number typed by a person. Accepts Persian/Arabic digits, thousands
 * separators (1,500 or ۱٬۵۰۰) and decimal marks "." "٫" or "/" (۲/۵).
 * Returns null if it is not a valid, non-negative number.
 */
export function parseNumber(text: string): number | null {
  let t = '';
  for (const ch of text.trim()) {
    const fi = FA_DIGITS.indexOf(ch);
    const ai = AR_DIGITS.indexOf(ch);
    if (fi >= 0) t += String(fi);
    else if (ai >= 0) t += String(ai);
    else if (ch === '٫' || ch === '/') t += '.';
    else if (ch === ',' || ch === '٬' || ch === '،' || ch === ' ' || ch === ' ' || ch === '‌') continue;
    else t += ch;
  }
  if (t === '') return 0;
  if (!/^\d*\.?\d*$/.test(t) || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
