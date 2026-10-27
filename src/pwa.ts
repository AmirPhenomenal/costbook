/**
 * "Install as an app" support.
 *
 * The offline helper (pwa/sw.js, built into dist/sw.js) only keeps a copy of
 * the app's own files so it opens without internet. Service workers cannot read
 * localStorage, and the app never sends it any messages, so it never sees your
 * items. See SECURITY.md.
 */
import { useSyncExternalStore } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'installed' | 'available' | 'ios' | 'unsupported';

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function isStandalone(): boolean {
  return (
    installed ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function currentState(): InstallState {
  if (isStandalone()) return 'installed';
  if (deferred) return 'available';
  if (isIOS()) return 'ios';
  return 'unsupported';
}

/** Called once at startup, before React renders. */
export function setupPwa() {
  // The browser offers installing only after it sees the offline helper.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        /* not supported here (for example a private window); the website still works */
      });
    });
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own button instead of the browser's banner
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

let snapshot: InstallState | null = null;
function subscribe(cb: () => void) {
  const l = () => {
    snapshot = null;
    cb();
  };
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot(): InstallState {
  return (snapshot ??= currentState());
}

export function useInstall(): {
  state: InstallState;
  install: () => Promise<void>;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const install = async () => {
    if (!deferred) return;
    const e = deferred;
    await e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === 'accepted') {
      deferred = null;
      installed = true;
    }
    emit();
  };
  return { state, install };
}
