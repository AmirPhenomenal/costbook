import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { inputNumber, parseNumber } from '../format';
import { useI18n } from '../i18n';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onChange: (n: number) => void;
};

/**
 * Number box that accepts "1.5", "1,500", "۱۵۰٬۰۰۰" or "۲/۵",
 * and doesn't fight you while you are typing.
 */
export function NumberField({ value, onChange, className, ...rest }: Props) {
  const { locale } = useI18n();
  const [text, setText] = useState(() => inputNumber(value, locale));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current || parseNumber(text) !== value) setText(inputNumber(value, locale));
    // Only react to outside changes of the value or language.
  }, [value, locale]);

  const invalid = parseNumber(text) === null;

  return (
    <input
      {...rest}
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
        setText(e.target.value);
        const n = parseNumber(e.target.value);
        if (n !== null) onChange(n);
      }}
      onBlur={() => {
        focused.current = false;
        setText(inputNumber(value, locale));
      }}
    />
  );
}
