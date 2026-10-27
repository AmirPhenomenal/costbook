import { useI18n } from '../i18n';
import { FAMILIES, UNITS, type UnitFamily } from '../units';

interface Props {
  value: string;
  onChange: (id: string) => void;
  /** Limit choices to one family (e.g. only weights). */
  family?: UnitFamily;
  className?: string;
  'aria-label'?: string;
}

export function UnitSelect({ value, onChange, family, className, ...rest }: Props) {
  const { unit, family: familyName } = useI18n();
  const opts = (f: UnitFamily) =>
    UNITS.filter((u) => u.family === f).map((u) => (
      <option key={u.id} value={u.id}>
        {unit(u.id)}
      </option>
    ));
  return (
    <select className={`unit ${className ?? ''}`} value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {family
        ? opts(family)
        : FAMILIES.map((f) => (
            <optgroup key={f} label={familyName(f)}>
              {opts(f)}
            </optgroup>
          ))}
    </select>
  );
}
