#!/usr/bin/env node
// Static site generator for the project site. No dependencies.
//   node build.mjs          -> writes dist/
// Pages live in src/pages/*.html. The first line of each page is a JSON
// comment: <!--{"path":"/canopy/","title":"...","description":"..."}-->
// {{name}} tokens are filled from config.json, the page's own JSON, and the
// generated lists below.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const site = `https://${cfg.domain}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const projectCards = cfg.projects.map(p => `
  <article class="project">
    <div>
      <h3><img src="/assets/${p.slug}/mark.svg" alt="" width="34" height="34"><a href="/${p.slug}/">${esc(p.name)}</a><span class="pill"><i class="dot amber"></i>${esc(p.status)}</span></h3>
      <p>${esc(p.summary)}</p>
      <p class="links"><a href="/${p.slug}/">How it works</a><a href="${cfg.github}/${p.repo}">Source</a><span>${esc(p.license)}</span></p>
    </div>
    <figure><img src="/assets/${p.slug}/map.jpg" alt="${esc(p.name)} running: its live view of a repository" width="800" height="477" loading="lazy"></figure>
  </article>`).join('');

const KINDS = [['company', 'Companies'], ['team', 'Teams'], ['product', 'Products']];
const adopterWall = cfg.adopters.length
  ? KINDS.map(([kind, label]) => {
      const list = cfg.adopters.filter(a => a.kind === kind);
      if (!list.length) return '';
      return `<h3>${label}</h3><ul class="wall">${list.map(a => `
        <li><a href="${esc(a.url)}" rel="noopener"><img src="/assets/adopters/${esc(a.logo)}" alt="${esc(a.name)}" height="40" loading="lazy"></a>
        <span>${esc(a.uses.join(', '))}</span></li>`).join('')}</ul>`;
    }).join('')
  : `<p class="empty">No logos yet. If your company, team or product uses a project from here, yours can be the first.</p>`;

const lists = { projectCards, adopterWall, year: new Date().getFullYear(), site };

const fill = (text, vars) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const layout = readFileSync(join(root, 'src/_layout.html'), 'utf8');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
cpSync(join(root, 'src/static'), dist, { recursive: true });

const pages = [];
for (const file of readdirSync(join(root, 'src/pages')).filter(f => f.endsWith('.html'))) {
  const raw = readFileSync(join(root, 'src/pages', file), 'utf8');
  const m = raw.match(/^<!--(\{.*?\})-->\n/s);
  if (!m) throw new Error(`${file}: first line must be a JSON comment`);
  const meta = JSON.parse(m[1]);
  for (const k in meta) if (typeof meta[k] === 'string') meta[k] = fill(meta[k], cfg);
  const vars = { ...cfg, ...lists, image: '/assets/og.png', bodyClass: '', ...meta };
  vars.canonical = site + meta.path;
  vars.content = fill(raw.slice(m[0].length), vars);
  const html = fill(layout, vars);
  const left = html.match(/\{\{\w+\}\}/);
  if (left) throw new Error(`${file}: unknown token ${left[0]}`);
  const out = meta.path.endsWith('/') ? join(dist, meta.path, 'index.html') : join(dist, meta.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  if (!meta.noindex) pages.push(meta);
}

// Files for crawlers and for agents.
writeFileSync(join(dist, 'CNAME'), cfg.domain + '\n');
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(p => `  <url><loc>${site}${p.path}</loc></url>`).join('\n') + `\n</urlset>\n`);
writeFileSync(join(dist, 'llms.txt'), fill(readFileSync(join(root, 'src/llms.txt'), 'utf8'), {
  ...cfg, site,
  projectList: cfg.projects.map(p => `- [${p.name}](${site}/${p.slug}/): ${p.summary} Source: ${cfg.github}/${p.repo}`).join('\n'),
}));
console.log(`built ${pages.length} pages for ${cfg.domain} -> dist/`);
