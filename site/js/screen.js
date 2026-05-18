// Render de la pantalla CRT (pixel art) sobre un canvas 320x240.
// El canvas se usa como textura del mesh "screen" en la escena 3D.

import { PROJECTS } from './projects.js';

export const W = 320, H = 240;

const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
export { canvas };

// --- Carga de fuentes para usarlas dentro del canvas ---
let fontsReady = false;
export const fontsLoaded = (async () => {
  try {
    const ps = new FontFace('Press Start 2P', 'url(fonts/press-start-2p.woff2)');
    const vt = new FontFace('VT323', 'url(fonts/vt323.woff2)');
    await Promise.all([ps.load(), vt.load()]);
    document.fonts.add(ps);
    document.fonts.add(vt);
  } catch (e) {
    /* si falla, se usa monospace */
  }
  fontsReady = true;
})();

const PSF = (s) => (fontsReady ? `${s}px "Press Start 2P"` : `bold ${s}px monospace`);

// --- Iconos pixel art (12 de ancho x 10 de alto) ---
const ICONS = {
  heart: [
    '............',
    '..XX....XX..',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '....XXXX....',
    '.....XX.....',
    '............',
  ],
  clapper: [
    'X.X.X.X.X.X.',
    'XXXXXXXXXXXX',
    'X..........X',
    'X...XX.....X',
    'X...XXXX...X',
    'X...XXXXXX.X',
    'X...XXXX...X',
    'X...XX.....X',
    'X..........X',
    'XXXXXXXXXXXX',
  ],
  robot: [
    '....X..X....',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '..X.X..X.X..',
    '..XXXXXXXX..',
    '..XX.XX.XX..',
    '..XXXXXXXX..',
    '...X.XX.X...',
    '...X....X...',
    '............',
  ],
};

// --- Layout de los cartuchos ---
const CW = 88, CH = 104, GAP = 14, CY = 100;
const SX0 = Math.round((W - (CW * 3 + GAP * 2)) / 2);

export const CARTS = PROJECTS.slice(0, 3).map((p, i) => ({
  id: p.id,
  x: SX0 + i * (CW + GAP),
  y: CY,
  w: CW,
  h: CH,
  project: p,
}));

// Devuelve el id del cartucho bajo el punto (px,py) en coords de canvas, o null.
export function hitTest(px, py) {
  for (const c of CARTS) {
    if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) return c.id;
  }
  return null;
}

function drawIcon(name, x, y, scale, color) {
  const grid = ICONS[name];
  if (!grid) return;
  ctx.fillStyle = color;
  for (let r = 0; r < grid.length; r++) {
    for (let q = 0; q < grid[r].length; q++) {
      if (grid[r][q] === 'X') ctx.fillRect(x + q * scale, y + r * scale, scale, scale);
    }
  }
}

// state = { t:number, hover:id|null, zoomed:boolean }
export function draw(state) {
  const t = state.t || 0;

  ctx.fillStyle = '#140d28';
  ctx.fillRect(0, 0, W, H);

  // borde que cicla de color
  ctx.strokeStyle = `hsl(${(t * 40) % 360},100%,62%)`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // titulo
  ctx.fillStyle = '#ffe22e';
  ctx.font = PSF(18);
  ctx.fillText('MI', W / 2, 34);
  ctx.fillStyle = '#1ee6e6';
  ctx.font = PSF(18);
  ctx.fillText('PORTAFOLIO', W / 2, 60);
  ctx.fillStyle = '#9b8fe0';
  ctx.font = PSF(7);
  ctx.fillText('- ELIGE UN CARTUCHO -', W / 2, 82);

  // cartuchos
  const iconScale = 3;
  const iconW = 12 * iconScale;
  for (const c of CARTS) {
    const hov = state.hover === c.id;
    const p = c.project;

    ctx.fillStyle = p.color;
    ctx.fillRect(c.x, c.y, c.w, c.h);

    // tramado (dither)
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    for (let a = 0; a < c.w; a += 8) {
      for (let b = 0; b < c.h; b += 8) {
        if (((a + b) / 8) % 2) ctx.fillRect(c.x + a, c.y + b, 4, 4);
      }
    }

    drawIcon(p.icon, c.x + (c.w - iconW) / 2, c.y + 12, iconScale, '#0a0a14');

    // banda inferior con codigo + nombre
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(c.x, c.y + c.h - 30, c.w, 30);
    ctx.fillStyle = p.color;
    ctx.font = PSF(9);
    ctx.fillText(p.code, c.x + c.w / 2, c.y + c.h - 17);
    ctx.fillStyle = '#ffffff';
    ctx.font = PSF(6);
    ctx.fillText(p.short, c.x + c.w / 2, c.y + c.h - 6);

    // borde + marcador de hover
    ctx.lineWidth = hov ? 4 : 2;
    ctx.strokeStyle = hov ? '#ffffff' : '#0a0a14';
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    if (hov) {
      ctx.fillStyle = '#ffffff';
      ctx.font = PSF(8);
      ctx.fillText('▼', c.x + c.w / 2, c.y - 4);
    }
  }

  // pie parpadeante
  if (Math.floor(t * 2) % 2) {
    ctx.fillStyle = '#7dff4d';
    ctx.font = PSF(8);
    ctx.fillText(state.zoomed ? 'CLICA UN CARTUCHO' : '> PRESS START', W / 2, 224);
  }

  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,.26)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}
