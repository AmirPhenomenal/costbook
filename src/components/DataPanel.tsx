import { useEffect, useRef, useState } from 'react';
import { useI18n, type Lang } from '../i18n';
import { sampleItems } from '../sample';
import { useApp } from '../state';
import { emptyData, exportBackup, readBackup } from '../storage';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CURRENCY_PRESETS: { symbol: string; after: boolean }[] = [
  { symbol: 'تومان', after: true },
  { symbol: 'ریال', after: true },
  { symbol: '$', after: false },
  { symbol: '€', after: false },
  { symbol: '£', after: false },
];

/** Settings, privacy explanation and backup / restore. */
export function DataPanel({ open, onClose }: Props) {
  const { data, dispatch } = useApp();
  const { t, lang, setLang, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (open) setMessage(null);
  }, [open]);

  const count = Object.keys(data.items).length;

  const doExport = () => {
    const stamped = { ...data, lastBackup: Date.now() };
    exportBackup(stamped);
    dispatch({ type: 'settings', patch: { lastBackup: stamped.lastBackup } });
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    const backup = await readBackup(file);
    if (fileRef.current) fileRef.current.value = '';
    if (!backup) {
      setMessage(t('data.importBad'));
      return;
    }
    const n = Object.keys(backup.items).length;
    if (count === 0 || window.confirm(t('data.importConfirm', { n: n.toLocaleString(locale) }))) {
      dispatch({ type: 'replace', data: backup });
      setMessage(t('data.importDone', { n: n.toLocaleString(locale) }));
    }
  };

  const erase = () => {
    if (window.confirm(t('data.eraseConfirm'))) {
      dispatch({ type: 'replace', data: { ...emptyData(lang), currency: data.currency, currencyAfter: data.currencyAfter } });
      location.hash = '';
      onClose();
    }
  };

  return (
    <dialog ref={ref} className="panel" onClose={onClose} onCancel={onClose} aria-labelledby="panel-title">
      <div className="panel-head">
        <h2 id="panel-title">{t('data.title')}</h2>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      </div>

      <section>
        <h3>{t('lang.title')}</h3>
        <div className="segmented">
          {(
            [
              ['en', 'English'],
              ['fa', 'فارسی'],
            ] as [Lang, string][]
          ).map(([l, label]) => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)} lang={l}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>{t('currency.title')}</h3>
        <div className="currency-row">
          <label className="field">
            <span className="field-label">{t('currency.symbol')}</span>
            <input
              value={data.currency}
              maxLength={12}
              onChange={(e) => dispatch({ type: 'settings', patch: { currency: e.target.value } })}
            />
          </label>
          <div className="field">
            <span className="field-label">{t('currency.position')}</span>
            <div className="segmented">
              <button className={!data.currencyAfter ? 'on' : ''} onClick={() => dispatch({ type: 'settings', patch: { currencyAfter: false } })}>
                {t('currency.before')}
              </button>
              <button className={data.currencyAfter ? 'on' : ''} onClick={() => dispatch({ type: 'settings', patch: { currencyAfter: true } })}>
                {t('currency.after')}
              </button>
            </div>
          </div>
        </div>
        <div className="chips">
          {CURRENCY_PRESETS.map((c) => (
            <button
              key={c.symbol}
              className={`chip ${data.currency === c.symbol ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'settings', patch: { currency: c.symbol, currencyAfter: c.after } })}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </section>

      <section className="privacy-box">
        <h3>🔒 {t('data.privacy.title')}</h3>
        <p>{t('data.privacy.body')}</p>
      </section>

      <section>
        <h3>{t('data.backup.title')}</h3>
        <p className="muted small">{t('data.backup.body')}</p>
        <p className="small">
          {data.lastBackup
            ? t('data.lastBackup', { date: new Date(data.lastBackup).toLocaleDateString(locale, { dateStyle: 'medium' }) })
            : t('data.neverBackup')}
        </p>
        <div className="row-buttons">
          <button className="btn primary" onClick={doExport} disabled={count === 0}>
            {t('data.export')}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            {t('data.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void doImport(e.target.files?.[0])}
          />
        </div>
        {message && <p className="notice">{message}</p>}
      </section>

      <section>
        <h3>{t('data.more')}</h3>
        <div className="row-buttons">
          <button className="btn" onClick={() => dispatch({ type: 'addMany', items: sampleItems(lang) })}>
            {t('data.example')}
          </button>
          <button className="btn danger" onClick={erase} disabled={count === 0}>
            {t('data.erase')}
          </button>
        </div>
      </section>
    </dialog>
  );
}
