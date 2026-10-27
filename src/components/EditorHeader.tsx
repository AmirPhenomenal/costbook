import { useMemo } from 'react';
import { usedIn } from '../cost';
import { useI18n } from '../i18n';
import { MAP, useApp } from '../state';
import { MapIcon } from './MapView';
import type { Item } from '../types';
import { newId } from '../types';
import { useConfirm } from './Confirm';

interface Props {
  item: Item;
  onChange: (item: Item) => void;
  onSelect: (id: string | null) => void;
  /** The product the user came from, offered as a way back. */
  returnTo?: Item | null;
}

export function EditorHeader({ item, onChange, onSelect, returnTo }: Props) {
  const { data, dispatch } = useApp();
  const { t, locale, lang } = useI18n();
  const confirm = useConfirm();
  const categories = useMemo(
    () => [...new Set(Object.values(data.items).map((i) => i.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, locale)),
    [data.items, locale],
  );

  const duplicate = () => {
    const name = `${item.name} ${t('copySuffix')}`.trim();
    const copy: Item =
      item.kind === 'recipe'
        ? { ...item, id: newId(), name, components: item.components.map((c) => ({ ...c, id: newId() })) }
        : { ...item, id: newId(), name };
    dispatch({ type: 'upsert', item: copy });
    onSelect(copy.id);
  };

  const remove = async () => {
    const users = usedIn(data.items, item.id);
    const name = item.name || t('untitled');
    const ok = await confirm({
      title: t('confirmDelete', { name }),
      body: users.length
        ? t('confirmDeleteUsed', { list: users.map((u) => u.name || t('untitled')).join(lang === 'fa' ? '، ' : ', ') })
        : t('confirmDeleteBody'),
      ok: t('delete'),
      danger: true,
    });
    if (ok) {
      dispatch({ type: 'remove', id: item.id });
      onSelect(null);
    }
  };

  return (
    <header className="editor-header">
      <div className={`editor-toolbar ${returnTo ? 'has-return' : ''}`}>
        <button className="btn ghost back" onClick={() => onSelect(null)}>
          {t('back')}
        </button>
        {returnTo && (
          <button className="btn ghost return" onClick={() => onSelect(returnTo.id)}>
            <span className="ellipsis">{t('backTo', { name: returnTo.name || t('untitled') })}</span>
          </button>
        )}
        <span className={`badge ${item.kind}`}>{t(item.kind === 'recipe' ? 'kind.recipe' : 'kind.ingredient')}</span>
        <span className="grow" />
        <button className="btn ghost" onClick={() => onSelect(MAP + item.id)} title={t('map.show')}>
          <MapIcon />
          <span className="hide-phone">{t('map.title')}</span>
        </button>
        {item.kind === 'recipe' && (
          <button className="btn ghost hide-phone" onClick={() => window.print()}>
            {t('print')}
          </button>
        )}
        <button className="btn ghost" onClick={duplicate}>
          {t('duplicate')}
        </button>
        <button className="btn ghost danger" onClick={remove}>
          {t('delete')}
        </button>
      </div>
      <input
        className="title-input"
        value={item.name}
        placeholder={t(item.kind === 'recipe' ? 'name.recipe.ph' : 'name.ingredient.ph')}
        aria-label={t('name')}
        autoFocus={!item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />
      <label className="category">
        <span className="muted small">{t('category')}</span>
        <input
          list="categories"
          value={item.category}
          placeholder={t('category.ph')}
          onChange={(e) => onChange({ ...item, category: e.target.value })}
        />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
    </header>
  );
}

export function Notes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <section className="card no-print-empty">
      <h2>{t('notes')}</h2>
      <textarea rows={3} value={value} placeholder={t('notes.ph')} onChange={(e) => onChange(e.target.value)} />
    </section>
  );
}
