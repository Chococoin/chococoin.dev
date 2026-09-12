# chococoin.dev · Portafolio de Germán Lugo

Landing de una página en tres idiomas (es / en / it), tema oscuro con acento ámbar,
más la **versión arcade 3D** (three.js) intacta en `/arcade/`.

## Estructura

```
app/[[...lang]]/   layout + página: "/" (es), "/en/", "/it/"
components/        Portfolio.tsx (página), LangSwitch.tsx (selector de idioma)
lib/content.ts     acceso tipado a content.json y valores derivados
content/           content.json — TODO el texto y los datos; único archivo a editar
public/arcade/     sitio arcade original (HTML + three.js vendorizado), se sirve tal cual
public/cv/         PDF del CV por idioma (generados con `npm run cv:pdf`)
scripts/cv-pdf.mjs genera esos PDF con Chrome headless a partir de out/
design/            propuesta original de Claude Design (.dc.html, content.json, README)
tests/             comprobación de que content.json es coherente en los tres idiomas
```

## Editar contenido

Todo está en `content/content.json`:

- `placeholders`: mientras un valor esté vacío, la web muestra `[PENDIENTE]` en ámbar.
  Pendientes hoy: `FOODCHAIN_INICIO`, `FOODCHAIN_FIN` y las tres capturas `SCREENSHOT_*`
  (16:9, ruta bajo `public/`). `CV_URL` admite `{lang}` y apunta a los PDF de `public/cv/`.
- `links`: LinkedIn, dominios de los proyectos y la ruta del arcade.
- `es` / `en` / `it`: textos. Misma estructura en los tres; `npm test` lo comprueba.

## Idioma

`/` es español. Un script inline en la raíz redirige una sola vez a `/en/` o `/it/` según
la preferencia guardada por el selector (`localStorage`) o, si no hay, el idioma del navegador.
Las rutas `/en/` y `/it/` nunca redirigen.

## CV

`/cv/`, `/en/cv/` y `/it/cv/` muestran el CV en una hoja A4 (mismo `content.json`), con botones de
descarga e impresión. Los PDF que descarga el botón "Descargar CV" se generan en local:

```bash
npm run cv:pdf   # next build + Chrome headless -> public/cv/german-lugo-cv-{es,en,it}.pdf + next build
```

Hay que repetirlo cuando cambie el contenido; los PDF se versionan en git (Vercel no tiene Chrome).

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000  (el arcade en dev: /arcade/index.html)
npm test         # coherencia de content.json
npm run build    # export estático en out/
npm run deploy   # build + rsync out/ -> stellar:public_html/  (chococoin.dev)
```

El hosting (Namecheap) es estático: `next.config.mjs` usa `output: 'export'` y
`trailingSlash: true`, así `/en/` se sirve desde `out/en/index.html` sin reescrituras.
