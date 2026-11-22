#!/usr/bin/env node
// Tells IndexNow (Bing, Yandex, Seznam, Naver and others) which pages changed.
//   node indexnow.mjs        submits every page in dist/sitemap.xml
// The key is the name of the one 32-character .txt file in src/static/.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const key = readdirSync(join(root, 'src/static')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, 32);
const urlList = [...readFileSync(join(root, 'dist/sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: cfg.domain, key, keyLocation: `https://${cfg.domain}/${key}.txt`, urlList }) });
console.log(`IndexNow: ${res.status} for ${urlList.length} pages`);
