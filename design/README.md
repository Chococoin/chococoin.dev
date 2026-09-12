# Portafolio · Germán Lugo

Landing de una página, tres idiomas (es / en / it), tema oscuro con acento ámbar.

Origen: proyecto de Claude Design
https://claude.ai/design/p/1d425104-5f86-473f-a7a5-ea38f5522dec (descargado 2026-09-12).

## Archivos

- `Portafolio German Lugo.dc.html` — la página (diseño + lógica). No hace falta tocarla para cambiar textos.
- `content.json` — **todo el contenido**. Único archivo que editas.
- `README.md` — esto.

## Editar contenido

Abre `content.json`:

1. **`placeholders`** — campos pendientes. Mientras estén vacíos (`""`) la web muestra `[PENDIENTE]` / `[PENDING]` / `[DA COMPILARE]` en ámbar.
   - `FOODCHAIN_INICIO`, `FOODCHAIN_FIN` — texto libre, p. ej. `"2019"` o `"mar 2019"`.
   - `EMAIL` — se convierte en enlace `mailto:`.
   - `GITHUB_URL`, `CV_URL` — URL completas. El CV puede ser un archivo en la misma carpeta (`"./cv-german-lugo.pdf"`).
   - `SCREENSHOT_*` — ruta o URL de la captura (16:9 recomendado). Si está vacío se muestra un marco rayado.
2. **`links`** — LinkedIn y dominios de los proyectos.
3. **`stack`, `experienceStack`, `projectsMeta`** — datos independientes del idioma (listas de tecnologías, dominios).
4. **`es` / `en` / `it`** — todos los textos. Misma estructura en los tres; cambia uno y replica en los otros.

El idioma inicial se detecta del navegador (es / it / en, fallback en) y la elección del visitante se guarda en `localStorage`.

## Desplegar en Vercel

Es HTML estático: sube la carpeta a un repo y en Vercel elige **Framework: Other**, sin build. La URL raíz debe apuntar al `.dc.html` (renómbralo a `index.html` o añade un `vercel.json` con un rewrite de `/` a ese archivo).

## Migrar a Next.js

Si prefieres Next.js: copia `content.json` a `src/content/content.json`, importa con `import content from '@/content/content.json'` y traslada las secciones del `.dc.html` a componentes. La estructura de datos ya está pensada para eso (idioma como clave de primer nivel, placeholders separados).
