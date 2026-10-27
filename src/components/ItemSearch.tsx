import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { Item } from '../types';

interface Props {
  candidates: Item[];
  onPick: (id: string) => void;
  onCreate: (name: string, kind: Item['kind']) => void;
  describe: (item: Item) => string;
}

type Option =
  | { type: 'item'; item: Item }
  | { type: 'create'; kind: Item['kind']; name: string };

/** Type to find an ingredient / sub-recipe to add, or create a new one on the spot. */
export function ItemSearch({ candidates, onPick, onCreate, describe }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo<Option[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = candidates
      .filter((it) => !q || it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return as - bs || a.name.localeCompare(b.name);
      })
      .slice(0, 8)
      .map((item): Option => ({ type: 'item', item }));
    const name = query.trim();
    const exact = candidates.some((c) => c.name.toLowerCase() === q);
    if (name && !exact) {
      matches.push({ type: 'create', kind: 'ingredient', name }, { type: 'create', kind: 'recipe', name });
    }
    return matches;
  }, [candidates, query]);

  const choose = (o: Option | undefined) => {
    if (!o) return;
    if (o.type === 'item') onPick(o.item.id);
    else onCreate(o.name, o.kind);
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  };

  return (
    <div className="search-add" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <span className="search-add-icon" aria-hidden>
        +
      </span>
      <input
        ref={inputRef}
        type="search"
        placeholder={t('addPh')}
        aria-label={t('addLabel')}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(options[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && options.length > 0 && (
        <ul className="search-add-list" role="listbox">
          {options.map((o, i) => (
            <li key={o.type === 'item' ? o.item.id : `new-${o.kind}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
              >
                {o.type === 'item' ? (
                  <>
                    <span className={`dot ${o.item.kind}`} />
                    <span className="grow ellipsis">{o.item.name || t('untitled')}</span>
                    <span className="muted small">{describe(o.item)}</span>
                  </>
                ) : (
                  <>
                    <span className="create">{t(o.kind === 'ingredient' ? 'createIngredient' : 'createRecipe')}</span>
                    <span className="grow ellipsis">{o.name}</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
