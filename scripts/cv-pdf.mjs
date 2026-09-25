// Genera los PDF del CV (es / en / it) a partir del export estático en out/.
// Uso: npm run cv:pdf   (hace `next build` antes y después; ver package.json)
// Sirve out/ en localhost y usa Google Chrome headless para imprimir /cv/,
// /en/cv/ y /it/cv/ en A4 sin cabeceras. Los PDF quedan en public/cv/, por eso
// hace falta otro `next build` para que entren en out/.
//
// Nota: en macOS Chrome headless escribe el PDF pero no siempre sale solo
// (se quedan vivos los procesos del updater), así que vigilamos el archivo y
// cerramos Chrome nosotros en cuanto aparece.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const OUT = path.resolve('out');
const PORT = 8766;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LANGS = ['es', 'en', 'it'];
const WAIT_MS = 60000;

if (!fs.existsSync(path.join(OUT, process.env.CV_VARIANT ? `en/cv/${process.env.CV_VARIANT}` : 'cv', 'index.html'))) {
  console.error('No existe out/cv/index.html: ejecuta `next build` antes.');
  process.exit(1);
}
if (!fs.existsSync(CHROME)) {
  console.error(`No encuentro Chrome en ${CHROME}. Define CHROME=/ruta/al/binario.`);
  process.exit(1);
}

const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json',
  woff2: 'font/woff2', woff: 'font/woff', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  svg: 'image/svg+xml', pdf: 'application/pdf', txt: 'text/plain',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(OUT, p));
  if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).slice(1)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lanza Chrome, espera a que el PDF exista y deje de crecer, y lo cierra.
async function printPdf(url, pdf) {
  fs.rmSync(pdf, { force: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-pdf-chrome-'));
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, url,
  ], { stdio: 'ignore' });
  let ok = false;
  const t0 = Date.now();
  let lastSize = -1;
  while (Date.now() - t0 < WAIT_MS) {
    await sleep(500);
    if (fs.existsSync(pdf)) {
      const size = fs.statSync(pdf).size;
      if (size > 0 && size === lastSize) { ok = true; break; }
      lastSize = size;
    }
    if (child.exitCode !== null) { ok = fs.existsSync(pdf) && fs.statSync(pdf).size > 0; break; }
  }
  child.kill('SIGKILL');
  await sleep(300);
  fs.rmSync(profile, { recursive: true, force: true });
  return ok;
}

// Con CV_VARIANT=<id> (y el build hecho con esa misma variable) solo se imprime
// la variante inglesa a private/, que esta fuera de git y del sitio.
const variant = process.env.CV_VARIANT || null;
const jobs = variant
  ? [{ url: `http://127.0.0.1:${PORT}/en/cv/${variant}/`, pdf: path.resolve(`private/German-Lugo-CV-${variant}.pdf`), lang: `en/${variant}` }]
  : LANGS.map((lang) => ({ url: `http://127.0.0.1:${PORT}/${lang === 'es' ? '' : `${lang}/`}cv/`, pdf: path.resolve(`public/cv/german-lugo-cv-${lang}.pdf`), lang }));
fs.mkdirSync(variant ? 'private' : 'public/cv', { recursive: true });
let failed = false;
for (const { url, pdf, lang } of jobs) {
  const ok = await printPdf(url, pdf);
  if (ok) console.log(`✓ ${lang}: ${path.relative(process.cwd(), pdf)} (${(fs.statSync(pdf).size / 1024).toFixed(0)} KB)`);
  else { failed = true; console.error(`✗ ${lang}: no se generó ${pdf} en ${WAIT_MS / 1000}s`); }
}

server.close();
process.exit(failed ? 1 : 0);
