import { useApp } from '../state';
import { NumberField } from './NumberField';

interface Props {
  value: number;
  onChange: (n: number) => void;
  id?: string;
  'aria-label'?: string;
}

/** Number box with the currency shown before or after it. */
export function MoneyField({ value, onChange, ...rest }: Props) {
  const { fmt } = useApp();
  return (
    <span className="money-input">
      {!fmt.currencyAfter && <span className="affix">{fmt.currency}</span>}
      <NumberField value={value} onChange={onChange} {...rest} />
      {fmt.currencyAfter && <span className="affix">{fmt.currency}</span>}
    </span>
  );
}
