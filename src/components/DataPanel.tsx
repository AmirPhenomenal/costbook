import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { useI18n, type Lang } from '../i18n';
import { useInstall } from '../pwa';
import { sampleItems } from '../sample';
import { useApp } from '../state';
import { emptyData, exportBackup, readBackup } from '../storage';
import { useConfirm } from './Confirm';

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
  const confirm = useConfirm();
  const { state: installState, install } = useInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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
    const ok =
      count === 0 ||
      (await confirm({
        title: t('data.importConfirm.title'),
        body: t('data.importConfirm', { n: n.toLocaleString(locale) }),
        ok: t('data.importConfirm.ok'),
        danger: true,
      }));
    if (ok) {
      dispatch({ type: 'replace', data: backup });
      setMessage(t('data.importDone', { n: n.toLocaleString(locale) }));
    }
  };

  const erase = async () => {
    const ok = await confirm({
      title: t('data.eraseConfirm.title'),
      body: t('data.eraseConfirm'),
      ok: t('data.erase'),
      danger: true,
    });
    if (ok) {
      dispatch({
        type: 'replace',
        data: {
          ...emptyData(lang),
          currency: data.currency,
          currencyAfter: data.currencyAfter,
        },
      });
      location.hash = '';
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="modal-root">
      <DialogBackdrop transition className="modal-backdrop" />
      <div className="modal-wrap">
        <DialogPanel transition className="modal panel">
          <div className="panel-head">
            <DialogTitle as="h2">{t('data.title')}</DialogTitle>
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
                  onChange={(e) =>
                    dispatch({
                      type: 'settings',
                      patch: { currency: e.target.value },
                    })
                  }
                />
              </label>
              <div className="field">
                <span className="field-label">{t('currency.position')}</span>
                <div className="segmented">
                  <button
                    className={!data.currencyAfter ? 'on' : ''}
                    onClick={() =>
                      dispatch({
                        type: 'settings',
                        patch: { currencyAfter: false },
                      })
                    }
                  >
                    {t('currency.before')}
                  </button>
                  <button
                    className={data.currencyAfter ? 'on' : ''}
                    onClick={() =>
                      dispatch({
                        type: 'settings',
                        patch: { currencyAfter: true },
                      })
                    }
                  >
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
                  onClick={() =>
                    dispatch({
                      type: 'settings',
                      patch: { currency: c.symbol, currencyAfter: c.after },
                    })
                  }
                >
                  {c.symbol}
                </button>
              ))}
            </div>
          </section>

          <section className="install-box">
            <h3>{t('install.title')}</h3>
            {installState === 'installed' ? (
              <p className="good-text">✓ {t('install.done')}</p>
            ) : (
              <>
                <p className="muted small">{t('install.body')}</p>
                {installState === 'available' && (
                  <button className="btn primary" onClick={() => void install()}>
                    {t('install.button')}
                  </button>
                )}
                {installState === 'ios' && <p className="notice">{t('install.ios')}</p>}
                {installState === 'unsupported' && <p className="small">{t('install.unsupported')}</p>}
              </>
            )}
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
                ? t('data.lastBackup', {
                    date: new Date(data.lastBackup).toLocaleDateString(locale, {
                      dateStyle: 'medium',
                    }),
                  })
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
              <button className="btn danger" onClick={() => void erase()} disabled={count === 0}>
                {t('data.erase')}
              </button>
            </div>
          </section>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
