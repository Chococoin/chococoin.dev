// Sala arcade en escala de grises, construida con primitivas de three.js.
// Todo es gris salvo lo que emite luz (tubos, rótulo, pantallas apagadas en
// gris pálido); la cabina principal (fuera de este módulo) pone el color.
import * as THREE from 'three';
import { LOGOS } from './logos.js';

export const ROOM = { w: 16, d: 14, h: 4.2, zBack: -6 }; // el suelo va de z=-6 a z=8

const gray = (v) => new THREE.Color().setScalar(v);

/* ---------- texturas generadas ---------- */
function checkerTexture(maxAniso) {
  const S = 512, N = 8, t = S / N;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#232326' : '#343438';
      ctx.fillRect(x * t, y * t, t, t);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= N; i++) {
    ctx.beginPath();
    ctx.moveTo(i * t, 0); ctx.lineTo(i * t, S);
    ctx.moveTo(0, i * t); ctx.lineTo(S, i * t);
    ctx.stroke();
  }
  // grano sutil para que no parezca plástico
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM.w / (N * 0.5), ROOM.d / (N * 0.5)); // baldosas de 0,5 m
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '96px "Press Start 2P", monospace';
  ctx.shadowColor = 'rgba(255,255,255,.9)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  ctx.shadowBlur = 0;
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- neón de un logo (trazo con halo, sobre fondo transparente) ---------- */
function neonLogoTexture(logo) {
  const S = 512, pad = 110;             // margen para que el halo no se corte
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const path = new Path2D(logo.path);
  const k = (S - pad * 2) / 24;         // el viewBox de Simple Icons es 24x24
  ctx.translate(pad, pad);
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // (shadowBlur va en píxeles del canvas, no le afecta la escala)
  // 1) halo ancho: la luz que se derrama sobre la pared
  ctx.shadowColor = logo.color;
  ctx.shadowBlur = 56;
  ctx.strokeStyle = logo.color;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.85;
  ctx.stroke(path);
  ctx.stroke(path);
  // 2) relleno casi transparente para que la forma se lea
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = logo.color;
  ctx.fill(path);
  // 3) núcleo del tubo, más claro y fino
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 12;
  const core = new THREE.Color(logo.color).lerp(new THREE.Color('#ffffff'), 0.45);
  ctx.strokeStyle = '#' + core.getHexString();
  ctx.lineWidth = 0.5;
  ctx.stroke(path);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- cabina de fondo simplificada ---------- */
function makeMiniCabinet(shade, screenMat) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: gray(shade), roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: gray(shade * 0.55), roughness: 0.9 });
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(0.72, 1.25, 0.78), body, 0, 0.625, 0);          // base
  add(new THREE.BoxGeometry(0.72, 0.14, 0.42), dark, 0, 1.32, 0.30);         // panel de mandos
  add(new THREE.BoxGeometry(0.72, 0.62, 0.62), body, 0, 1.56, -0.08);        // cabeza
  add(new THREE.BoxGeometry(0.72, 0.28, 0.50), dark, 0, 2.01, -0.02);        // marquesina
  const screen = add(new THREE.PlaneGeometry(0.56, 0.44), screenMat, 0, 1.58, 0.235, -0.18);
  return { group: g, screen };
}

/**
 * Construye la sala y la añade a `scene`.
 * Devuelve { group, update(t) } — update anima el parpadeo de las pantallas.
 */
export function buildRoom(scene, { low = false, maxAniso = 1 } = {}) {
  const room = new THREE.Group();
  const zMid = ROOM.zBack + ROOM.d / 2; // centro del suelo en z

  /* suelo a cuadros, algo brillante para reflejar la pantalla */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    new THREE.MeshStandardMaterial({ map: checkerTexture(maxAniso), roughness: 0.38, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = zMid;
  floor.receiveShadow = !low;
  room.add(floor);

  /* paredes y techo */
  const wallMat = new THREE.MeshStandardMaterial({ color: gray(0.10), roughness: 0.95 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: gray(0.07), roughness: 1 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), wallMat);
  back.position.set(0, ROOM.h / 2, ROOM.zBack);
  const front = back.clone();
  front.position.z = ROOM.zBack + ROOM.d;
  front.rotation.y = Math.PI;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.d, ROOM.h), wallMat);
  left.position.set(-ROOM.w / 2, ROOM.h / 2, zMid);
  left.rotation.y = Math.PI / 2;
  const right = left.clone();
  right.position.x = ROOM.w / 2;
  right.rotation.y = -Math.PI / 2;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), ceilMat);
  ceil.position.set(0, ROOM.h, zMid);
  ceil.rotation.x = Math.PI / 2;
  room.add(back, front, left, right, ceil);

  /* zócalo oscuro alrededor */
  const skirtMat = new THREE.MeshStandardMaterial({ color: gray(0.08), roughness: 0.9 });
  const skirtH = 0.12;
  const mk = (w, x, z, ry) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, skirtH, 0.04), skirtMat);
    s.position.set(x, skirtH / 2, z);
    s.rotation.y = ry;
    room.add(s);
  };
  mk(ROOM.w, 0, ROOM.zBack + 0.02, 0);
  mk(ROOM.d, -ROOM.w / 2 + 0.02, zMid, Math.PI / 2);
  mk(ROOM.d, ROOM.w / 2 - 0.02, zMid, Math.PI / 2);

  /* tubos fluorescentes en el techo */
  const tubeMat = new THREE.MeshBasicMaterial({ color: gray(0.78), toneMapped: false });
  const fixtureMat = new THREE.MeshStandardMaterial({ color: gray(0.2), roughness: 0.8 });
  const tubeGeo = new THREE.BoxGeometry(1.5, 0.05, 0.12);
  const fixtureGeo = new THREE.BoxGeometry(1.6, 0.06, 0.3);
  for (const z of [-4.2, -1.2, 1.8, 4.8]) {
    for (const x of [-4.6, 0, 4.6]) {
      const f = new THREE.Mesh(fixtureGeo, fixtureMat);
      f.position.set(x, ROOM.h - 0.04, z);
      const tb = new THREE.Mesh(tubeGeo, tubeMat);
      tb.position.set(x, ROOM.h - 0.09, z);
      room.add(f, tb);
    }
  }
  // luz real de los tubos (pocas fuentes: es barato y suficiente)
  for (const z of [-3, 2.5]) {
    const p = new THREE.PointLight('#e9e9ee', low ? 3 : 4.5, 14, 1.6);
    p.position.set(0, ROOM.h - 0.3, z);
    room.add(p);
  }

  /* rótulo ARCADE en neón blanco, pared del fondo */
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshBasicMaterial({ map: signTexture('ARCADE'), transparent: true, toneMapped: false, depthWrite: false }));
  sign.position.set(0, 3.25, ROOM.zBack + 0.03);
  room.add(sign);

  /* neones de lenguajes en las paredes, por encima de las máquinas */
  const logoGeo = new THREE.PlaneGeometry(1.3, 1.3);
  const placeLogo = (logo, x, y, z, ry) => {
    const m = new THREE.Mesh(logoGeo, new THREE.MeshBasicMaterial({
      map: neonLogoTexture(logo), transparent: true, toneMapped: false, depthWrite: false,
      color: gray(0.82), // por debajo del umbral del bloom: brillo tenue
    }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    room.add(m);
  };
  const LY = 3.15;
  // pared del fondo: cinco logos flanqueando el rótulo ARCADE
  const backSlots = [-6.6, -5.0, -3.4, 3.4, 5.0, 6.6];
  const backLogos = [LOGOS[0], LOGOS[1], LOGOS[2], LOGOS[3], LOGOS[4], LOGOS[5]];
  backLogos.forEach((lg, i) => placeLogo(lg, backSlots[i], LY, ROOM.zBack + 0.03, 0));
  // laterales: el resto, mirando hacia dentro
  placeLogo(LOGOS[6], -ROOM.w / 2 + 0.03, LY, -3.0, Math.PI / 2);
  placeLogo(LOGOS[7], -ROOM.w / 2 + 0.03, LY, -0.6, Math.PI / 2);
  placeLogo(LOGOS[8], ROOM.w / 2 - 0.03, LY, -3.0, -Math.PI / 2);

  /* cabinas de fondo */
  const screens = [];
  const placeCab = (x, z, ry, shade) => {
    const mat = new THREE.MeshStandardMaterial({
      color: gray(0.02), emissive: gray(1), emissiveIntensity: 0.42, roughness: 0.35,
    });
    const { group, screen } = makeMiniCabinet(shade, mat);
    group.position.set(x, 0, z);
    group.rotation.y = ry;
    room.add(group);
    screens.push({ mat, phase: Math.random() * 10, speed: 0.6 + Math.random() * 0.8 });
    return screen;
  };
  const shades = [0.30, 0.36, 0.26, 0.40, 0.33, 0.28, 0.38, 0.31];
  const backX = [-5.7, -4.75, -3.8, -2.85, 2.85, 3.8, 4.75, 5.7];
  backX.forEach((x, i) => placeCab(x, ROOM.zBack + 0.5, 0, shades[i]));
  if (!low) {
    [-3.6, -2.4, -1.2, 0.0].forEach((z, i) => {
      placeCab(-ROOM.w / 2 + 0.5, z, Math.PI / 2, shades[(i + 2) % shades.length]);
      placeCab(ROOM.w / 2 - 0.5, z, -Math.PI / 2, shades[(i + 5) % shades.length]);
    });
  }

  scene.add(room);

  return {
    group: room,
    update(t) {
      for (const s of screens) {
        s.mat.emissiveIntensity = 0.40 + Math.sin(t * s.speed + s.phase) * 0.06
          + (Math.random() < 0.02 ? 0.12 : 0);
      }
    },
  };
}
