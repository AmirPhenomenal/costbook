export interface MoneyFormat {
  currency: string;
  currencyAfter: boolean;
  locale: string;
}

/** Currencies with no cents in daily use: amounts of 1 or more are shown as whole numbers. */
const NO_CENTS = new Set(['تومان', 'ریال', 'toman', 'rial', 'irr', 'irt', '¥', 'jpy', '₩', 'krw']);

export function money(v: number, f: MoneyFormat): string {
  const abs = Math.abs(v);
  const noCents = NO_CENTS.has(f.currency.trim().toLowerCase());
  const max = abs === 0 ? 0 : abs < 0.01 ? 4 : abs < 1 ? 3 : abs >= 1000 || noCents ? 0 : 2;
  // Cents are shown as "1.50", but a whole amount stays whole: "$12", "200 تومان" (not "200.00").
  const whole = Math.abs(abs - Math.round(abs)) < 0.005;
  const min = whole || max === 0 ? 0 : 2;
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

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const SEPARATORS = new Set([',', '٬', '،', ' ', ' ', '‌']);

/** Number shown inside an input box: thousands split with "," (1,800,000), in the user's digits. */
export function inputNumber(v: number, locale: string): string {
  const plain = Number(v.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 6, useGrouping: false });
  return groupTyped(plain, locale) ?? plain;
}

/**
 * Re-groups what someone is typing: "1800000.5" → "1,800,000.5".
 * Keeps everything they typed (trailing ".", zeros after the point), only moves the commas.
 * Returns null if the text is not a number, so the box can leave it alone and show it as invalid.
 */
export function groupTyped(text: string, locale: string): string | null {
  let ascii = '';
  for (const ch of text.trim()) {
    const fi = FA_DIGITS.indexOf(ch);
    const ai = AR_DIGITS.indexOf(ch);
    if (fi >= 0) ascii += String(fi);
    else if (ai >= 0) ascii += String(ai);
    else if (ch === '.' || ch === '٫' || ch === '/') ascii += '.';
    else if (SEPARATORS.has(ch)) continue;
    else ascii += ch;
  }
  if (!/^\d*\.?\d*$/.test(ascii)) return null;
  const [int, frac] = ascii.split('.');
  const fa = locale.startsWith('fa');
  let out = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (frac !== undefined) out += (fa ? '٫' : '.') + frac;
  return fa ? out.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : out;
}

/** Digits and the decimal mark: the characters that matter for keeping the cursor in place. */
export function isSignificant(ch: string): boolean {
  return /[\d.٫/]/.test(ch) || FA_DIGITS.includes(ch) || AR_DIGITS.includes(ch);
}

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
