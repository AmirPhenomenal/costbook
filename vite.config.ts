import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Content-Security-Policy added to the built page.
 *
 * This is the browser-enforced guarantee that the app cannot talk to any
 * server: `connect-src 'none'` blocks fetch / XHR / WebSocket / beacons, and
 * every other source is limited to files shipped with the app itself.
 * `worker-src 'self'` allows only the app's own offline helper (pwa/sw.js).
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
  "worker-src 'self'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'costbook-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<!-- CSP -->', `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

/**
 * Writes dist/sw.js from pwa/sw.js with the list of the app's own files,
 * so the installed app can open offline. Runs after everything else is built.
 */
function offlineHelper(): Plugin {
  let outDir = 'dist';
  let root = '.';
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  return {
    name: 'costbook-offline-helper',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
    },
    closeBundle() {
      const files = walk(outDir)
        .map((p) => relative(outDir, p).split('\\').join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.txt'))
        .sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const list = ['./', ...files.map((f) => `./${f}`)];
      const sw = readFileSync(resolve(root, 'pwa/sw.js'), 'utf8')
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__FILES__', JSON.stringify(list, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  // Relative paths so the site works under any GitHub Pages repo name.
  base: './',
  plugins: [contentSecurityPolicy(), offlineHelper()],
  build: {
    sourcemap: false,
    // Vite's preload helper uses fetch() to load the app's own files.
    // Turned off so the shipped code contains no network calls at all.
    modulePreload: { polyfill: false },
    rollupOptions: {
      onwarn(warning, warn) {
        // Headless UI marks files "use client" for server frameworks; irrelevant here.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
});
