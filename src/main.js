import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createMaterials, COLORWAYS } from './materials.js';
import { buildBackpack, setExploded, setColorway } from './backpack.js';

/* ------------------------------------------------------------------ *
 *  Content
 * ------------------------------------------------------------------ */
const FEATURES = [
  {
    id: 'front',
    no: '01',
    title: '前袋分区',
    sub: 'FRONT ORGANIZER',
    desc: '独立前袋带双向拉链，内置 2 个插袋、2 个笔位和抓绒衬里小袋。手机、卡包和笔各有位置，开口角度足够单手取放。',
    chips: ['2 SLIP POCKETS', '2 PEN LOOPS', 'FLEECE ZIP'],
    anchor: new THREE.Vector3(4.4, 3.2, 9.9),
    normal: new THREE.Vector3(0, 0, 1),
    view: 'front',
    action: '展开前袋结构',
  },
  {
    id: 'main',
    no: '02',
    title: '中袋全开',
    sub: 'FULL-OPEN MAIN',
    desc: '主仓采用双拉头，可向两侧完全打开。大开口便于装取衣物和器材，也方便在产线上核对内里与结构。',
    chips: ['DOUBLE SLIDER', 'FULL OPEN', '210D LINING'],
    anchor: new THREE.Vector3(0, 21.9, 4.6),
    normal: new THREE.Vector3(0, 1, 0),
    view: 'iso',
    action: '查看顶部双拉头',
  },
  {
    id: 'laptop',
    no: '03',
    title: '独立电脑仓',
    sub: 'LAPTOP SLEEVE',
    desc: '贴背独立电脑仓，加厚泡棉围边与横向弹力带固定设备。可容纳 15.6 英寸笔记本，电脑不直接接触主仓硬物。',
    chips: ['15.6"', 'PADDED', 'ELASTIC STRAP'],
    anchor: new THREE.Vector3(5.2, 4.0, -9.6),
    normal: new THREE.Vector3(0, 0, -1),
    view: 'back',
    action: '打开电脑仓',
  },
  {
    id: 'harness',
    no: '04',
    title: '减压肩带',
    sub: 'HARNESS SYSTEM',
    desc: 'S 形泡棉肩带贴合肩背，内侧网布增加透气。胸扣可上下调节，底部织带可调长度，背包重心更稳定。',
    chips: ['MESH BACKING', 'STERNUM STRAP', 'ADJUSTABLE'],
    anchor: new THREE.Vector3(-10.7, 9.0, -10.9),
    normal: new THREE.Vector3(0, 0, -1),
    view: 'back',
    action: '切到背面',
  },
  {
    id: 'back',
    no: '05',
    title: '透气背板',
    sub: 'AIRFLOW BACK',
    desc: '三通道泡棉背板，中央留出空气流动空间。横向织带可套在行李箱拉杆上，出差时直接叠放。',
    chips: ['3D CHANNELS', 'LUGGAGE STRAP', 'MESH'],
    anchor: new THREE.Vector3(8.3, -2.4, -9.6),
    normal: new THREE.Vector3(0, 0, -1),
    view: 'back',
    action: '切到背面',
  },
  {
    id: 'fabric',
    no: '06',
    title: '面料与五金',
    sub: 'MATERIALS & HARDWARE',
    desc: '包体为 600D 尼龙，里布 210D。前袋使用反穿拉链，只露出金属拉头；拉片带 i2GO 字标，红色织带作为识别点。',
    chips: ['NYLON 600D', 'REVERSE ZIP', 'METAL PULLER'],
    anchor: new THREE.Vector3(13.3, 11.0, 8.1),
    normal: new THREE.Vector3(1, 0, 0),
    view: 'iso',
    action: '回到 45°',
  },
];

const VIEWS = {
  iso: { dir: [0.46, 0.16, 0.88], label: 'ISO / 45°' },
  front: { dir: [0, 0.075, 1], label: 'FRONT / 正面' },
  side: { dir: [1, 0.08, 0.02], label: 'SIDE / 侧面' },
  back: { dir: [0, 0.1, -1], label: 'BACK / 背面' },
  harness: { dir: [0.55, 0.12, -0.85], label: 'HARNESS / 背负' },
};

const params = new URLSearchParams(location.search);
const isClean = params.get('clean') === '1';
if (isClean) document.body.classList.add('clean');

/* ------------------------------------------------------------------ *
 *  Renderer / scene
 * ------------------------------------------------------------------ */
const canvas = document.querySelector('#scene');
const stage = document.querySelector('#stage');
const loading = document.querySelector('#loading');
const errorPanel = document.querySelector('#webglError');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
} catch (err) {
  errorPanel.hidden = false;
  loading.classList.add('is-done');
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearAlpha(0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 500);
const TARGET = new THREE.Vector3(0, 22.2, 0);
camera.position.set(50, 38, 98);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 58;
controls.maxDistance = 195;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = 1.54;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.75;
controls.autoRotateSpeed = 0.55;
controls.update();

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.03).texture;
scene.environmentIntensity = 0.5;

const hemi = new THREE.HemisphereLight('#fff8ec', '#cfc6b6', 0.4);
scene.add(hemi);

const key = new THREE.DirectionalLight('#fff5e6', 2.0);
key.position.set(28, 60, 34);
key.target.position.set(0, 20, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -38;
key.shadow.camera.right = 38;
key.shadow.camera.top = 52;
key.shadow.camera.bottom = -12;
key.shadow.camera.near = 1;
key.shadow.camera.far = 160;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.055;
key.shadow.radius = 5;
scene.add(key);
scene.add(key.target);

const fill = new THREE.DirectionalLight('#e9efff', 0.55);
fill.position.set(-44, 22, 30);
scene.add(fill);

const frontFill = new THREE.DirectionalLight('#fff3e2', 0.35);
frontFill.position.set(4, 14, 60);
scene.add(frontFill);

const rim = new THREE.DirectionalLight('#fff1d9', 1.0);
rim.position.set(-8, 38, -50);
scene.add(rim);

const edge = new THREE.DirectionalLight('#ffffff', 0.35);
edge.position.set(20, 6, 40);
scene.add(edge);

/* ------------------------------------------------------------------ *
 *  Studio floor + contact shadow
 * ------------------------------------------------------------------ */
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(512, 488, 18, 512, 512, 512);
  g.addColorStop(0, 'rgba(36,31,23,0.58)');
  g.addColorStop(0.28, 'rgba(36,31,23,0.34)');
  g.addColorStop(0.56, 'rgba(36,31,23,0.14)');
  g.addColorStop(0.8, 'rgba(36,31,23,0.035)');
  g.addColorStop(1, 'rgba(36,31,23,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.ShadowMaterial({ color: '#3c352a', opacity: 0.14 }),
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = 0.02;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(56, 34),
  new THREE.MeshBasicMaterial({
    map: shadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
    toneMapped: false,
  }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.set(-1, 0.045, 1);
contact.renderOrder = 2;
scene.add(contact);

/* ------------------------------------------------------------------ *
 *  Model
 * ------------------------------------------------------------------ */
const materials = createMaterials();
const bag = buildBackpack(materials);
bag.position.y = 21.6;
scene.add(bag);

bag.traverse((o) => {
  if (!o.isMesh) return;
  o.castShadow = o.castShadow !== false;
  o.receiveShadow = true;
  if (o.material && o.material.transparent) o.castShadow = false;
  if (o.isInstancedMesh) o.castShadow = false;
});

let triangles = 0;
bag.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry;
  if (!g) return;
  if (g.index) triangles += g.index.count / 3;
  else if (g.attributes.position) triangles += g.attributes.position.count / 3;
});
const trisEl = document.querySelector('#triCount');
trisEl.textContent = `${(triangles / 1000).toFixed(1)}K TRIS`;

/* ------------------------------------------------------------------ *
 *  Dimensions
 * ------------------------------------------------------------------ */
const dimGroup = new THREE.Group();
dimGroup.name = 'Dimensions';
dimGroup.visible = false;
scene.add(dimGroup);

function dimensionLabel(value, unit, caption) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(248,245,237,0.9)';
  ctx.strokeStyle = 'rgba(160,61,48,0.22)';
  ctx.lineWidth = 2;
  const x = 18;
  const y = 42;
  const w = 476;
  const h = 172;
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8d392d';
  ctx.textBaseline = 'middle';
  ctx.font = '500 104px "Cascadia Mono", Consolas, monospace';
  ctx.fillText(value, 44, 122);
  ctx.font = '400 36px "Cascadia Mono", Consolas, monospace';
  const vw = ctx.measureText(value).width;
  ctx.fillStyle = '#746b5d';
  ctx.fillText(unit, 54 + vw, 132);
  ctx.font = '400 22px "Cascadia Mono", Consolas, monospace';
  ctx.fillStyle = '#a49a8a';
  ctx.fillText(caption, 46, 182);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(10.6, 5.3, 1);
  sprite.renderOrder = 30;
  return sprite;
}

function dimLine(a, b, label, { labelPos, caption = '', value = '', unit = 'cm' } = {}) {
  const mat = new THREE.LineBasicMaterial({
    color: '#9d3e32',
    transparent: true,
    opacity: 0.78,
    depthTest: false,
  });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    mat,
  );
  line.renderOrder = 20;
  dimGroup.add(line);

  const dir = b.clone().sub(a).normalize();
  for (const [p, sign] of [[a, -1], [b, 1]]) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.5, 10),
      new THREE.MeshBasicMaterial({
        color: '#9d3e32',
        transparent: true,
        opacity: 0.85,
        depthTest: false,
        toneMapped: false,
      }),
    );
    cone.position.copy(p);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().multiplyScalar(sign));
    cone.renderOrder = 20;
    dimGroup.add(cone);
  }
  if (label) {
    const sprite = dimensionLabel(value, unit, caption);
    sprite.position.copy(labelPos);
    dimGroup.add(sprite);
  }
}

// Height / width / depth, matching the 43 x 32 x 18 cm sample
dimLine(
  new THREE.Vector3(-19.5, 0.35, 5.8),
  new THREE.Vector3(-19.5, 43.3, 5.8),
  true,
  { labelPos: new THREE.Vector3(-24.2, 22.2, 8.2), caption: 'ALTURA / HEIGHT', value: '43' },
);
dimLine(
  new THREE.Vector3(-16, 0.4, 10.4),
  new THREE.Vector3(16, 0.4, 10.4),
  true,
  { labelPos: new THREE.Vector3(-9.0, 5.8, 14.2), caption: 'ANCHO / WIDTH', value: '32' },
);
dimLine(
  new THREE.Vector3(18.8, 0.45, -9),
  new THREE.Vector3(18.8, 0.45, 9),
  true,
  { labelPos: new THREE.Vector3(22.0, 7.6, 6.2), caption: 'PROFUNDIDAD', value: '18' },
);

// extension ticks
const tickMat = new THREE.LineBasicMaterial({
  color: '#9d3e32',
  transparent: true,
  opacity: 0.4,
  depthTest: false,
});
for (const [a, b] of [
  [new THREE.Vector3(-16, 0.35, 5.8), new THREE.Vector3(-19.5, 0.35, 5.8)],
  [new THREE.Vector3(-16, 43.3, 5.8), new THREE.Vector3(-19.5, 43.3, 5.8)],
  [new THREE.Vector3(-16, 0.4, 7.6), new THREE.Vector3(-16, 0.4, 10.4)],
  [new THREE.Vector3(16, 0.4, 7.6), new THREE.Vector3(16, 0.4, 10.4)],
  [new THREE.Vector3(16, 0.45, -9), new THREE.Vector3(18.8, 0.45, -9)],
  [new THREE.Vector3(16, 0.45, 9), new THREE.Vector3(18.8, 0.45, 9)],
]) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), tickMat);
  l.renderOrder = 19;
  dimGroup.add(l);
}

/* ------------------------------------------------------------------ *
 *  Camera framing / view transitions
 * ------------------------------------------------------------------ */
let camTween = null;
let explodeAmount = 0;
let explodeTarget = 0;
let explodeAnim = null;
let currentView = 'iso';

function fitDistance() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const height = 47;
  const width = explodeTarget > 0.5 ? 51 : 39;
  const dv = (height / 2) / Math.tan(vFov / 2) * 1.16;
  const dh = (width / 2) / Math.tan(hFov / 2) * 1.12;
  return Math.max(dv, dh) * (isClean ? 0.94 : 1);
}

function viewPosition(name, distance = fitDistance()) {
  const d = new THREE.Vector3(...VIEWS[name].dir).normalize();
  return TARGET.clone().addScaledVector(d, distance);
}

function updateViewButtons(name) {
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.view === name);
  });
  const el = document.querySelector('#viewName');
  if (el) el.textContent = VIEWS[name]?.label || 'FREE / 自由视角';
}

function cancelTween() {
  camTween = null;
}

function setView(name, { immediate = false } = {}) {
  if (!VIEWS[name]) return;
  currentView = name;
  updateViewButtons(name);
  const to = viewPosition(name);
  if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    camera.position.copy(to);
    controls.target.copy(TARGET);
    controls.update();
    camTween = null;
    return;
  }
  camTween = {
    t: 0,
    dur: 0.95,
    start: performance.now(),
    fromPos: camera.position.clone(),
    toPos: to,
    fromTarget: controls.target.clone(),
    toTarget: TARGET.clone(),
  };
  controls.enabled = true;
}

function zoomTo(distance, { immediate = false } = {}) {
  const dir = camera.position.clone().sub(controls.target).normalize();
  const to = controls.target.clone().addScaledVector(dir, distance);
  if (immediate) {
    camera.position.copy(to);
    controls.update();
    return;
  }
  camTween = {
    t: 0,
    dur: 0.8,
    start: performance.now(),
    fromPos: camera.position.clone(),
    toPos: to,
    fromTarget: controls.target.clone(),
    toTarget: controls.target.clone(),
  };
}

controls.addEventListener('start', () => {
  camTween = null;
  if (currentView) {
    currentView = null;
    updateViewButtons(null);
  }
});

canvas.addEventListener('dblclick', () => setView('iso'));

document.querySelectorAll('[data-view]').forEach((b) => {
  b.addEventListener('click', () => {
    setView(b.dataset.view);
    closeCard();
  });
});

/* ------------------------------------------------------------------ *
 *  Exploded construction view
 * ------------------------------------------------------------------ */
function applyExplode(value, immediate = false) {
  if (immediate) {
    explodeAmount = value;
    explodeAnim = null;
  }
  setExploded(bag, explodeAmount, false);
  const btn = document.querySelector('[data-action="explode"]');
  if (btn) {
    btn.classList.toggle('is-active', explodeTarget > 0.5);
    btn.setAttribute('aria-pressed', String(explodeTarget > 0.5));
    btn.querySelector('span:last-child').textContent = explodeTarget > 0.5 ? '收起结构' : '结构分解';
  }
}

function toggleExplode(force) {
  explodeTarget = typeof force === 'boolean' ? (force ? 1 : 0) : (explodeTarget > 0.5 ? 0 : 1);
  explodeAnim = {
    from: explodeAmount,
    to: explodeTarget,
    start: performance.now(),
    dur: 0.7,
  };
  const btn = document.querySelector('[data-action="explode"]');
  if (btn) {
    btn.classList.toggle('is-active', explodeTarget > 0.5);
    btn.setAttribute('aria-pressed', String(explodeTarget > 0.5));
    btn.querySelector('span:last-child').textContent = explodeTarget > 0.5 ? '收起结构' : '结构分解';
  }
  zoomTo(fitDistance() * (explodeTarget > 0.5 ? 1.06 : 1));
}

/* ------------------------------------------------------------------ *
 *  Hotspots / feature cards
 * ------------------------------------------------------------------ */
const hotspotWrap = document.querySelector('#hotspots');
const featureCard = document.querySelector('#featureCard');
const cardNo = document.querySelector('#cardNo');
const cardSub = document.querySelector('#cardSub');
const cardTitle = document.querySelector('#cardTitle');
const cardDesc = document.querySelector('#cardDesc');
const cardChips = document.querySelector('#cardChips');
const cardAction = document.querySelector('#cardAction');
const featureButtons = [...document.querySelectorAll('[data-feature]')];
let labelsOn = false;
let selectedFeature = null;

const hotspotEls = new Map();
for (const f of FEATURES) {
  const b = document.createElement('button');
  b.className = 'hotspot is-hidden';
  b.dataset.hotspot = f.id;
  b.textContent = f.no;
  b.title = f.title;
  b.setAttribute('aria-label', `${f.no} ${f.title}`);
  b.addEventListener('click', () => openFeature(f.id));
  hotspotWrap.appendChild(b);
  hotspotEls.set(f.id, b);
}

const featureById = new Map(FEATURES.map((f) => [f.id, f]));

function setLabels(on) {
  labelsOn = on;
  hotspotWrap.setAttribute('aria-hidden', String(!on));
  hotspotWrap.classList.toggle('is-on', on);
  const btn = document.querySelector('[data-action="labels"]');
  if (btn) {
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
  if (!on) {
    hotspotEls.forEach((el) => el.classList.add('is-hidden'));
  }
}

function setActiveFeature(id) {
  selectedFeature = id;
  featureButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.feature === id));
  hotspotEls.forEach((el, key) => el.classList.toggle('is-active', key === id));
}

function openFeature(id) {
  const f = featureById.get(id);
  if (!f) return;
  setActiveFeature(id);
  if (!labelsOn) setLabels(true);
  if (f.view && f.view !== currentView) setView(f.view);

  cardNo.textContent = f.no;
  cardSub.textContent = f.sub;
  cardTitle.textContent = f.title;
  cardDesc.textContent = f.desc;
  cardChips.innerHTML = '';
  for (const chip of f.chips) {
    const s = document.createElement('span');
    s.textContent = chip;
    cardChips.appendChild(s);
  }

  const exploded = explodeTarget > 0.5;
  if (id === 'front') cardAction.firstChild.textContent = exploded ? '收起结构 ' : '展开前袋结构 ';
  else if (id === 'laptop') cardAction.firstChild.textContent = exploded ? '收起结构 ' : '打开电脑仓 ';
  else cardAction.firstChild.textContent = `${f.action} `;
  cardAction.dataset.feature = id;
  featureCard.hidden = false;
}

function closeCard() {
  featureCard.hidden = true;
  setActiveFeature(null);
}

featureButtons.forEach((b) => {
  b.addEventListener('click', () => openFeature(b.dataset.feature));
});
document.querySelector('#cardClose').addEventListener('click', closeCard);
cardAction.addEventListener('click', () => {
  const id = cardAction.dataset.feature;
  if (id === 'front') {
    toggleExplode();
    setView('front');
  } else if (id === 'laptop') {
    toggleExplode();
    setView('back');
  } else {
    const f = featureById.get(id);
    setView(f.view);
    closeCard();
  }
});

function updateHotspots() {
  if (!labelsOn) return;
  const rect = stage.getBoundingClientRect();
  const camWorld = camera.position;
  for (const f of FEATURES) {
    const el = hotspotEls.get(f.id);
    if (!el) continue;
    const world = f.anchor.clone().add(bag.position);
    const toCam = camWorld.clone().sub(world).normalize();
    const facing = f.normal.dot(toCam);
    const p = world.clone().project(camera);
    const x = (p.x * 0.5 + 0.5) * rect.width;
    const y = (-p.y * 0.5 + 0.5) * rect.height;
    const visible = facing > 0.08 && p.z < 1 && x > 12 && x < rect.width - 12 && y > 54 && y < rect.height - 60;
    el.classList.toggle('is-hidden', !visible);
    if (visible) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Toolbar
 * ------------------------------------------------------------------ */
document.querySelector('[data-action="rotate"]').addEventListener('click', (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle('is-active', controls.autoRotate);
  e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
  camTween = null;
});
document.querySelector('[data-action="explode"]').addEventListener('click', () => toggleExplode());
document.querySelector('[data-action="labels"]').addEventListener('click', () => setLabels(!labelsOn));
document.querySelector('[data-action="dims"]').addEventListener('click', (e) => {
  dimGroup.visible = !dimGroup.visible;
  e.currentTarget.classList.toggle('is-active', dimGroup.visible);
  e.currentTarget.setAttribute('aria-pressed', String(dimGroup.visible));
});

/* ------------------------------------------------------------------ *
 *  Colorways
 * ------------------------------------------------------------------ */
const swatchButtons = [...document.querySelectorAll('[data-color]')];
let currentColor = 'graphite';
function chooseColor(id, { immediate = false } = {}) {
  const c = COLORWAYS[id];
  if (!c) return;
  currentColor = id;
  setColorway(bag, c);
  document.querySelector('#colorName').textContent = c.english;
  document.querySelector('#swatchLabel').textContent = `${c.name} / 橄榄背板`;
  swatchButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.color === id));
}
swatchButtons.forEach((b) => b.addEventListener('click', () => chooseColor(b.dataset.color)));
chooseColor('graphite', { immediate: true });

/* ------------------------------------------------------------------ *
 *  GLB export
 * ------------------------------------------------------------------ */
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function exportGLBBase64() {
  const exportRoot = buildBackpack(materials);
  exportRoot.position.set(0, 0, 0);
  exportRoot.updateMatrixWorld(true);

  // Convert stitch/teeth InstancedMeshes to ordinary merged meshes so the
  // GLB opens in viewers that do not support EXT_mesh_gpu_instancing.
  const instanced = [];
  exportRoot.traverse((o) => { if (o.isInstancedMesh) instanced.push(o); });
  const m = new THREE.Matrix4();
  for (const inst of instanced) {
    const parts = [];
    for (let i = 0; i < inst.count; i++) {
      inst.getMatrixAt(i, m);
      const g = inst.geometry.clone();
      g.applyMatrix4(m);
      parts.push(g);
    }
    const merged = parts.length ? mergeGeometries(parts, false) : null;
    for (const g of parts) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, inst.material);
    mesh.name = inst.name || 'Stitches';
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    inst.parent.add(mesh);
    inst.parent.remove(inst);
    inst.geometry.dispose();
  }

  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(exportRoot, {
    binary: true,
    onlyVisible: true,
    maxTextureSize: 2048,
  });
  exportRoot.traverse((o) => {
    if (o.isMesh && o.geometry) o.geometry.dispose();
  });
  return toBase64(result);
}

async function downloadGLB() {
  const btn = document.querySelector('[data-action="glb"]');
  const label = btn.querySelector('span:last-child');
  const old = label.textContent;
  label.textContent = '正在导出…';
  btn.disabled = true;
  try {
    const b64 = await exportGLBBase64();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i2GO_commuter_backpack_43x32x18.glb';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    label.textContent = '已导出';
    setTimeout(() => { label.textContent = old; }, 1800);
  } catch (err) {
    console.error(err);
    label.textContent = '导出失败';
    setTimeout(() => { label.textContent = old; }, 2200);
  } finally {
    btn.disabled = false;
  }
}
document.querySelector('[data-action="glb"]').addEventListener('click', downloadGLB);

/* ------------------------------------------------------------------ *
 *  Resize / render loop
 * ------------------------------------------------------------------ */
function resize() {
  const rect = stage.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
const ro = new ResizeObserver(resize);
ro.observe(stage);
resize();

function placeInitialCamera() {
  const d = fitDistance();
  camera.position.copy(viewPosition('iso', d));
  controls.target.copy(TARGET);
  controls.update();
  updateViewButtons('iso');
}
placeInitialCamera();

let paused = false;
function animate(now = performance.now()) {
  if (paused) return;
  requestAnimationFrame(animate);

  if (camTween) {
    const k = Math.min(1, Math.max(0, (now - camTween.start) / (camTween.dur * 1000)));
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
    if (k >= 1) camTween = null;
  }

  if (explodeAnim) {
    const k = Math.min(1, Math.max(0, (now - explodeAnim.start) / (explodeAnim.dur * 1000)));
    const e = 1 - Math.pow(1 - k, 3);
    explodeAmount = THREE.MathUtils.lerp(explodeAnim.from, explodeAnim.to, e);
    setExploded(bag, explodeAmount, false);
    if (k >= 1) {
      explodeAnim = null;
      explodeAmount = explodeTarget;
    }
  } else if (explodeAmount !== explodeTarget) {
    explodeAmount = explodeTarget;
    setExploded(bag, explodeAmount, false);
  }

  controls.update();
  updateHotspots();
  renderer.render(scene, camera);
}

/* ------------------------------------------------------------------ *
 *  URL state / public hooks
 * ------------------------------------------------------------------ */
if (params.get('dims') === '1') {
  dimGroup.visible = true;
  document.querySelector('[data-action="dims"]').classList.add('is-active');
  document.querySelector('[data-action="dims"]').setAttribute('aria-pressed', 'true');
}
if (params.get('labels') === '1') setLabels(true);
if (params.get('color')) chooseColor(params.get('color'));
if (params.get('view') && VIEWS[params.get('view')]) setView(params.get('view'), { immediate: true });
if (params.get('explode') === '1') {
  explodeTarget = 1;
  applyExplode(1, true);
  placeInitialCamera();
}

window.__bag = {
  ready: false,
  scene,
  camera,
  controls,
  bag,
  materials,
  setView: (name) => setView(name, { immediate: true }),
  setExploded: (v) => {
    explodeTarget = v ? 1 : 0;
    applyExplode(explodeTarget, true);
    placeInitialCamera();
  },
  setLabels,
  setDims: (v) => {
    dimGroup.visible = !!v;
    document.querySelector('[data-action="dims"]').classList.toggle('is-active', !!v);
  },
  setColor: chooseColor,
  exportGLBBase64,
  pause: () => { paused = true; },
  resume: () => {
    if (!paused) return;
    paused = false;
    animate();
  },
  getStats: () => ({ triangles, explodeAmount, currentView, currentColor }),
};

animate();

// first frames, then reveal
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    renderer.render(scene, camera);
    loading.classList.add('is-done');
    document.body.dataset.ready = 'true';
    window.__bag.ready = true;
  });
});
