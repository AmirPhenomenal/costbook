import { useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { groupTyped, inputNumber, isSignificant, parseNumber } from '../format';
import { useI18n } from '../i18n';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onChange: (n: number) => void;
};

/** How many digits / decimal marks come before position `pos`. */
const countBefore = (s: string, pos: number) => [...s.slice(0, pos)].filter(isSignificant).length;

/** Position right after the n-th digit / decimal mark. */
function positionAfter(s: string, n: number): number {
  if (n === 0) return 0;
  let seen = 0;
  for (let i = 0; i < s.length; i++) if (isSignificant(s[i]) && ++seen === n) return i + 1;
  return s.length;
}

/**
 * Number box that accepts "1.5", "1,500", "۱۵۰٬۰۰۰" or "۲/۵".
 * Thousands are split with commas while you type (1,800,000), and the cursor stays where it was.
 */
export function NumberField({ value, onChange, className, ...rest }: Props) {
  const { locale } = useI18n();
  const [text, setText] = useState(() => inputNumber(value, locale));
  const focused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  useEffect(() => {
    if (!focused.current || parseNumber(text) !== value) setText(inputNumber(value, locale));
    // Only react to outside changes of the value or language.
  }, [value, locale]);

  // Put the cursor back after the commas moved.
  useLayoutEffect(() => {
    if (caret.current !== null && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  });

  const invalid = parseNumber(text) === null;

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      dir="ltr"
      className={`num ${invalid ? 'invalid' : ''} ${className ?? ''}`}
      aria-invalid={invalid || undefined}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onChange={(e) => {
        let raw = e.target.value;
        let pos = e.target.selectionStart ?? raw.length;
        // Backspace on a comma: delete the digit before it instead of doing nothing.
        const stripped = (s: string) => [...s].filter(isSignificant).join('');
        if (raw.length < text.length && stripped(raw) === stripped(text) && pos > 0) {
          const n = countBefore(raw, pos);
          if (n > 0) {
            const at = positionAfter(raw, n) - 1;
            raw = raw.slice(0, at) + raw.slice(at + 1);
            pos = at;
          }
        }
        const grouped = groupTyped(raw, locale);
        if (grouped === null) {
          setText(raw); // not a number: keep it as typed and show it in red
        } else {
          caret.current = positionAfter(grouped, countBefore(raw, pos));
          setText(grouped);
        }
        const n = parseNumber(raw);
        if (n !== null) onChange(n);
      }}
      onBlur={() => {
        focused.current = false;
        setText(inputNumber(value, locale));
      }}
    />
  );
}
