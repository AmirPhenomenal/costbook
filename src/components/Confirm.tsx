import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';

export interface ConfirmOptions {
  title: string;
  body?: string;
  /** Text of the confirming button. */
  ok: string;
  /** Red button and warning icon, for things that delete data. */
  danger?: boolean;
}

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

/**
 * Themed replacement for window.confirm():
 *   const confirm = useConfirm();
 *   if (await confirm({ title, body, ok, danger: true })) { ... }
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Kept after closing so the text doesn't vanish during the fade-out.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback<Ask>((o) => {
    resolver.current?.(false);
    setOptions(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Dialog open={open} onClose={() => finish(false)} className="modal-root">
        <DialogBackdrop transition className="modal-backdrop" />
        <div className="modal-wrap">
          <DialogPanel transition className={`modal confirm ${options?.danger ? 'danger' : ''}`}>
            <div className="modal-icon" aria-hidden>
              {options?.danger ? (
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    d="M12 8v5M12 16.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <DialogTitle className="modal-title">{options?.title}</DialogTitle>
            {options?.body && <Description className="modal-body">{options.body}</Description>}
            <div className="modal-actions">
              {/* Cancel gets focus first, so pressing Enter by accident is safe. */}
              <button className="btn" onClick={() => finish(false)} data-autofocus>
                {t('cancel')}
              </button>
              <button className={`btn ${options?.danger ? 'solid-danger' : 'primary'}`} onClick={() => finish(true)}>
                {options?.ok}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ask;
}
