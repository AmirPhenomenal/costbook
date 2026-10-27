#!/usr/bin/env node
/**
 * Privacy check: fails if the app's code could send data anywhere.
 *
 *   node scripts/check-no-network.mjs src dist
 *
 * 1. Source code (src/) must not use ANY network API or external URL.
 * 2. The built site (dist/) must not either. The only URLs allowed are
 *    XML namespace names (w3.org) and React's error-message link, which are
 *    plain text inside the React library and are never requested.
 * 3. dist/index.html must contain the Content-Security-Policy that makes the
 *    browser itself block all network connections (connect-src 'none').
 *
 * Runs in CI on every push, see .github/workflows/deploy.yml.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const NETWORK_APIS = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bsendBeacon\b/,
  /\bRTCPeerConnection\b/,
  /\bimportScripts\b/,
  /\bserviceWorker\b/,
  /\bnew\s+Worker\b/,
  /\bnew\s+Image\s*\(/,
  /\bWebTransport\b/,
];

const URL_RE = /\b(?:https?:|wss?:)\/\/[^\s"'`)<>]+/g;
const ALLOWED_URL = [
  /^http:\/\/www\.w3\.org\//, // XML/SVG namespace identifiers, not requests
  /^https:\/\/react\.dev\/errors\//, // text in React error messages
];

const TEXT_EXT = new Set(['.js', '.mjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.svg']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (TEXT_EXT.has(extname(p))) out.push(p);
  }
  return out;
}

const problems = [];
const dirs = process.argv.slice(2);
if (dirs.length === 0) dirs.push('src', 'dist');

for (const dir of dirs) {
  if (!existsSync(dir)) {
    console.log(`(skipping ${dir}: not found)`);
    continue;
  }
  const isSource = dir.replace(/\\/g, '/').replace(/\/$/, '').endsWith('src');
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    for (const re of NETWORK_APIS) {
      const m = re.exec(text);
      if (m) problems.push(`${file}: uses network API "${m[0]}"`);
    }
    for (const m of text.matchAll(URL_RE)) {
      const url = m[0];
      const ok = !isSource && ALLOWED_URL.some((a) => a.test(url));
      // Comments in source may mention URLs; strip line comments before judging.
      if (!ok) {
        if (isSource) {
          const line = text.slice(text.lastIndexOf('\n', m.index) + 1, text.indexOf('\n', m.index));
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        }
        problems.push(`${file}: contains external URL ${url}`);
      }
    }
  }
}

const html = join('dist', 'index.html');
if (dirs.includes('dist') && existsSync(html)) {
  const page = readFileSync(html, 'utf8');
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(page)?.[1] ?? '';
  if (!csp.includes("connect-src 'none'")) problems.push(`${html}: Content-Security-Policy with connect-src 'none' is missing`);
  if (!csp.includes("default-src 'none'")) problems.push(`${html}: Content-Security-Policy default-src 'none' is missing`);
  if (/(src|href)="(https?:)?\/\//.test(page)) problems.push(`${html}: loads something from another website`);
}

if (problems.length) {
  console.error('\n✗ Privacy check FAILED:\n  ' + problems.join('\n  ') + '\n');
  process.exit(1);
}
console.log(`✓ Privacy check passed: no network APIs or external URLs in ${dirs.join(', ')}.`);
