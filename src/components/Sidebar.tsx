import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { useInstall } from '../pwa';
import { isMap, MAP, useApp } from '../state';
import { MapIcon } from './MapView';
import type { Item } from '../types';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenData: () => void;
}

type Filter = 'all' | 'recipe' | 'ingredient';
type Kind = Item['kind'];

const BACKUP_REMINDER_DAYS = 14;
const KINDS: Kind[] = ['recipe', 'ingredient']; // products first: they are what people care about

export function Sidebar({ selectedId, onSelect, onOpenData }: Props) {
  const { data, createItem, priceLabel, saveFailed } = useApp();
  const { t, lang, setLang, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { state: installState, install } = useInstall();

  const all = Object.values(data.items);

  /** kind → [category, items][] */
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KINDS.filter((k) => filter === 'all' || filter === k)
      .map((kind) => {
        const map = new Map<string, Item[]>();
        for (const it of Object.values(data.items)) {
          if (it.kind !== kind) continue;
          if (q && !it.name.toLowerCase().includes(q) && !it.category.toLowerCase().includes(q)) continue;
          const k = it.category.trim();
          map.set(k, [...(map.get(k) ?? []), it]);
        }
        const groups = [...map.entries()]
          .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, locale)))
          .map(([cat, items]) => [cat, items.sort((a, b) => a.name.localeCompare(b.name, locale))] as const);
        return { kind, groups, count: groups.reduce((n, [, items]) => n + items.length, 0) };
      })
      .filter((s) => s.count > 0);
  }, [data.items, query, filter, locale]);

  const counts = {
    all: all.length,
    recipe: all.filter((i) => i.kind === 'recipe').length,
    ingredient: all.filter((i) => i.kind === 'ingredient').length,
  };

  // Remind about backups once there is real work to lose (not on day one).
  const oldest = all.reduce((m, i) => Math.min(m, i.updatedAt), Date.now());
  const DAY = 86_400_000;
  const needsBackup =
    all.length > 0 &&
    (data.lastBackup === null ? Date.now() - oldest > 2 * DAY : Date.now() - data.lastBackup > BACKUP_REMINDER_DAYS * DAY);

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="./favicon.svg" alt="" width={30} height={30} />
        <div className="brand-text">
          <span className="brand-name">Costbook</span>
          <span className="brand-tag">{t('tagline')}</span>
        </div>
        <button className="btn ghost lang" onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')} lang={lang === 'fa' ? 'en' : 'fa'}>
          {t('langSwitch')}
        </button>
      </div>

      <div className="new-buttons">
        <button className="new-btn product" onClick={() => onSelect(createItem('recipe').id)}>
          <span className="new-plus" aria-hidden>
            +
          </span>
          <span className="new-text">
            <b>{t('newRecipe')}</b>
            <span>{t('newRecipe.sub')}</span>
          </span>
        </button>
        <button className="new-btn material" onClick={() => onSelect(createItem('ingredient').id)}>
          <span className="new-plus" aria-hidden>
            +
          </span>
          <span className="new-text">
            <b>{t('newIngredient')}</b>
            <span>{t('newIngredient.sub')}</span>
          </span>
        </button>
      </div>

      {all.length > 1 && (
        <button className={`map-btn ${isMap(selectedId) ? 'on' : ''}`} onClick={() => onSelect(MAP)}>
          <MapIcon />
          <span className="new-text">
            <b>{t('map.open')}</b>
            <span>{t('map.sub')}</span>
          </span>
        </button>
      )}

      {all.length > 0 && (
        <div className="list-tools">
          <input
            className="sidebar-search"
            type="search"
            placeholder={t('search')}
            aria-label={t('search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips" role="tablist">
            {(['all', 'recipe', 'ingredient'] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`chip ${filter === f ? 'on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f !== 'all' && <span className={`dot ${f}`} />}
                {t(`filter.${f}`)} <span className="count">{counts[f].toLocaleString(locale)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="item-list">
        {sections.length === 0 && <p className="muted small pad">{all.length ? t('noMatch') : t('noItems')}</p>}
        {sections.map(({ kind, groups, count }) => (
          <section key={kind} className="kind-section">
            {filter === 'all' && (
              <h2 className="kind-title">
                <span className={`dot ${kind}`} />
                {t(`filter.${kind}`)}
                <span className="count">{count.toLocaleString(locale)}</span>
              </h2>
            )}
            {groups.map(([cat, items]) => (
              <div key={cat || '_none'} className="group">
                {(cat || groups.length > 1) && <h3 className="group-title">{cat || t('uncategorized')}</h3>}
                {items.map((it) => (
                  <button
                    key={it.id}
                    className={`item-row ${it.id === selectedId ? 'selected' : ''}`}
                    onClick={() => onSelect(it.id)}
                    aria-current={it.id === selectedId || undefined}
                  >
                    <span className={`dot ${it.kind}`} />
                    <span className="grow ellipsis">{it.name || <em className="muted">{t('untitled')}</em>}</span>
                    <span className="price">{priceLabel(it)}</span>
                  </button>
                ))}
              </div>
            ))}
          </section>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button className={`privacy ${saveFailed || needsBackup ? 'attention' : ''}`} onClick={onOpenData}>
          {saveFailed ? (
            <span className="warn">⚠ {t('saveFailed')}</span>
          ) : (
            <>
              <span className="lock" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="grow">
                {t('privacy.saved')}
                <span className={`small block ${needsBackup ? 'warn' : 'muted'}`}>
                  {needsBackup ? t('privacy.remind') : t('privacy.sub')}
                </span>
              </span>
            </>
          )}
        </button>
        {installState === 'available' && (
          <button className="install-cta" onClick={() => void install()} title={t('install.button')}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t('install.button')}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
