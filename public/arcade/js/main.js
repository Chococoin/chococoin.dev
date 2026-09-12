// Portafolio Arcade — modelo 3D real (GLTF) + iluminacion HDRI.

import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { buildRoom } from './room.js';
import { PROJECTS, PROFILE } from './projects.js';
import * as Screen from './screen.js';

// En pantallas pequeñas se bajan los efectos para mantener fluidez.
const LOW = window.matchMedia('(max-width: 820px)').matches;

const $ = (s) => document.querySelector(s);

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

/* ============================================================
   FALLBACK 2D (sin WebGL o si falla la carga del modelo)
   ============================================================ */
let fellBack = false;
function buildFallback() {
  if (fellBack) return;
  fellBack = true;
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
  $('#ui').classList.add('hidden');
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
    <p class="credits">Modelo de cabina: "Arcade Cabinet" por
      <a href="https://sketchfab.com/joshtmc" target="_blank" rel="noopener">joshtmc</a>,
      licencia <a href="http://creativecommons.org/licenses/by/4.0/"
      target="_blank" rel="noopener">CC-BY-4.0</a>.
      Entorno HDRI: Neon Photostudio (Poly Haven, CC0).</p>
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0a0c');
  scene.fog = new THREE.Fog('#0a0a0c', 9, 21);

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 2.2, 6);

  /* --- textura de la pantalla (portafolio pixel art) --- */
  const screenTex = new THREE.CanvasTexture(Screen.canvas);
  screenTex.magFilter = THREE.NearestFilter;
  screenTex.minFilter = THREE.NearestFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.flipY = true;

  /* --- sala arcade en grises + reflejos generados desde la propia sala --- */
  const room = buildRoom(scene, { low: LOW, maxAniso: renderer.capabilities.getMaxAnisotropy() });
  let hdriReady = false; // (nombre heredado) = entorno listo
  {
    // la sala se fotografia desde la altura de la pantalla para el mapa de entorno
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#0a0a0c');
    scene.remove(room.group);
    room.group.position.y = -1.6;
    envScene.add(room.group, new THREE.HemisphereLight('#ffffff', '#222222', 1.2));
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.06).texture;
    pmrem.dispose();
    envScene.remove(room.group);
    room.group.position.y = 0;
    scene.add(room.group);
    hdriReady = true;
  }

  /* --- luces --- */
  // luz principal: da forma a la cabina y proyecta su sombra de contacto
  const key = new THREE.DirectionalLight('#fff4e6', 1.6);
  key.position.set(-4, 7, 4);
  key.target.position.set(0, 1.6, 0);
  scene.add(key, key.target);
  if (!LOW) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 26;
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0016;
    key.shadow.radius = 4;
  }
  // relleno suave
  const hemi = new THREE.HemisphereLight('#cdd6f0', '#2a2438', 0.45);
  scene.add(hemi);
  // brillo del color de la pantalla sobre la cabina
  const screenLight = new THREE.PointLight('#1ee6e6', 1.2, 8);
  screenLight.position.set(0, 2.4, 2);
  scene.add(screenLight);

  /* --- sombra de contacto extra sobre el suelo de la sala --- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- carga del modelo de la cabina ---------- */
  let cabinet = null;     // gltf.scene
  let screenMesh = null;  // malla de la pantalla
  let sideArtMesh = null; // malla con el arte lateral y la marquesina
  let modelReady = false;
  const VIEW = {
    wide:   { pos: new THREE.Vector3(0, 2.2, 6), look: new THREE.Vector3(0, 1.6, 0) },
    zoomed: { pos: new THREE.Vector3(0, 2.0, 2), look: new THREE.Vector3(0, 2.0, 0) },
  };
  let viewsReady = false;
  let view = 'wide';
  const lookCur = VIEW.wide.look.clone();
  const tmpPos = new THREE.Vector3();

  new GLTFLoader().load('assets/cabinet/scene.gltf', (gltf) => {
    cabinet = gltf.scene;

    // normalizar: escalar a ~3 de alto y apoyar la base en y=0
    let box = new THREE.Box3().setFromObject(cabinet);
    const size = box.getSize(new THREE.Vector3());
    const s = 3.0 / size.y;
    cabinet.scale.setScalar(s);
    box = new THREE.Box3().setFromObject(cabinet);
    const c = box.getCenter(new THREE.Vector3());
    cabinet.position.x -= c.x;
    cabinet.position.z -= c.z;
    cabinet.position.y -= box.min.y;

    // sombras, materiales y deteccion de la pantalla
    cabinet.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) {
        o.material.envMapIntensity = 1.0;
        // el modelo viene con alphaMode BLEND erroneo -> forzar opaco
        o.material.transparent = false;
        o.material.depthWrite = true;
        o.material.needsUpdate = true;
        if (o.material.name === 'Screen') screenMesh = o;
        if (o.material.name === 'material') sideArtMesh = o;
      }
    });

    // sustituir el material de la pantalla por el portafolio pixel art
    if (screenMesh) {
      screenMesh.material = new THREE.MeshStandardMaterial({
        map: screenTex,
        emissive: 0xffffff,
        emissiveMap: screenTex,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.0,
      });
      screenMesh.castShadow = false;
    }

    scene.add(cabinet);
    computeViews();
    Screen.fontsLoaded.then(() => patchMarquee(sideArtMesh));
    modelReady = true;
    tryReveal();
  }, undefined, (err) => {
    console.error('No se pudo cargar el modelo:', err);
    buildFallback();
  });

  /* ---------- marquesina: "FULLSTACK WEB3" en lugar de "TWOFISH SERPENT" ----------
     El rotulo original esta pintado en material_baseColor.png (rect. aprox. x 146-368,
     y 290-378 de 512; el mapeado UV invierte el eje vertical). Se repinta
     ese rectangulo en un canvas ampliado y se usa tambien como mapa emisivo. */
  function patchMarquee(mesh) {
    if (!mesh || !mesh.material) return;
    new THREE.TextureLoader().load('assets/cabinet/textures/material_baseColor.png', (baseTex) => {
      const src = baseTex.image;
      const S = 2048, k = S / 512;
      const R = { x: 146 * k, y: 290 * k, w: 222 * k, h: 88 * k };
      const mkCanvas = () => {
        const c = document.createElement('canvas');
        c.width = c.height = S;
        return [c, c.getContext('2d')];
      };
      const [base, bctx] = mkCanvas();
      bctx.drawImage(src, 0, 0, S, S);
      const [emis, ectx] = mkCanvas();
      ectx.fillStyle = '#000';
      ectx.fillRect(0, 0, S, S);

      const drawText = (g, withPlate) => {
        g.save();
        g.translate(R.x + R.w / 2, R.y + R.h / 2);
        g.scale(1, -1); // el mapeado UV de la marquesina invierte el eje vertical
        if (withPlate) {
          g.fillStyle = '#07060f';
          g.beginPath();
          g.roundRect(-R.w / 2, -R.h / 2, R.w, R.h, 26);
          g.fill();
        }
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        // Press Start 2P: cada caracter mide lo mismo que el tamano de fuente
        const f1 = Math.round(Math.min(R.h * 0.30, (R.w * 0.86) / 9));
        const f2 = Math.round(Math.min(R.h * 0.42, (R.w * 0.86) / 4));
        // linea 1: FULLSTACK (amarillo con sombra rosa)
        g.font = `${f1}px "Press Start 2P", monospace`;
        g.fillStyle = '#ff2e88';
        g.fillText('FULLSTACK', 5, -R.h * 0.22 + 5);
        g.fillStyle = '#ffe22e';
        g.fillText('FULLSTACK', 0, -R.h * 0.22);
        // linea 2: WEB3 (cian con sombra rosa)
        g.font = `${f2}px "Press Start 2P", monospace`;
        g.fillStyle = '#ff2e88';
        g.fillText('WEB3', 6, R.h * 0.22 + 6);
        g.fillStyle = '#1ee6e6';
        g.fillText('WEB3', 0, R.h * 0.22);
        g.restore();
      };
      drawText(bctx, true);
      drawText(ectx, false);

      const mkTex = (c) => {
        const t = new THREE.CanvasTexture(c);
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = baseTex.wrapS; t.wrapT = baseTex.wrapT;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      };
      const m = mesh.material;
      m.map = mkTex(base);
      m.emissiveMap = mkTex(emis);
      m.emissive = new THREE.Color(0xffffff);
      m.emissiveIntensity = 1.0;
      m.needsUpdate = true;
    });
  }

  // calcula encuadres de camara a partir del modelo cargado
  function computeViews() {
    const mBox = new THREE.Box3().setFromObject(cabinet);
    const mCenter = mBox.getCenter(new THREE.Vector3());
    const mSize = mBox.getSize(new THREE.Vector3());
    const fov = THREE.MathUtils.degToRad(camera.fov);

    let sCenter = mCenter.clone();
    let sSize = mSize.clone();
    if (screenMesh) {
      const sBox = new THREE.Box3().setFromObject(screenMesh);
      sCenter = sBox.getCenter(new THREE.Vector3());
      sSize = sBox.getSize(new THREE.Vector3());
    }
    // direccion frontal (horizontal): del centro del modelo al de la pantalla
    const front = new THREE.Vector3(
      sCenter.x - mCenter.x, 0, sCenter.z - mCenter.z);
    if (front.lengthSq() < 1e-4) front.set(0, 0, 1);
    front.normalize();

    const wideDist = (mSize.y * 0.66) / Math.tan(fov / 2);
    VIEW.wide.pos.copy(mCenter)
      .addScaledVector(front, wideDist);
    VIEW.wide.pos.y = mCenter.y + mSize.y * 0.10;
    VIEW.wide.look.copy(mCenter);

    const zSpan = Math.max(sSize.x / camera.aspect, sSize.y);
    const zDist = (zSpan * 0.66) / Math.tan(fov / 2) + sSize.z;
    VIEW.zoomed.pos.copy(sCenter).addScaledVector(front, zDist);
    VIEW.zoomed.pos.y = sCenter.y + sSize.y * 0.04;
    VIEW.zoomed.look.copy(sCenter);

    camera.position.copy(VIEW.wide.pos);
    lookCur.copy(VIEW.wide.look);
    screenLight.position.copy(sCenter).addScaledVector(front, 0.6);
    viewsReady = true;
  }

  /* ---------- post-procesado: bloom ---------- */
  let composer = null;
  if (!LOW) {
    const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(dbs.x, dbs.y, {
      type: THREE.HalfFloatType, samples: 4,
    });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(dbs.x, dbs.y), 0.18, 0.3, 0.85));
    composer.addPass(new OutputPass());
  }

  /* ---------- interaccion ---------- */
  let mxn = 0, myn = 0;
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
    if (!screenMesh) return null;
    const hit = raycaster.intersectObject(screenMesh, false)[0];
    if (hit && hit.uv) {
      return Screen.hitTest(hit.uv.x * Screen.W, (1 - hit.uv.y) * Screen.H);
    }
    return null;
  }

  canvas.addEventListener('pointermove', (e) => {
    mxn = e.clientX / innerWidth - 0.5;
    myn = e.clientY / innerHeight - 0.5;
    if (overlayOpen || !cabinet) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    let cursor = 'default';
    if (view === 'wide') {
      hoverCart = null;
      if (raycaster.intersectObject(cabinet, true).length) cursor = 'pointer';
    } else {
      hoverCart = cartFromScreen();
      if (hoverCart) cursor = 'pointer';
    }
    canvas.style.cursor = cursor;
  });

  canvas.addEventListener('click', (e) => {
    if (overlayOpen || !cabinet) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    if (view === 'wide') {
      if (raycaster.intersectObject(cabinet, true).length) {
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

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
  });

  /* ---------- bucle ---------- */
  let last = 0;
  let baseYaw = 0;
  function loop(now) {
    const t = now / 1000;

    if (t - last > 0.07) {
      Screen.draw({ t, hover: hoverCart, zoomed: view !== 'wide' });
      screenTex.needsUpdate = true;
      last = t;
    }

    if (cabinet) {
      // rotacion idle suave + parallax (solo en vista amplia)
      const targetYaw = view === 'wide'
        ? baseYaw + Math.sin(t * 0.3) * 0.13 + mxn * 0.35
        : baseYaw;
      cabinet.rotation.y += (targetYaw - cabinet.rotation.y) * 0.05;
    }

    if (viewsReady) {
      const v = VIEW[view];
      const px = v.pos.x + (view === 'wide' ? mxn * 1.2 : 0);
      const py = v.pos.y + (view === 'wide' ? -myn * 0.6 : 0);
      camera.position.lerp(tmpPos.set(px, py, v.pos.z), 0.055);
      lookCur.lerp(v.look, 0.055);
      camera.lookAt(lookCur);
    }

    screenLight.intensity = 1.2 + Math.sin(t * 9) * 0.15;
    room.update(t);

    if (composer) composer.render();
    else renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  updateHint();

  /* ---------- revelar cuando todo este listo ---------- */
  let fontsReady = false;
  let revealed = false;
  Screen.fontsLoaded.then(() => { fontsReady = true; tryReveal(); });
  function tryReveal() {
    if (revealed || fellBack) return;
    if (fontsReady && hdriReady && modelReady) {
      revealed = true;
      setTimeout(() => {
        $('#loading').classList.add('hidden');
        $('#ui').classList.remove('hidden');
      }, 400);
    }
  }
  // red de seguridad: si algo tarda demasiado, fallback 2D
  setTimeout(() => { if (!revealed && !fellBack) buildFallback(); }, 25000);
}

/* ---------- arranque ---------- */
$('#alias').textContent = PROFILE.alias;
if (hasWebGL()) {
  initScene();
} else {
  buildFallback();
}
