import { defineConfig, type Plugin } from 'vite';

/**
 * Content-Security-Policy added to the built page.
 *
 * This is the browser-enforced guarantee that the app cannot talk to any
 * server: `connect-src 'none'` blocks fetch / XHR / WebSocket / beacons, and
 * every other source is limited to files shipped with the app itself.
 * (Only applied to the production build, because the local dev server needs
 * a WebSocket for live-reload.)
 */
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "manifest-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'costbook-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- CSP -->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  // Relative paths so the site works under any GitHub Pages repo name.
  base: './',
  plugins: [contentSecurityPolicy()],
  build: {
    sourcemap: false,
    // Vite's preload helper uses fetch() to load the app's own files.
    // Turned off so the shipped code contains no network calls at all.
    modulePreload: { polyfill: false },
  },
});
