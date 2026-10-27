import { describe, expect, it } from 'vitest';
import { groupTyped, inputNumber, money, parseNumber } from './format';

describe('thousands separators in number boxes', () => {
  it('groups while typing, keeping what was typed', () => {
    expect(groupTyped('1800000', 'en-US')).toBe('1,800,000');
    expect(groupTyped('1,8000', 'en-US')).toBe('18,000');
    expect(groupTyped('1234.', 'en-US')).toBe('1,234.');
    expect(groupTyped('1234.50', 'en-US')).toBe('1,234.50');
    expect(groupTyped('', 'en-US')).toBe('');
    expect(groupTyped('12a', 'en-US')).toBeNull();
  });

  it('uses Persian digits and commas in Farsi', () => {
    expect(groupTyped('۱۸۰۰۰۰۰', 'fa-IR')).toBe('۱,۸۰۰,۰۰۰');
    expect(groupTyped('1800000/5', 'fa-IR')).toBe('۱,۸۰۰,۰۰۰٫۵');
    expect(inputNumber(1_800_000, 'fa-IR')).toBe('۱,۸۰۰,۰۰۰');
  });

  it('formatted text reads back as the same number', () => {
    for (const v of [0, 7, 1234, 1_800_000, 0.659, 12345.678]) {
      expect(parseNumber(inputNumber(v, 'en-US'))).toBe(v);
      expect(parseNumber(inputNumber(v, 'fa-IR'))).toBe(v);
    }
  });
});

describe('money', () => {
  const toman = { currency: 'تومان', currencyAfter: true, locale: 'fa-IR' };
  const usd = { currency: '$', currencyAfter: false, locale: 'en-US' };
  it('shows whole toman amounts without decimals', () => {
    expect(money(200, toman)).toBe('۲۰۰ تومان');
    expect(money(182.3, toman)).toBe('۱۸۲ تومان');
    expect(money(200_000, toman)).toBe('۲۰۰٬۰۰۰ تومان');
  });
  it('keeps cents for dollars, but not ".00" on whole amounts', () => {
    expect(money(1.5, usd)).toBe('$1.50');
    expect(money(12, usd)).toBe('$12');
    expect(money(0.659, usd)).toBe('$0.659');
  });
});
