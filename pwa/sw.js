/*
 * Costbook offline helper (service worker).
 *
 * What it does: keeps a copy of Costbook's OWN files (the page, script, styles,
 * fonts, icons) so the installed app opens without internet.
 *
 * What it cannot do:
 *  - It cannot see your items. Service workers have no access to the page storage
 *    where Costbook keeps your data, and the app never sends it any messages.
 *  - It never contacts another website: every request that is not for this
 *    site's own files is ignored (and blocked by the page's security policy).
 *
 * The build (vite.config.ts) fills in the file list and version below.
 * scripts/check-no-network.mjs checks the built copy on every deploy.
 */
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = 'costbook-' + VERSION;
const PAGE_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Remove copies of older versions.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Only this site's own files. Anything else is left alone.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // The page: try for the newest version, use the saved copy when offline or slow.
    event.respondWith(
      new Promise((resolve) => {
        let done = false;
        const fallback = () =>
          caches.match('./', { ignoreSearch: true }).then((saved) => {
            if (saved && !done) {
              done = true;
              resolve(saved);
            }
            return saved;
          });
        const timer = setTimeout(fallback, PAGE_TIMEOUT_MS);
        fetch(request)
          .then((fresh) => {
            clearTimeout(timer);
            if (!done) {
              done = true;
              resolve(fresh);
            }
          })
          .catch(() => {
            clearTimeout(timer);
            fallback().then((saved) => {
              if (!done) {
                done = true;
                resolve(saved || Response.error());
              }
            });
          });
      }),
    );
    return;
  }

  // Script, styles, fonts, icons: the saved copy first (file names change with every version).
  event.respondWith(
    caches.match(request).then(
      (saved) =>
        saved ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
