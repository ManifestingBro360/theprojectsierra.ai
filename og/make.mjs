#!/usr/bin/env node
// Renders the social preview images and the touch icon with headless Chrome.
//   node og/make.mjs      (macOS path to Chrome below; set CHROME to override)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
const A = join(root, 'src/static/assets');
const font = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400..700&display=block">`;
const base = `margin:0;width:1200px;height:630px;background:#0E0D0B;color:#F3F0E9;font-family:Geist,system-ui,sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box`;
const orgMark = `<svg viewBox="0 0 40 28" width="60" height="42"><rect y="2" width="24" height="24" rx="5" fill="#F3F0E9"/><circle cx="27" cy="14" r="12" fill="#4FCB9A" fill-opacity=".92"/></svg>`;

const shots = [
  ['og.png', 1200, 630, `<body style="${base}">${font}
    <div style="display:flex;align-items:center;gap:16px;font-size:30px;font-weight:600;letter-spacing:-0.6px">${orgMark}${cfg.org}</div>
    <div style="font-size:76px;font-weight:600;line-height:1.04;letter-spacing:-3.2px;max-width:980px">Tools for people and AI agents who build software together.</div>
    <div style="font-size:28px;color:#A69F93">${cfg.domain}</div></body>`],
  ['canopy/og.png', 1200, 630, `<body style="${base}">${font}
    <div style="display:flex;justify-content:space-between;align-items:center"><img src="file://${A}/canopy/logo-dark.svg" height="72"><div style="font-size:24px;color:#A69F93">from ${cfg.org}</div></div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:40px"><div style="font-size:70px;font-weight:600;line-height:1.04;letter-spacing:-3px;max-width:760px">Catch agent collisions while they work, not at merge.</div><img src="file://${A}/canopy/mark-dark.svg" height="250"></div>
    <div style="font-size:28px;color:#A69F93">An open-source layer above Git for code written by many AI agents &nbsp; ${cfg.domain}/canopy</div></body>`],
  ['apple-touch-icon.png', 180, 180, `<body style="margin:0;width:180px;height:180px;background:#FBFAF7;display:grid;place-items:center"><svg viewBox="0 0 40 28" width="120" height="84"><rect y="2" width="24" height="24" rx="5" fill="#16130F"/><circle cx="27" cy="14" r="12" fill="#0F7A55" fill-opacity=".92"/></svg></body>`],
];
for (const [out, w, h, html] of shots) {
  const page = join(tmp, out.replace('/', '-') + '.html');
  writeFileSync(page, '<!doctype html><meta charset="utf-8">' + html);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    `--window-size=${w},${h}`, '--virtual-time-budget=4000', `--screenshot=${join(A, out)}`, 'file://' + page], { stdio: 'ignore', timeout: 40000 });
  console.log('wrote', out);
}
