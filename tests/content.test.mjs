// Comprueba que content.json es coherente: misma estructura en es/en/it,
// placeholders y enlaces con la forma esperada. Se ejecuta con `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const content = JSON.parse(await readFile(new URL('../content/content.json', import.meta.url), 'utf8'));
const LANGS = ['es', 'en', 'it'];

// Devuelve la "forma" de un objeto: rutas de claves con el tipo de hoja.
function shape(v, prefix = '') {
  if (Array.isArray(v)) return [`${prefix}[]:${v.length}`, ...shape(v[0] ?? null, `${prefix}[]`)];
  if (v && typeof v === 'object') return Object.keys(v).sort().flatMap((k) => shape(v[k], `${prefix}.${k}`));
  return [`${prefix}:${typeof v}`];
}

test('los tres idiomas tienen exactamente la misma estructura', () => {
  const [es, en, it] = LANGS.map((l) => shape(content[l]).join('\n'));
  assert.equal(en, es, 'en difiere de es');
  assert.equal(it, es, 'it difiere de es');
});

test('cada idioma tiene las entradas del arcade', () => {
  for (const l of LANGS) {
    assert.ok(content[l].nav.arcade, `${l}.nav.arcade`);
    assert.ok(content[l].hero.arcadeLabel, `${l}.hero.arcadeLabel`);
  }
});

test('proyectos: cada meta tiene textos en los tres idiomas', () => {
  for (const m of content.projectsMeta) {
    assert.ok(['own', 'client'].includes(m.kind), `kind de ${m.id}`);
    for (const l of LANGS) assert.ok(content[l].projects.labels[m.kind], `${l}.projects.labels.${m.kind}`);
    for (const l of LANGS) assert.ok(content[l].projects.items[m.id], `${l}.projects.items.${m.id}`);
    assert.ok(m.screenshotKey in content.placeholders, `placeholder ${m.screenshotKey}`);
    if (m.linkKey) assert.ok(content.links[m.linkKey], `link ${m.linkKey}`);
  }
});

test('stack: cada grupo tiene etiqueta en los tres idiomas', () => {
  for (const g of content.stack)
    for (const l of LANGS) assert.ok(content[l].stack.groups[g.id], `${l}.stack.groups.${g.id}`);
});

test('cada idioma tiene los textos del CV', () => {
  for (const l of LANGS)
    for (const k of ['title', 'download', 'print', 'back']) assert.ok(content[l].cv[k], `${l}.cv.${k}`);
});

test('placeholders rellenos tienen la forma correcta', () => {
  const p = content.placeholders;
  if (p.EMAIL) assert.match(p.EMAIL, /^[^@\s]+@[^@\s]+\.[a-z]+$/i);
  for (const k of ['GITHUB_URL', 'CV_URL']) if (p[k]) assert.match(p[k], /^(https?:\/\/|\.?\/)/, k);
  assert.equal(content.links.arcade, '/arcade/');
  assert.match(content.links.site, /^https:\/\//, 'links.site');
  for (const l of LANGS) assert.ok(content[l].contact.web, `${l}.contact.web`);
});
