// Portafolio Arcade — escena 3D, interaccion y fallback.

import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { PROJECTS, PROFILE } from './projects.js';
import * as Screen from './screen.js';

// En pantallas pequeñas se bajan los efectos para mantener fluidez.
const LOW = window.matchMedia('(max-width: 820px)').matches;

/* ---------- deteccion de WebGL ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

const $ = (s) => document.querySelector(s);

/* ============================================================
   FALLBACK 2D (sin WebGL)
   ============================================================ */
function buildFallback() {
  const cards = PROJECTS.map((p) => `
    <div class="fb-card">
      <div class="fb-top" style="background:${p.color}">${p.code}</div>
      <div class="fb-meta">
        <h3>${p.title}</h3>
        <p>${p.tagline}</p>
        <a href="${p.link}" target="_blank" rel="noopener">${p.linkLabel} ▶</a>
      </div>
    </div>`).join('');

  const contacts = PROFILE.contacts.map((c) =>
    `<a href="${c.href}" target="_blank" rel="noopener">${c.label}: ${c.value}</a>`
  ).join(' · ');

  const fb = $('#fallback');
  fb.innerHTML = `
    <div class="fb-wrap">
      <h1>MI PORTAFOLIO</h1>
      <p class="fb-bio">${PROFILE.bio}</p>
      <div class="fb-grid">${cards}</div>
      <div class="fb-foot">— ${PROFILE.alias} — ${contacts}</div>
    </div>`;
  fb.classList.remove('hidden');
  $('#scene').classList.add('hidden');
  $('#loading').classList.add('hidden');
}

/* ============================================================
   PANELES SUPERPUESTOS
   ============================================================ */
const overlay = $('#overlay');
const panelBody = $('#panel-body');
let overlayOpen = false;

function showOverlay(html) {
  panelBody.innerHTML = html;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  overlayOpen = true;
}
function closeOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  overlayOpen = false;
}

function openDetail(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  const bullets = p.bullets.map((b) => `<li>${b}</li>`).join('');
  showOverlay(`
    <h2>${p.code} · ${p.title}</h2>
    <p class="tagline">${p.tagline}</p>
    <ul>${bullets}</ul>
    <a class="cta" href="${p.link}" target="_blank" rel="noopener">${p.linkLabel} ▶</a>
  `);
}
function openAbout() {
  showOverlay(`
    <h2>ABOUT · ${PROFILE.alias}</h2>
    <p class="tagline">PLAYER 1</p>
    <ul><li>${PROFILE.bio}</li></ul>
  `);
}
function openContact() {
  const items = PROFILE.contacts.map((c) =>
    `<li><span class="label">${c.label}</span>
      <a href="${c.href}" target="_blank" rel="noopener">${c.value}</a></li>`
  ).join('');
  showOverlay(`
    <h2>CONTACT</h2>
    <p class="tagline">INSERTA UNA MONEDA Y ESCRIBE</p>
    <ul class="contact-list">${items}</ul>
  `);
}

overlay.addEventListener('click', (e) => {
  if (e.target === overlay || e.target.hasAttribute('data-close')) closeOverlay();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlayOpen) closeOverlay();
});

/* ============================================================
   ESCENA 3D
   ============================================================ */
function initScene() {
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  // render cinematografico: curva de color tipo cine
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  // sombras suaves (desactivadas en movil)
  renderer.shadowMap.enabled = !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05030c');
  scene.fog = new THREE.Fog('#05030c', 7, 18);

  // Mapa de entorno: una sala con paneles de neon da reflejos
  // realistas al plastico, el metal y el cristal de la cabina.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  {
    envScene.add(new THREE.Mesh(
      new THREE.BoxGeometry(24, 14, 24),
      new THREE.MeshBasicMaterial({ color: '#0a0714', side: THREE.BackSide })));
    const glow = (c, x, y, z, w, h) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(x, y, z);
      m.lookAt(0, y, 0);
      envScene.add(m);
    };
    glow('#ff2e88', -8, 4, 2, 7, 5);
    glow('#1ee6e6', 8, 3, -2, 7, 6);
    glow('#9b4dff', 0, 8, -7, 12, 5);
    glow('#7dff4d', 0, 1.5, 8, 9, 3);
  }
  scene.environment = pmrem.fromScene(envScene, 0.4).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 2.0, 5.4);

  /* --- texturas de canvas --- */
  const screenTex = new THREE.CanvasTexture(Screen.canvas);
  screenTex.magFilter = THREE.NearestFilter;
  screenTex.minFilter = THREE.NearestFilter;

  const MC = document.createElement('canvas');
  MC.width = 512; MC.height = 96;
  const mx = MC.getContext('2d');
  function drawMarquee() {
    const g = mx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, '#ff2e88'); g.addColorStop(0.5, '#9b4dff'); g.addColorStop(1, '#1ee6e6');
    mx.fillStyle = g; mx.fillRect(0, 0, 512, 96);
    mx.fillStyle = '#0a0a14';
    mx.textAlign = 'center'; mx.textBaseline = 'middle';
    mx.font = '30px "Press Start 2P", monospace';
    mx.fillText(PROFILE.alias, 256, 54);
  }
  const marqueeTex = new THREE.CanvasTexture(MC);
  marqueeTex.magFilter = THREE.NearestFilter;

  /* --- cabina --- */
  const cab = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#241845', roughness: 0.7, metalness: 0.1 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#0a0810', roughness: 0.5 });
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  const base = box(1.6, 1.15, 1.15, bodyMat); base.position.y = 0.575; cab.add(base);
  const upper = box(1.6, 1.7, 1.05, bodyMat); upper.position.set(0, 2.0, -0.05); cab.add(upper);
  const bezel = box(1.34, 1.16, 0.12, blackMat); bezel.position.set(0, 2.12, 0.52); cab.add(bezel);

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex, emissive: '#ffffff', emissiveMap: screenTex,
    emissiveIntensity: 1.25, roughness: 0.35,
  });
  const screen = box(1.06, 0.92, 0.04, screenMat);
  screen.position.set(0, 2.14, 0.60);
  cab.add(screen);

  const marMat = new THREE.MeshStandardMaterial({
    map: marqueeTex, emissive: '#ffffff', emissiveMap: marqueeTex, emissiveIntensity: 0.9,
  });
  const marquee = box(1.62, 0.46, 0.42, marMat);
  marquee.position.set(0, 3.05, 0.16); cab.add(marquee);

  const panel = box(1.5, 0.62, 0.16, blackMat);
  panel.position.set(0, 1.28, 0.66); panel.rotation.x = -1.0; cab.add(panel);

  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: '#111' }));
  stick.position.set(-0.42, 1.55, 0.78); stick.rotation.x = -0.35; cab.add(stick);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#ff2e88', roughness: 0.3 }));
  ball.position.set(-0.40, 1.71, 0.84); cab.add(ball);

  ['#ffe22e', '#1ee6e6', '#7dff4d', '#ff7b2e'].forEach((c, i) => {
    const b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.07, 14),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 }));
    b.position.set(0.06 + i * 0.20, 1.62 - i * 0.012, 0.80 - i * 0.018);
    b.rotation.x = -0.35 + Math.PI / 2; cab.add(b);
  });

  [-0.81, 0.81].forEach((x) => {
    const s = box(0.05, 1.7, 0.04, new THREE.MeshStandardMaterial({
      color: '#1ee6e6', emissive: '#1ee6e6', emissiveIntensity: 1.4 }));
    s.position.set(x, 2.0, 0.50); cab.add(s);
  });
  scene.add(cab);
  // todas las piezas de la cabina proyectan y reciben sombra
  cab.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });

  /* --- suelo --- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: '#0c0820', roughness: 0.35, metalness: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- pared con rejilla neon --- */
  const wallC = document.createElement('canvas'); wallC.width = wallC.height = 256;
  const wc = wallC.getContext('2d');
  wc.fillStyle = '#0a0618'; wc.fillRect(0, 0, 256, 256);
  wc.strokeStyle = 'rgba(155,77,255,.5)'; wc.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    wc.beginPath(); wc.moveTo(i, 0); wc.lineTo(i, 256); wc.stroke();
    wc.beginPath(); wc.moveTo(0, i); wc.lineTo(256, i); wc.stroke();
  }
  const wallTex = new THREE.CanvasTexture(wallC);
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(6, 3);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 18),
    new THREE.MeshStandardMaterial({
      map: wallTex, emissive: '#1a0c33', emissiveMap: wallTex, emissiveIntensity: 0.5 }));
  wall.position.set(0, 9, -6);
  scene.add(wall);

  /* --- luces --- */
  scene.add(new THREE.AmbientLight('#3a2a66', 0.6));
  const screenLight = new THREE.PointLight('#1ee6e6', 6, 9);
  screenLight.position.set(0, 2.2, 1.6); scene.add(screenLight);
  const marLight = new THREE.PointLight('#ff2e88', 4, 7);
  marLight.position.set(0, 3.2, 1.2); scene.add(marLight);
  // luz principal que proyecta la sombra de la cabina al suelo
  const rim = new THREE.DirectionalLight('#cbb3ff', 1.1);
  rim.position.set(-4, 6, 3.5);
  rim.target.position.set(0, 1.7, 0);
  scene.add(rim);
  scene.add(rim.target);
  if (!LOW) {
    rim.castShadow = true;
    rim.shadow.mapSize.set(2048, 2048);
    rim.shadow.camera.near = 0.5;
    rim.shadow.camera.far = 24;
    rim.shadow.camera.left = -5;
    rim.shadow.camera.right = 5;
    rim.shadow.camera.top = 6;
    rim.shadow.camera.bottom = -2;
    rim.shadow.bias = -0.0016;
    rim.shadow.radius = 4;
  }

  /* --- charco de luz --- */
  const poolC = document.createElement('canvas'); poolC.width = poolC.height = 128;
  const pc = poolC.getContext('2d');
  const pg = pc.createRadialGradient(64, 64, 4, 64, 64, 64);
  pg.addColorStop(0, 'rgba(30,230,230,.55)'); pg.addColorStop(1, 'rgba(30,230,230,0)');
  pc.fillStyle = pg; pc.fillRect(0, 0, 128, 128);
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(poolC), transparent: true, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, 0.6);
  scene.add(pool);

  /* --- polvo --- */
  const dustGeo = new THREE.BufferGeometry();
  const dn = 140, dpos = new Float32Array(dn * 3);
  for (let i = 0; i < dn; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 12;
    dpos[i * 3 + 1] = Math.random() * 6;
    dpos[i * 3 + 2] = (Math.random() - 0.5) * 8 + 1;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: '#6effff', size: 0.035, transparent: true, opacity: 0.5 }));
  scene.add(dust);

  /* ---------- camara: vistas e interaccion ---------- */
  const VIEW = {
    wide:   { pos: new THREE.Vector3(0, 2.0, 5.4),  look: new THREE.Vector3(0, 2.05, 0.40) },
    zoomed: { pos: new THREE.Vector3(0, 2.14, 1.85), look: new THREE.Vector3(0, 2.14, 0.60) },
  };
  let view = 'wide';
  const lookCur = VIEW.wide.look.clone();
  const tmpPos = new THREE.Vector3();

  let mxn = 0, myn = 0;          // raton normalizado -0.5..0.5
  let hoverCart = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const hint = $('#hint');
  const zoomoutBtn = $('#zoomout');

  function updateHint() {
    if (view === 'wide') {
      hint.textContent = 'CLIC EN LA MÁQUINA PARA JUGAR';
      zoomoutBtn.classList.add('hidden');
    } else {
      hint.textContent = 'CLICA UN CARTUCHO · O PULSA SALIR';
      zoomoutBtn.classList.remove('hidden');
    }
  }

  function setPointer(e) {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  }

  function cartFromScreen() {
    const hit = raycaster.intersectObject(screen, false)[0];
    if (hit && hit.uv) {
      return Screen.hitTest(hit.uv.x * Screen.W, (1 - hit.uv.y) * Screen.H);
    }
    return null;
  }

  canvas.addEventListener('pointermove', (e) => {
    mxn = e.clientX / innerWidth - 0.5;
    myn = e.clientY / innerHeight - 0.5;
    if (overlayOpen) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    let cursor = 'default';
    if (view === 'wide') {
      hoverCart = null;
      if (raycaster.intersectObjects(cab.children, false).length) cursor = 'pointer';
    } else {
      hoverCart = cartFromScreen();
      if (hoverCart) cursor = 'pointer';
    }
    canvas.style.cursor = cursor;
  });

  canvas.addEventListener('click', (e) => {
    if (overlayOpen) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    if (view === 'wide') {
      if (raycaster.intersectObjects(cab.children, false).length) {
        view = 'zoomed';
        updateHint();
      }
    } else {
      const id = cartFromScreen();
      if (id) openDetail(id);
    }
  });

  zoomoutBtn.addEventListener('click', () => {
    view = 'wide';
    hoverCart = null;
    updateHint();
  });

  $('#ui').querySelectorAll('[data-nav]').forEach((btn) => {
    const nav = btn.getAttribute('data-nav');
    if (nav === 'about') btn.addEventListener('click', openAbout);
    if (nav === 'contact') btn.addEventListener('click', openContact);
  });

  /* ---------- post-procesado: bloom (resplandor del neon) ---------- */
  let composer = null;
  if (!LOW) {
    const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(dbs.x, dbs.y, {
      type: THREE.HalfFloatType, samples: 4,
    });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    // (resolucion, fuerza, radio, umbral) — solo brilla lo muy luminoso
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(dbs.x, dbs.y), 0.62, 0.45, 0.72));
    composer.addPass(new OutputPass());
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
  });

  /* ---------- bucle ---------- */
  drawMarquee();
  let last = 0;
  function loop(now) {
    const t = now / 1000;

    if (t - last > 0.07) {
      Screen.draw({ t, hover: hoverCart, zoomed: view !== 'wide' });
      drawMarquee();
      screenTex.needsUpdate = true;
      marqueeTex.needsUpdate = true;
      last = t;
    }

    // rotacion de la cabina (parallax solo en vista amplia)
    const targetRotY = view === 'wide'
      ? Math.sin(t * 0.35) * 0.16 + mxn * 0.4
      : 0;
    cab.rotation.y += (targetRotY - cab.rotation.y) * 0.06;
    cab.position.y = Math.sin(t * 1.2) * 0.012;

    // camara
    const v = VIEW[view];
    const px = v.pos.x + (view === 'wide' ? mxn * 1.3 : 0);
    const py = v.pos.y + (view === 'wide' ? -myn * 0.7 : 0);
    camera.position.lerp(tmpPos.set(px, py, v.pos.z), 0.06);
    lookCur.lerp(v.look, 0.06);
    camera.lookAt(lookCur);

    screenLight.intensity = 6 + Math.sin(t * 9) * 0.6;
    dust.rotation.y = t * 0.03;

    if (composer) composer.render();
    else renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  updateHint();

  /* ---------- revelar tras cargar fuentes ---------- */
  Screen.fontsLoaded.then(() => {
    setTimeout(() => {
      $('#loading').classList.add('hidden');
      $('#ui').classList.remove('hidden');
    }, 500);
  });
}

/* ---------- arranque ---------- */
$('#alias').textContent = PROFILE.alias;
if (hasWebGL()) {
  initScene();
} else {
  buildFallback();
}
