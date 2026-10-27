import { useI18n } from '../i18n';
import { sampleItems, type ExampleSet } from '../sample';
import { useApp } from '../state';

interface Props {
  onSelect: (id: string) => void;
}

const EXAMPLES: { set: ExampleSet; icon: string }[] = [
  { set: 'food', icon: '🍕' },
  { set: 'craft', icon: '🕯️' },
  { set: 'tech', icon: '🔌' },
];

/** First screen: explains the idea in three steps, then lets people start or open an example. */
export function Welcome({ onSelect }: Props) {
  const { data, dispatch, createItem } = useApp();
  const { t, lang, setLang, locale } = useI18n();
  const empty = Object.keys(data.items).length === 0;

  if (!empty) {
    return (
      <div className="placeholder">
        <p className="muted">{t('selectPrompt')}</p>
      </div>
    );
  }

  const loadExample = (set: ExampleSet) => {
    const items = sampleItems(lang, [set]);
    dispatch({ type: 'addMany', items });
    const product = Object.values(items).find((i) => i.kind === 'recipe' && i.sellPrice !== null);
    if (product) onSelect(product.id);
  };

  return (
    <div className="welcome">
      <div className="welcome-top mobile-only">
        <span className="brand-mini">
          <img src="./favicon.svg" alt="" width={28} height={28} />
          <span className="brand-name">Costbook</span>
        </span>
        <button className="btn ghost lang" onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')} lang={lang === 'fa' ? 'en' : 'fa'}>
          {t('langSwitch')}
        </button>
      </div>
      <h1>{t('welcome.title')}</h1>
      <p className="lead">{t('welcome.lead')}</p>

      <ol className="steps">
        {([1, 2, 3] as const).map((n) => (
          <li key={n}>
            <span className="step-num">{n.toLocaleString(locale)}</span>
            <div>
              <b>{t(`step${n}.t`)}</b>
              <p className="muted">{t(`step${n}.d`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <button className="btn primary big start" onClick={() => onSelect(createItem('recipe').id)}>
        {t('welcome.start')}
      </button>

      <h2 className="examples-title">{t('welcome.examples')}</h2>
      <div className="examples">
        {EXAMPLES.map(({ set, icon }) => (
          <button key={set} className="example" onClick={() => loadExample(set)}>
            <span className="example-icon" aria-hidden>
              {icon}
            </span>
            <span className="example-text">
              <b>{t(`ex.${set}`)}</b>
              <span className="muted small">{t(`ex.${set}.sub`)}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="private-note">
        <span aria-hidden>🔒</span> {t('welcome.private')}
      </p>
    </div>
  );
}
