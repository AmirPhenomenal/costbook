import { useI18n } from '../i18n';
import { sampleItems } from '../sample';
import { useApp } from '../state';

interface Props {
  onSelect: (id: string) => void;
}

/** First screen: explains the idea in three steps and offers an example. */
export function Welcome({ onSelect }: Props) {
  const { data, dispatch, createItem } = useApp();
  const { t, lang, setLang } = useI18n();
  const empty = Object.keys(data.items).length === 0;

  if (!empty) {
    return (
      <div className="placeholder">
        <p className="muted">{t('selectPrompt')}</p>
      </div>
    );
  }

  const loadExample = () => {
    const items = sampleItems(lang);
    dispatch({ type: 'addMany', items });
    const pizza = Object.values(items).find((i) => i.kind === 'recipe' && i.sellPrice !== null);
    if (pizza) onSelect(pizza.id);
  };

  return (
    <div className="welcome">
      <div className="welcome-top mobile-only">
        <span className="brand-name">Costbook</span>
        <button className="btn ghost lang" onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')} lang={lang === 'fa' ? 'en' : 'fa'}>
          {t('langSwitch')}
        </button>
      </div>
      <h1>{t('welcome.title')}</h1>
      <p className="lead">{t('welcome.lead')}</p>

      <ol className="steps">
        {(['1', '2', '3'] as const).map((n) => (
          <li key={n}>
            <span className="step-num">{Number(n).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}</span>
            <div>
              <b>{t(`step${n}.t`)}</b>
              <p className="muted">{t(`step${n}.d`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="welcome-actions">
        <button className="btn primary big" onClick={loadExample}>
          {t('welcome.example')}
          <span className="small block">{t('welcome.exampleSub')}</span>
        </button>
        <button className="btn big" onClick={() => onSelect(createItem('ingredient').id)}>
          {t('welcome.start')}
        </button>
      </div>

      <p className="private-note">
        <span aria-hidden>🔒</span> {t('welcome.private')}
      </p>
    </div>
  );
}
