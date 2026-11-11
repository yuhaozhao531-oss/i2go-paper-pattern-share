import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createMaterials } from './materials.js';
import { puffyBox, addStitches, tube, loftAlong, roundedRectPoints, V } from './geometry.js';

const add = (parent, mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

/* ------------------------------------------------------------------ */
/*  Renderer / scene                                                   */
/* ------------------------------------------------------------------ */
const canvas = document.querySelector('#scene');
const stage = document.querySelector('.poc-viewer');
const loading = document.querySelector('#loading');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (err) {
  document.querySelector('#webglError').hidden = false;
  loading.classList.add('is-done');
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearAlpha(0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 45;
controls.maxDistance = 260;
controls.minPolarAngle = 0.16;
controls.maxPolarAngle = 1.55;
controls.autoRotateSpeed = 0.55;
controls.target.set(0, 21, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.03).texture;
scene.environmentIntensity = 0.52;

scene.add(new THREE.HemisphereLight('#fff8ec', '#cfc6b6', 0.42));
const key = new THREE.DirectionalLight('#fff5e6', 2.0);
key.position.set(38, 70, 42);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -45;
key.shadow.camera.right = 45;
key.shadow.camera.top = 70;
key.shadow.camera.bottom = -10;
key.shadow.camera.near = 1;
key.shadow.camera.far = 190;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.05;
key.shadow.radius = 5;
scene.add(key);
key.target.position.set(0, 25, 0);
scene.add(key.target);

const fill = new THREE.DirectionalLight('#e9efff', 0.55);
fill.position.set(-48, 28, 32);
scene.add(fill);
const rim = new THREE.DirectionalLight('#fff1d9', 1.15);
rim.position.set(-8, 44, -55);
scene.add(rim);
const frontFill = new THREE.DirectionalLight('#fff3e2', 0.3);
frontFill.position.set(0, 18, 65);
scene.add(frontFill);

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(512, 488, 18, 512, 512, 512);
  g.addColorStop(0, 'rgba(36,31,23,0.58)');
  g.addColorStop(0.3, 'rgba(36,31,23,0.32)');
  g.addColorStop(0.6, 'rgba(36,31,23,0.12)');
  g.addColorStop(1, 'rgba(36,31,23,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.ShadowMaterial({ color: '#3c352a', opacity: 0.14 }),
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = 0.01;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 38),
  new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.72, toneMapped: false }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.set(0, 0.035, 1);
contact.renderOrder = 2;
scene.add(contact);

/* ------------------------------------------------------------------ */
/*  Pattern-driven rolltop model                                       */
/* ------------------------------------------------------------------ */
const materials = createMaterials();
const bodyLeather = new THREE.MeshPhysicalMaterial({
  color: '#4f5a41',
  roughness: 0.62,
  metalness: 0.01,
  clearcoat: 0.16,
  clearcoatRoughness: 0.55,
  envMapIntensity: 0.7,
});
const strapLeather = new THREE.MeshPhysicalMaterial({
  color: '#3f4936',
  roughness: 0.58,
  metalness: 0.01,
  clearcoat: 0.18,
  clearcoatRoughness: 0.5,
  envMapIntensity: 0.65,
});
const edge = new THREE.MeshStandardMaterial({ color: '#2d3329', roughness: 0.82 });
const brass = new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.9, roughness: 0.28 });
const leather = strapLeather;
const trim = edge;
const webbing = strapLeather;
const metal = brass;
const plastic = edge;
const red = materials.red;

const root = new THREE.Group();
root.name = 'VLOTHO_Rolltop_POC';
scene.add(root);

const W = 27;
const H = 33;
const D = 11;
const ROLL_R = 2.85;
const TOP = H + ROLL_R * 2;

// Body, split into sewn panels.
const body = add(root, new THREE.Mesh(puffyBox(W - 0.2, H, D - 0.2, 2.4, 18, 0.55, 1), bodyLeather));
body.position.y = H / 2;

const bottomTrim = add(root, new THREE.Mesh(puffyBox(W + 0.2, 1.1, D + 0.2, 0.5, 8, 0.02, 1), trim));
bottomTrim.position.y = 0.65;

function panel(z, toward) {
  const g = new THREE.Group();
  const p = add(g, new THREE.Mesh(puffyBox(W - 1.6, H - 1.6, 0.46, 1.0, 10, 0.16, toward), bodyLeather));
  p.position.set(0, H / 2, z);
  const outline = roundedRectPoints(W - 1.6, H - 1.6, 0, 120, 0.55)
    .map((q) => q.setZ(z + toward * 0.34).setY(q.y + H / 2));
  add(g, tube(outline, 0.07, trim, { closed: true, segments: 220 }));
  addStitches(g, outline.map((q) => q.clone().setZ(z + toward * 0.37)), {
    normal: V(0, 0, toward),
    closed: true,
    gap: 0.72,
    dash: 0.32,
    offset: 0.01,
    material: materials.stitch,
  });
  root.add(g);
  return g;
}
panel(5.38, 1);
panel(-5.38, -1);

function sidePanel(x, sign) {
  const g = new THREE.Group();
  g.position.set(x, H / 2, 0);
  g.rotation.y = sign * Math.PI / 2;
  const p = add(g, new THREE.Mesh(puffyBox(D - 1.8, H - 1.8, 0.4, 1.0, 10, 0.12, 1), bodyLeather));
  const outline = roundedRectPoints(D - 1.8, H - 1.8, 0.3, 100, 0.55);
  add(g, tube(outline, 0.06, trim, { closed: true, segments: 180 }));
  addStitches(g, outline.map((q) => q.clone().setZ(0.32)), {
    normal: V(0, 0, 1),
    closed: true,
    gap: 0.78,
    dash: 0.3,
    offset: 0.01,
    material: materials.stitch,
  });
  root.add(g);
}
sidePanel(-13.28, -1);
sidePanel(13.28, 1);

// Short collar + roll at the body top (the 160 mm roll allowance is rolled,
// not modelled as a tall block).
const collar = add(root, new THREE.Mesh(puffyBox(W - 0.5, 2.0, D - 0.5, 2.2, 16, 0.42, 1), bodyLeather));
collar.position.y = H + 1.0;
const seamBand = add(root, new THREE.Mesh(puffyBox(W + 0.15, 1.0, D + 0.15, 0.45, 8, 0.02, 1), trim));
seamBand.position.y = H;
const frontLip = add(root, new THREE.Mesh(puffyBox(W - 1.6, 1.2, 0.5, 0.8, 6, 0.1, 1), bodyLeather));
frontLip.position.set(0, H - 0.2, 5.42);

// Rolled top.
const roll = new THREE.Mesh(new THREE.CylinderGeometry(ROLL_R, ROLL_R, W - 0.8, 32, 1, false), bodyLeather);
roll.rotation.z = Math.PI / 2;
roll.position.set(0, H + ROLL_R, 0.4);
add(root, roll);

// helical roll seam
const helixPts = [];
for (let i = 0; i <= 140; i++) {
  const t = i / 140;
  const a = t * Math.PI * 4.2;
  const x = -((W - 1.0) / 2) + t * (W - 1.0);
  const y = H + ROLL_R + (ROLL_R + 0.03) * Math.cos(a);
  const z = 0.4 + (ROLL_R + 0.03) * Math.sin(a);
  helixPts.push(V(x, y, z));
}
const rollSeam = add(root, tube(helixPts, 0.035, trim, { segments: 240, radial: 4 }), false);
rollSeam.castShadow = false;

// Roll securing strap over the top.
const rollStrapPts = [
  V(0, 23.0, 5.75),
  V(0, 30.0, 6.0),
  V(0, 34.0, 6.0),
  V(0, TOP + 0.9, 2.0),
  V(0, H + ROLL_R - 0.2, -4.0),
  V(0, 29.0, -5.6),
];
const rollCurve = new THREE.CatmullRomCurve3(rollStrapPts, false, 'centripetal', 0.5);
const rollStrap = add(root, new THREE.Mesh(
  loftAlong(rollCurve, {
    width: 2.4,
    thickness: 0.42,
    widthAxis: V(1, 0, 0),
    segments: 100,
    radial: 14,
  }),
  leather,
));
const buckle = add(root, new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.3, 0.8, 3, 0.2), brass));
buckle.position.set(0, 28.0, 6.22);
const buckleSlot = add(root, new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.86), trim));
buckleSlot.position.set(0, 28.0, 6.22);
const pin = add(root, new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 0.1), metal));
pin.position.set(0, 28.0, 6.65);

// Keepers on the roll strap.
for (const y of [25.2, 33.8]) {
  const k = add(root, new THREE.Mesh(new RoundedBoxGeometry(2.9, 0.85, 0.65, 2, 0.15), webbing));
  k.position.set(0, y, 5.98);
}

// Shoulder straps: 30 mm strap blank, curved around the back.
function shoulder(sign) {
  const pts = [
    V(8.5 * sign, 31.0, -5.1),
    V(11.2 * sign, 25.0, -5.9),
    V(12.9 * sign, 14.0, -5.9),
    V(12.4 * sign, 4.0, -5.6),
    V(11.2 * sign, 1.4, -5.3),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const g = new THREE.Group();
  add(g, new THREE.Mesh(
    loftAlong(curve, {
      width: 2.8,
      thickness: 0.62,
      widthAxis: V(1, 0, 0),
      segments: 90,
      radial: 14,
    }),
    leather,
  ));
  // adjuster
  const t = 0.82;
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t).normalize();
  let side = V(1, 0, 0).addScaledVector(tan, -tan.x).normalize();
  const n = new THREE.Vector3().crossVectors(side, tan).normalize();
  const adj = add(g, new THREE.Mesh(new RoundedBoxGeometry(3.6, 2.0, 0.65, 3, 0.18), plastic));
  adj.position.copy(p).addScaledVector(n, 0.38);
  adj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, tan, n));
  root.add(g);
  return g;
}
shoulder(-1);
shoulder(1);

// Top carry loop, 180 × 20 mm.
const loopPts = [V(-4.2, H + ROLL_R * 2 - 0.2, -2.0), V(0, H + ROLL_R * 2 + 2.2, -2.0), V(4.2, H + ROLL_R * 2 - 0.2, -2.0)];
const loopCurve = new THREE.CatmullRomCurve3(loopPts, false, 'centripetal', 0.5);
add(root, tube(loopPts, 0.34, bodyLeather, { segments: 36, radial: 14 }));
for (const x of [-4.2, 4.2]) {
  const anchor = add(root, new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.8, 1.4, 2, 0.2), leather));
  anchor.position.set(x, H + ROLL_R * 2 - 0.2, -2.0);
}

// Anchor patches for shoulder straps.
for (const sign of [-1, 1]) {
  const patchTop = add(root, new THREE.Mesh(new RoundedBoxGeometry(4.0, 2.4, 0.38, 3, 0.3), leather));
  patchTop.position.set(8.6 * sign, 31.0, -5.35);
  const patchBottom = add(root, new THREE.Mesh(new RoundedBoxGeometry(3.4, 2.0, 0.38, 3, 0.3), leather));
  patchBottom.position.set(11.2 * sign, 1.8, -5.3);
}

// Small POC label on the front.
function labelTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = 'rgba(30,31,28,.75)';
  ctx.font = '500 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const label = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 1.3),
  new THREE.MeshStandardMaterial({ map: labelTexture('PATTERN POC'), transparent: true, depthWrite: false, roughness: 0.8 }),
);
label.position.set(0, 8.2, 5.66);
label.renderOrder = 2;
root.add(label);

// Stitched seam around bottom.
const bottomStitch = roundedRectPoints(W - 0.6, D - 0.6, 0, 100, 0.5).map((p) => p.setY(1.15));
addStitches(root, bottomStitch, {
  normal: V(0, 1, 0),
  closed: true,
  gap: 0.9,
  dash: 0.34,
  offset: 0.02,
  material: materials.stitchDark,
});

/* ------------------------------------------------------------------ */
/*  Camera / views                                                     */
/* ------------------------------------------------------------------ */
const DIRECTIONS = {
  iso: [0.72, 0.10, -0.70],
  front: [0, 0.06, 1],
  side: [1, 0.06, 0.03],
  back: [0, 0.08, -1],
};
let currentView = 'iso';
let paused = false;

function fitDistance() {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.5));
  return Math.max(
    size.y / 2 / Math.tan(vFov / 2),
    size.x / 2 / Math.tan(hFov / 2),
    size.z / 2 / Math.tan(vFov / 2),
  ) * 1.36;
}

function frame(name = 'iso') {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const dist = fitDistance();
  const dir = new THREE.Vector3(...(DIRECTIONS[name] || DIRECTIONS.iso)).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(dir, dist);
  controls.update();
  currentView = name;
  document.querySelectorAll('.view').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
}

function resize() {
  const r = stage.getBoundingClientRect();
  renderer.setSize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)), false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
const ro = new ResizeObserver(resize);
ro.observe(stage);
resize();

document.querySelectorAll('.view').forEach((b) => b.addEventListener('click', () => frame(b.dataset.view)));
const rotateBtn = document.querySelector('#rotate');
rotateBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  rotateBtn.classList.toggle('is-active', controls.autoRotate);
});
canvas.addEventListener('dblclick', () => frame('iso'));

let tri = 0;
root.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  const g = o.geometry;
  if (g.index) tri += g.index.count / 3;
  else if (g.attributes.position) tri += g.attributes.position.count / 3;
});
document.querySelector('#triStat').textContent = `${(tri / 1000).toFixed(1)}K TRIS`;

let last = performance.now();
function animate(now = performance.now()) {
  if (paused) return;
  requestAnimationFrame(animate);
  const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
  last = now;
  controls.update(dt);
  renderer.render(scene, camera);
}

window.__poc = {
  ready: false,
  setView: (v) => frame(v),
  pause: () => { paused = true; },
  resume: () => { if (paused) { paused = false; last = performance.now(); animate(); } },
  scene,
  camera,
  controls,
  root,
};

frame('iso');
animate();
requestAnimationFrame(() => requestAnimationFrame(() => {
  renderer.render(scene, camera);
  loading.classList.add('is-done');
  window.__poc.ready = true;
}));
