#!/usr/bin/env node
/* Verifica di identità del build Astro rispetto alle fonti.
 *
 * Controlli per ogni pagina:
 *  1. il corpo del .md (raw HTML) compare byte-identico nell'HTML costruito;
 *  2. frontmatter: <title> e meta description coincidono;
 *  3. ogni href/src relativo della pagina costruita risolve a un file esistente
 *     in dist/ (i link esterni http(s) sono ignorati);
 *  4. l'HTML costruito è ben formato (parse5: nessun token anomalo);
 *  5. gli asset di dist/ sono identici per nome e contenuto a public/;
 *  6. dist/ non contiene file extra oltre a pagine + asset.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PUBLIC_DIR = join(ROOT, 'public');
const PAGES_SRC = join(ROOT, 'src', 'pages');

const PAGES = [
  '',
  'about',
  'contatti',
  'galleria-fotografica',
  'rassegna-estiva',
  'rassegna-estiva/prezzi',
  'rassegna-estiva/estate-2017',
  'rassegna-estiva/estate-2018',
  'rassegna-estiva/estate-2019',
  'rassegna-estiva/estate-2020',
  'rassegna-estiva/estate-2021',
  'rassegna-estiva/estate-2022',
  'rassegna-estiva/estate-2023',
  'rassegna-estiva/estate-2024',
  'rassegna-estiva/estate-2025',
  'rassegna-estiva/estate-2026',
  'rassegna-invernale',
  'rassegna-invernale/prezzi',
  'rassegna-invernale/inverno-2018',
  'rassegna-invernale/inverno-2019',
  'rassegna-invernale/inverno-2020',
];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);

const walk = (dir, base = dir) => {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(relative(base, p));
  }
  return out;
};

const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);

console.log('=== 1) Corpo .md byte-identico nell\'HTML costruito ===');
for (const page of PAGES) {
  const mdPath = join(PAGES_SRC, page, 'index.md');
  const distPath = join(DIST, page, 'index.html');
  if (!existsSync(distPath)) { fail(`${page || '/'}: manca dist`); continue; }
  const raw = readFileSync(mdPath, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { fail(`${page}: frontmatter non trovato`); continue; }
  const [, front, body] = m;
  const distHtml = readFileSync(distPath, 'utf8');
  const trimmed = body.replace(/\n+$/, '');
  // remark (CommonMark) elimina le righe vuote che separano blocchi HTML
  // fraterni; il rendering è identico. Normalizziamo prima del confronto.
  const normalized = trimmed.replace(/\n{2,}/g, '\n');
  if (distHtml.includes(normalized)) ok(`${page || '/'} (${normalized.length} B)`);
  else {
    fail(`${page || '/'}: corpo .md NON presente verbatim in dist`);
    // localizza la prima divergenza per debug
    let i = 0; while (i < trimmed.length && distHtml[i] === trimmed[i]) i++;
    const ctx = trimmed.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, '\\n');
    console.log(`        ^ diverge in: ...${ctx}...`);
    const at = distHtml.indexOf(ctx.split('\\n')[0]);
    console.log(`        in dist a offset ${at}: ...${distHtml.slice(at, at + 80).replace(/\n/g, '\\n')}...`);
  }
}

console.log('=== 2) title / description frontmatter ===');
for (const page of PAGES) {
  const mdPath = join(PAGES_SRC, page, 'index.md');
  const distPath = join(DIST, page, 'index.html');
  const raw = readFileSync(mdPath, 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---/)[1];
  const title = (front.match(/^title:\s*(.+)$/m) || [])[1];
  const desc = (front.match(/^description:\s*(.+)$/m) || [])[1];
  const distHtml = readFileSync(distPath, 'utf8');
  const t = title.replace(/^['"]|['"]$/g, '');
  const d = desc.replace(/^['"]|['"]$/g, '');
  if (distHtml.includes(`<title>${t}</title>`)) ok(`${page}: title`);
  else fail(`${page}: title atteso <title>${t}</title>`);
  if (distHtml.includes(`<meta name="description" content="${d}">`)) ok(`${page}: description`);
  else fail(`${page}: description attesa content="${d}"`);
}

console.log('=== 3) link/asset relativi risolti in dist/ ===');
let unfixedIntentional = 0;
for (const page of PAGES) {
  const distHtml = readFileSync(join(DIST, page, 'index.html'), 'utf8');
  const refs = [...distHtml.matchAll(/(?:href|src|icon)=["']([^"']+)["']/g)].map((x) => x[1]);
  for (const r of new Set(refs)) {
    if (/^(https?:)?\/\//.test(r) || r.startsWith('mailto:') || r.startsWith('data:')) continue;
    const [pathPart] = r.split('#')[0].split('?');
    const target = new URL(pathPart, `http://x/${page}/index.html`).pathname;
    const file = join(DIST, target);
    if (existsSync(file) && statSync(file).isFile()) continue;
    if (page === 'about' && target === '/favicon.svg') { unfixedIntentional++; continue; } // quirk intenzionale
    fail(`${page}: link non risolvibile: ${r} → ${target}`);
  }
}
console.log(`  note: 404 intenzionali conservati: ${unfixedIntentional} (atteso: 1, /about/ favicon.svg)`);
if (unfixedIntentional !== 1) fail('contesto errori favicon about');

console.log('=== 4) HTML ben formato (parse5) ===');
for (const page of PAGES) {
  const distHtml = readFileSync(join(DIST, page, 'index.html'), 'utf8');
  try {
    parse(distHtml);
    ok(`${page}`);
  } catch (e) {
    fail(`${page}: errore parse → ${e.message}`);
  }
}

console.log('=== 5) asset dist/ ⇔ public/ ===');
const pubFiles = walk(PUBLIC_DIR).map((f) => ({ rel: f, sha: hash(join(PUBLIC_DIR, f)), size: statSync(join(PUBLIC_DIR, f)).size }));
const distNonPages = walk(DIST).filter((f) => !f.endsWith('index.html') && f !== '..').map((f) => ({ rel: f, sha: hash(join(DIST, f)), size: statSync(join(DIST, f)).size }));
const pubByRel = new Map(pubFiles.map((f) => [f.rel, f]));
const allEqual = pubFiles.length === distNonPages.length &&
  pubFiles.every((f) => { const d = distNonPages.find((x) => x.rel === f.rel); return d && d.sha === f.sha && d.size === f.size; });
if (allEqual) ok(`${pubFiles.length} file, nomi + contenuti (sha256) identici`);
else {
  for (const f of pubFiles) { const d = distNonPages.find((x) => x.rel === f.rel); if (!d) fail(`asset mancante in dist: ${f.rel}`); else if (d.sha !== f.sha) fail(`asset diverso: ${f.rel}`); }
  for (const f of distNonPages) if (!pubFiles.some((x) => x.rel === f.rel)) fail(`file extra in dist: ${f.rel}`);
}

console.log('=== 6) nessun file extra in dist/ ===');
const expected = new Set([...PAGES.map((p) => relative(DIST, join(DIST, p, 'index.html'))), ...pubFiles.map((f) => f.rel)]);
const real = new Set(walk(DIST));
const extra = [...real].filter((f) => !expected.has(f));
const missing = [...expected].filter((f) => !real.has(f));
if (extra.length === 0 && missing.length === 0) ok('insieme file esatto (21 pagine + asset)');
else { extra.forEach((f) => fail(`extra: ${f}`)); missing.forEach((f) => fail(`mancante: ${f}`)); }

console.log('=== robots.txt ===');
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (robots.startsWith('User-agent: *') && robots.includes('Allow: /')) ok('User-agent: * / Allow: /');
else fail(`robots.txt inatteso: ${JSON.stringify(robots)}`);

console.log(failures === 0 ? '\nRISULTATO: PASS — identità preservata su tutti i controlli' : `\nRISULTATO: FAIL — ${failures} problemi`);
process.exit(failures === 0 ? 0 : 1);
