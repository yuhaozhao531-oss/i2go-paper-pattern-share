import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createMaterials, COLORWAYS } from './materials.js';
import { buildBackpack, setColorway } from './backpack.js';
import { puffyBox, addStitches, ribbonGeometry, V } from './geometry.js';
import {
  PRESETS,
  FEATURE_META,
  specFromPreset,
  parseBrief,
  buildBOM,
  bomCSV,
  specSummary,
} from './spec.js';
import { buildPatternSVG, buildPattern1to1SVG, buildPatternDXF } from './pattern.js';
import { buildTechPackSVG } from './techpack.js';
import { buildInstructionSVG } from './instruction.js';

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let spec = specFromPreset('commuter');
let bom = buildBOM(spec);
let reference = null;
let activeTab = 'model';
let viewName = 'iso';
let autoRotate = false;
let techPage = 'instruction';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------------ */
/*  3D scene                                                           */
/* ------------------------------------------------------------------ */
const canvas = $('#scene');
const workBody = $('.work-body');
const loading = $('#loading');
const errorPanel = $('#webglError');

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
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearAlpha(0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 500);
camera.position.set(52, 38, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 54;
controls.maxDistance = 220;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = 1.55;
controls.autoRotateSpeed = 0.55;
controls.target.set(0, 23, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.03).texture;
scene.environmentIntensity = 0.5;

scene.add(new THREE.HemisphereLight('#fff8ec', '#cfc6b6', 0.4));

const key = new THREE.DirectionalLight('#fff5e6', 2.0);
key.position.set(28, 62, 36);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -42;
key.shadow.camera.right = 42;
key.shadow.camera.top = 58;
key.shadow.camera.bottom = -14;
key.shadow.camera.near = 1;
key.shadow.camera.far = 170;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.055;
key.shadow.radius = 5;
scene.add(key);
key.target.position.set(0, 22, 0);
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
  new THREE.PlaneGeometry(190, 190),
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
contact.position.set(0, 0.045, 1);
contact.renderOrder = 2;
scene.add(contact);

/* ------------------------------------------------------------------ */
/*  Bag + configurable side pockets                                    */
/* ------------------------------------------------------------------ */
const materials = createMaterials();
const bag = buildBackpack(materials);
scene.add(bag);
bag.traverse((o) => {
  if (!o.isMesh) return;
  o.castShadow = o.castShadow !== false;
  o.receiveShadow = true;
  if (o.material && o.material.transparent) o.castShadow = false;
  if (o.isInstancedMesh) o.castShadow = false;
});

function buildSidePockets() {
  const group = new THREE.Group();
  group.name = 'Side_Bottle_Pockets';
  for (const sign of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(sign * 15.6, -9.2, 2.2);
    g.rotation.y = (sign * Math.PI) / 2;
    const pouch = new THREE.Mesh(
      puffyBox(6.0, 12.0, 1.4, 2.0, 10, 0.5, 1),
      materials.sideMesh,
    );
    pouch.position.z = 0.2;
    pouch.castShadow = true;
    pouch.receiveShadow = true;
    g.add(pouch);
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(6.05, 0.65, 0.45),
      materials.webbingBlack,
    );
    band.position.set(0, 5.65, 0.78);
    g.add(band);
    const hem = new THREE.Mesh(
      new THREE.BoxGeometry(5.95, 0.5, 0.32),
      materials.oliveDark,
    );
    hem.position.set(0, -5.85, 0.74);
    g.add(hem);
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 2.2, 0.08),
      materials.red,
    );
    tab.position.set(1.2, 3.3, 0.93);
    g.add(tab);
    addStitches(g, [
      V(-2.4, 6.0, 0.8), V(0, 6.0, 0.82), V(2.4, 6.0, 0.8),
    ], { normal: V(0, 0, 1), gap: 0.55, dash: 0.24, offset: 0.01, material: materials.stitchDark });
    group.add(g);
  }
  group.visible = false;
  return group;
}
const sidePockets = buildSidePockets();
bag.add(sidePockets);

function buildTrailExtras() {
  const group = new THREE.Group();
  group.name = 'Trail_Details';
  const bungeeGroup = new THREE.Group();
  bungeeGroup.name = 'Trail_Bungee';
  group.add(bungeeGroup);

  const pts = [
    V(-8.8, -8.2, 9.18),
    V(-5.8, -10.2, 9.28),
    V(-2.8, -8.2, 9.32),
    V(0, -10.3, 9.32),
    V(2.8, -8.2, 9.32),
    V(5.8, -10.2, 9.28),
    V(8.8, -8.2, 9.18),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const bungee = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, 0.11, 6, false),
    materials.red,
  );
  bungee.castShadow = true;
  bungeeGroup.add(bungee);
  for (const sign of [-1, 1]) {
    const anchor = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.75, 0.24),
      materials.webbingBlack,
    );
    anchor.position.set(sign * 8.8, -8.2, 9.12);
    bungeeGroup.add(anchor);
  }
  const toggle = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.35, 0.36),
    materials.plastic,
  );
  toggle.position.set(0, -10.3, 9.46);
  bungeeGroup.add(toggle);
  group.userData.bungeeGroup = bungeeGroup;

  for (const sign of [-1, 1]) {
    const strapPts = [
      V(sign * 15.64, 4.6, -4.8),
      V(sign * 15.66, 4.6, -1.4),
      V(sign * 15.66, 4.6, 1.4),
      V(sign * 15.64, 4.6, 4.8),
    ];
    const band = new THREE.Mesh(
      ribbonGeometry(strapPts, 2.2, V(sign, 0, 0), { offset: 0 }),
      materials.webbingGrey,
    );
    group.add(band);
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 2.6, 2.0),
      materials.plastic,
    );
    buckle.position.set(sign * 15.72, 4.6, 0.4);
    group.add(buckle);
  }

  group.visible = false;
  return group;
}
const trailExtras = buildTrailExtras();
bag.add(trailExtras);

let triangles = 0;
function countTriangles(root) {
  let t = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (g.index) t += g.index.count / 3;
    else if (g.attributes.position) t += g.attributes.position.count / 3;
  });
  return t;
}
triangles = countTriangles(bag);
$('#triStat').textContent = `${(triangles / 1000).toFixed(1)}K TRIS`;

/* ------------------------------------------------------------------ */
/*  Apply spec                                                         */
/* ------------------------------------------------------------------ */
function applyToBag(root, specValue, sideGroup, trailGroup, { position = true } = {}) {
  const sx = specValue.w / 32;
  const sy = specValue.h / 43;
  const sz = specValue.d / 18;
  root.scale.set(sx, sy, sz);
  if (position) root.position.y = 21.3 * sy + 0.12;
  else root.position.set(0, 0, 0);
  const p = root.userData.parts;
  p.frontPanel.visible = !!specValue.frontPocket;
  p.organizer.visible = !!specValue.frontPocket;
  p.frontCavity.visible = !!specValue.frontPocket;
  p.laptopAssembly.visible = !!specValue.laptop;
  p.backCavity.visible = !!specValue.laptop;
  p.luggage.visible = !!specValue.luggage;
  p.sternum.visible = !!specValue.sternum;
  p.sideHandle.visible = !!specValue.sideHandle;
  p.sideZip.visible = !specValue.sidePockets;
  p.sideRed.visible = !specValue.sidePockets;
  if (sideGroup) sideGroup.visible = !!specValue.sidePockets;
  if (trailGroup) {
    trailGroup.visible = !!specValue.sidePockets;
    if (trailGroup.userData.bungeeGroup) {
      trailGroup.userData.bungeeGroup.position.z = specValue.frontPocket ? 0 : -1.55;
    }
  }
  setColorway(root, COLORWAYS[specValue.color] || COLORWAYS.graphite);
}

function applySpec({ frame = true } = {}) {
  applyToBag(bag, spec, sidePockets, trailExtras);
  contact.scale.set((spec.w / 32) * 1.02, (spec.d / 18) * 1.02, 1);
  bag.updateMatrixWorld(true);
  if (frame) frameBag(viewName);
  $('#workCode').textContent = spec.code;
  $('#workName').textContent = spec.name;
  $('#workMeta').textContent = specSummary(spec);
  $('#colorName').textContent = COLORWAYS[spec.color]?.english || 'GRAPHITE';
  $('#materialLine').textContent = `${spec.material} · ${spec.lining}`;
  $('#bomCode').textContent = spec.code;
  renderSpecChips();
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */
const DIRECTIONS = {
  iso: [0.5, 0.16, 0.85],
  front: [0, 0.06, 1],
  side: [1, 0.07, 0.02],
  back: [0, 0.08, -1],
};

function frameBag(name = 'iso') {
  bag.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(bag);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.5));
  const dist = Math.max(
    size.y / 2 / Math.tan(vFov / 2),
    size.x / 2 / Math.tan(hFov / 2),
    size.z / 2 / Math.tan(vFov / 2),
  ) * 1.42;
  const dir = new THREE.Vector3(...(DIRECTIONS[name] || DIRECTIONS.iso)).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.near = 0.5;
  camera.far = 600;
  camera.updateProjectionMatrix();
  controls.update();
  viewName = name || 'iso';
  $$('.view').forEach((b) => b.classList.toggle('is-active', b.dataset.view === viewName));
}

function setView(name) {
  frameBag(name);
}

function resize() {
  const rect = workBody.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ro = new ResizeObserver(() => {
  if (activeTab === 'model') resize();
});
ro.observe(workBody);

$$('.view').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('#autoRotate').addEventListener('click', (e) => {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;
  e.currentTarget.classList.toggle('is-active', autoRotate);
  e.currentTarget.setAttribute('aria-pressed', String(autoRotate));
});
controls.addEventListener('start', () => {
  renderer.domElement.style.cursor = 'grabbing';
  $$('.view').forEach((b) => b.classList.remove('is-active'));
});
controls.addEventListener('end', () => {
  renderer.domElement.style.cursor = 'grab';
});
canvas.addEventListener('dblclick', () => setView('iso'));

/* ------------------------------------------------------------------ */
/*  UI rendering                                                       */
/* ------------------------------------------------------------------ */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderPresets() {
  const host = $('#presetList');
  host.innerHTML = '';
  for (const key of Object.keys(PRESETS)) {
    const p = PRESETS[key];
    const b = document.createElement('button');
    b.className = 'preset';
    b.dataset.preset = key;
    b.innerHTML = `<span class="preset-code">${p.code}</span>
      <span class="preset-copy"><b>${p.name}</b><small>${p.style} · ${p.frontPocket ? '前袋' : '光面'} · ${p.laptop ? '电脑仓' : '无电脑仓'}</small></span>
      <span class="preset-dims">${p.w}×${p.h}×${p.d}</span>`;
    b.addEventListener('click', () => {
      spec = specFromPreset(key);
      bom = buildBOM(spec);
      applySpec();
      syncControls();
      renderPattern();
      renderBOM();
      setChips([`已套用 ${p.name} 模板`, `${p.w}×${p.h}×${p.d}`]);
      setNotes([]);
      toast(`已生成 ${p.code} · ${p.name}`);
    });
    host.appendChild(b);
  }
}

function renderToggles() {
  const host = $('#toggleList');
  host.innerHTML = '';
  for (const f of FEATURE_META) {
    const label = document.createElement('label');
    label.className = 'toggle';
    label.innerHTML = `<span class="toggle-copy"><b>${f.label}</b><small>${f.note}</small></span>
      <input type="checkbox" data-feature="${f.key}" ${spec[f.key] ? 'checked' : ''} />
      <span class="switch"></span>`;
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      spec[f.key] = input.checked;
      spec.key = 'custom';
      spec.code = `CU-${String(spec.w).padStart(2, '0')}${String(spec.h).padStart(2, '0')}`;
      bom = buildBOM(spec);
      applySpec({ frame: false });
      renderPattern();
      renderBOM();
      $$('.preset').forEach((p) => p.classList.remove('is-active'));
      setChips([`${f.label} ${input.checked ? '已加入' : '已移除'}`, `${spec.w}×${spec.h}×${spec.d}`]);
      setNotes([]);
    });
    host.appendChild(label);
  }
}

function renderSwatches() {
  const host = $('#swatchRow');
  host.innerHTML = '';
  for (const [key, c] of Object.entries(COLORWAYS)) {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.dataset.color = key;
    b.style.setProperty('--sw', c.swatch);
    b.title = c.name;
    b.setAttribute('aria-label', c.name);
    b.addEventListener('click', () => {
      spec.color = key;
      setColorway(bag, c);
      $('#colorName').textContent = c.english;
      renderSwatches();
      renderPattern();
      renderBOM();
      renderSpecChips();
    });
    if (spec.color === key) b.classList.add('is-active');
    host.appendChild(b);
  }
}

function setChips(items) {
  const host = $('#parseChips');
  host.innerHTML = '';
  for (const item of items.filter(Boolean)) {
    const s = document.createElement('span');
    s.textContent = item;
    host.appendChild(s);
  }
}
function setNotes(notes) {
  const host = $('#parseNotes');
  host.innerHTML = '';
  for (const note of notes.filter(Boolean)) {
    const p = document.createElement('p');
    p.textContent = note;
    host.appendChild(p);
  }
}

function renderSpecChips() {
  const host = $('#specChips');
  const items = [
    `${spec.w} × ${spec.h} × ${spec.d} cm`,
    spec.frontPocket ? '前袋' : '光面',
    spec.laptop ? '电脑仓' : '无电脑仓',
    spec.sidePockets ? '侧袋' : null,
    spec.sternum ? '胸扣' : null,
    COLORWAYS[spec.color]?.name,
  ].filter(Boolean);
  host.innerHTML = items.map((x) => `<span>${esc(x)}</span>`).join('');
}

function syncControls() {
  $('#dimH').value = spec.h;
  $('#dimW').value = spec.w;
  $('#dimD').value = spec.d;
  $('#workCode').textContent = spec.code;
  $('#workName').textContent = spec.name;
  $('#workMeta').textContent = specSummary(spec);
  $('#colorName').textContent = COLORWAYS[spec.color]?.english || 'GRAPHITE';
  $('#materialLine').textContent = `${spec.material} · ${spec.lining}`;
  $('#bomCode').textContent = spec.code;
  $$('.preset').forEach((p) => p.classList.toggle('is-active', p.dataset.preset === spec.key));
  $$('#toggleList input').forEach((i) => { i.checked = !!spec[i.dataset.feature]; });
  renderSwatches();
  renderSpecChips();
}

/* ------------------------------------------------------------------ */
/*  Parsing / dimensions                                               */
/* ------------------------------------------------------------------ */
function applyBrief(text) {
  const parsed = parseBrief(text, PRESETS.commuter);
  spec = parsed.spec;
  bom = buildBOM(spec);
  applySpec();
  syncControls();
  renderPattern();
  renderBOM();
  setChips(parsed.matched.length ? parsed.matched : ['未识别到明确结构，已套用通勤模板']);
  setNotes(parsed.notes);
  toast(`已生成 ${spec.code} · ${spec.name}`);
}

$('#buildBrief').addEventListener('click', () => applyBrief($('#briefInput').value));
$('#briefInput').addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') applyBrief(e.currentTarget.value);
});
$$('.example-row button').forEach((b) => {
  b.addEventListener('click', () => {
    $('#briefInput').value = b.dataset.example;
    applyBrief(b.dataset.example);
  });
});

let dimTimer = null;
for (const id of ['dimH', 'dimW', 'dimD']) {
  $('#' + id).addEventListener('input', () => {
    clearTimeout(dimTimer);
    dimTimer = setTimeout(() => {
      const h = clamp(Number($('#dimH').value) || 43, 30, 60);
      const w = clamp(Number($('#dimW').value) || 32, 22, 40);
      const d = clamp(Number($('#dimD').value) || 18, 10, 28);
      if (h === spec.h && w === spec.w && d === spec.d) return;
      spec.h = h;
      spec.w = w;
      spec.d = d;
      spec.key = 'custom';
      spec.code = `CU-${String(w).padStart(2, '0')}${String(h).padStart(2, '0')}`;
      spec.name = `${spec.style || '定制'}双肩包`;
      bom = buildBOM(spec);
      applySpec();
      syncControls();
      renderPattern();
      renderBOM();
      setChips([`尺寸 ${w}×${h}×${d}`, '3D 按比例预览', '纸格按尺寸重算']);
      setNotes(['五金为比例示意，需按标准件复核；纸格需版师复核。']);
    }, 220);
  });
}

/* ------------------------------------------------------------------ */
/*  Pattern                                                            */
/* ------------------------------------------------------------------ */
const patternHost = $('#patternHost');
const techHost = $('#techHost');
const seamToggle = $('#seamToggle');

const INSTRUCTION_FILES = {
  hero: './renders/instr-hero.png',
  zip: './renders/instr-zip.png',
  back: './renders/instr-back.png',
  handle: './renders/instr-handle.png',
  fabric: './renders/instr-fabric.png',
};
const instructionImages = {};

async function toDataURL(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image ${url}`);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(blob);
  });
}

const imagesReady = (async () => {
  await Promise.all(Object.entries(INSTRUCTION_FILES).map(async ([key, url]) => {
    try {
      instructionImages[key] = await toDataURL(url);
    } catch {
      instructionImages[key] = '';
    }
  }));
  if (activeTab === 'tech') renderTech();
})();

function renderTech() {
  if (!techHost) return;
  techHost.innerHTML = techPage === 'technical'
    ? buildTechPackSVG(spec, bom, { page: '2/2' })
    : buildInstructionSVG(spec, bom, instructionImages);
}

function renderPattern() {
  if (!patternHost) return;
  patternHost.innerHTML = buildPatternSVG(spec, bom, {
    showSeam: seamToggle.checked,
    reference,
  });
  const rf = $('#referenceFloat');
  if (reference) {
    rf.hidden = false;
    $('#referenceFloatImg').src = reference;
  } else {
    rf.hidden = true;
  }
  renderTech();
}

$$('.tech-page').forEach((b) => {
  b.addEventListener('click', () => {
    techPage = b.dataset.techpage;
    $$('.tech-page').forEach((x) => x.classList.toggle('is-active', x === b));
    renderTech();
  });
});

seamToggle.addEventListener('change', renderPattern);

/* ------------------------------------------------------------------ */
/*  BOM                                                                */
/* ------------------------------------------------------------------ */
function renderBOM() {
  $('#bomStats').innerHTML = `
    <div class="bom-stat"><b>${bom.summary.fabric}</b><span>SHELL m²</span></div>
    <div class="bom-stat"><b>${bom.summary.lining}</b><span>LINING m²</span></div>
    <div class="bom-stat"><b>${bom.summary.zippers}</b><span>ZIPPERS</span></div>
    <div class="bom-stat"><b>${bom.summary.hardware}</b><span>HARDWARE</span></div>`;
  const host = $('#bomHost');
  host.innerHTML = `<table class="bom-table">
    <thead><tr><th>#</th><th>物料</th><th>规格 / 说明</th><th>用量</th><th>备注</th></tr></thead>
    <tbody>${bom.rows.map((r, i) => `<tr>
      <td class="num">${String(i + 1).padStart(2, '0')}</td>
      <td><span class="group-pill">${esc(r.group)}</span><br>${esc(r.item)}</td>
      <td>${esc(r.spec)}</td>
      <td class="num">${esc(r.qty)} ${esc(r.unit)}</td>
      <td>${esc(r.note)}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */
function setTab(tab) {
  if (!['model', 'pattern', 'tech', 'bom'].includes(tab)) return;
  activeTab = tab;
  $$('.mode').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', String(on));
  });
  $$('.panel').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  if (tab === 'pattern') renderPattern();
  if (tab === 'tech') renderTech();
  if (tab === 'bom') renderBOM();
  if (tab === 'model') {
    requestAnimationFrame(() => {
      resize();
      renderer.render(scene, camera);
    });
  }
}
$$('.mode').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

/* ------------------------------------------------------------------ */
/*  Downloads                                                          */
/* ------------------------------------------------------------------ */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

function downloadPatternSVG() {
  const svg = buildPattern1to1SVG(spec, bom);
  if (!svg) return;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${spec.code}_pattern_1to1.svg`);
  toast('已导出 1:1 纸格 SVG');
}

function downloadPatternPNG() {
  const svg = patternHost.querySelector('svg');
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1120;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f3f0e7';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => {
      if (b) downloadBlob(b, `${spec.code}_pattern.png`);
      toast('已导出结构展开图 PNG');
    }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('PNG 导出失败'); };
  img.src = url;
}

function downloadPatternDXF() {
  const dxf = buildPatternDXF(spec, bom);
  downloadBlob(new Blob([dxf], { type: 'application/dxf' }), `${spec.code}_pattern.dxf`);
}

function downloadTechSVG() {
  const svg = techHost.querySelector('svg');
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${spec.code}_techpack.svg`);
  toast('已导出工业工艺单 SVG');
}

function downloadTechPNG() {
  const svg = techHost.querySelector('svg');
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 2000;
    c.height = 1414;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f7f4eb';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => {
      if (b) downloadBlob(b, `${spec.code}_techpack.png`);
      toast('已导出工业工艺单 PNG');
    }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('PNG 导出失败'); };
  img.src = url;
}

$('#downloadTechSvg').addEventListener('click', downloadTechSVG);
$('#downloadTechPng').addEventListener('click', downloadTechPNG);
$('#downloadTechPdf').addEventListener('click', () => {
  toast('在打印对话框选择“另存为 PDF”，纸张 A3 横向');
  setTimeout(() => window.print(), 350);
});

function downloadBOM() {
  const csv = bomCSV(bom, spec);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${spec.code}_BOM.csv`);
  toast('已导出 BOM CSV');
}

$('#downloadPattern').addEventListener('click', downloadPatternSVG);
$('#downloadPatternDxf').addEventListener('click', downloadPatternDXF);
$('#downloadPatternPng').addEventListener('click', downloadPatternPNG);
$('#downloadBom').addEventListener('click', downloadBOM);
$('#exportPattern').addEventListener('click', () => {
  setTab('pattern');
  requestAnimationFrame(downloadPatternSVG);
});

/* ------------------------------------------------------------------ */
/*  GLB export                                                         */
/* ------------------------------------------------------------------ */
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function pruneHidden(root) {
  for (const child of [...root.children]) {
    if (!child.visible) {
      child.removeFromParent();
    } else {
      pruneHidden(child);
    }
  }
}

async function exportGLBBase64() {
  const exportRoot = buildBackpack(materials);
  const sp = buildSidePockets();
  exportRoot.add(sp);
  const trail = buildTrailExtras();
  exportRoot.add(trail);
  applyToBag(exportRoot, spec, sp, trail, { position: false });
  pruneHidden(exportRoot);
  exportRoot.updateMatrixWorld(true);

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
  const btn = $('#exportGlb');
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = '导出中…';
  try {
    const b64 = await exportGLBBase64();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    downloadBlob(new Blob([bytes], { type: 'model/gltf-binary' }), `${spec.code}_${spec.w}x${spec.h}x${spec.d}.glb`);
    toast('GLB 已导出');
  } catch (err) {
    console.error(err);
    toast('GLB 导出失败');
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}
$('#exportGlb').addEventListener('click', downloadGLB);

/* ------------------------------------------------------------------ */
/*  Reference upload                                                   */
/* ------------------------------------------------------------------ */
let refName = '';
$('#refInput').addEventListener('change', (e) => {
  const file = e.currentTarget.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    reference = String(reader.result);
    refName = file.name;
    $('#refPreview').hidden = false;
    $('#refImg').src = reference;
    $('#refLabel').textContent = file.name;
    renderPattern();
    toast('参考图已加入，仅作对照');
  };
  reader.readAsDataURL(file);
});
$('#refRemove').addEventListener('click', () => {
  reference = null;
  refName = '';
  $('#refInput').value = '';
  $('#refPreview').hidden = true;
  $('#refLabel').textContent = '上传参考照片或纸格截图';
  renderPattern();
});

/* ------------------------------------------------------------------ */
/*  Toast / loading / loop                                             */
/* ------------------------------------------------------------------ */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 1900);
}

let paused = false;
function animate() {
  if (paused) return;
  requestAnimationFrame(animate);
  if (activeTab !== 'model') return;
  controls.update();
  renderer.render(scene, camera);
}

function init() {
  renderPresets();
  renderToggles();
  renderSwatches();
  bom = buildBOM(spec);
  applySpec();
  syncControls();
  renderPattern();
  renderBOM();
  setChips(['43 × 32 × 18', '通勤模板', '前袋', '电脑仓', '石墨灰']);
  setNotes([]);

  // URL state for quick demos
  const params = new URLSearchParams(location.search);
  const preset = params.get('preset');
  if (preset && PRESETS[preset]) {
    spec = specFromPreset(preset);
    bom = buildBOM(spec);
    applySpec();
    syncControls();
    renderPattern();
    renderBOM();
  }
  if (params.get('brief')) {
    $('#briefInput').value = params.get('brief');
    applyBrief(params.get('brief'));
  }
  if (params.get('tab')) setTab(params.get('tab'));

  resize();
  frameBag('iso');
  animate();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderer.render(scene, camera);
      loading.classList.add('is-done');
      window.__studio.ready = true;
    });
  });
}

window.__studio = {
  ready: false,
  imagesReady,
  setPreset: (key) => {
    if (!PRESETS[key]) return;
    spec = specFromPreset(key);
    bom = buildBOM(spec);
    applySpec();
    syncControls();
    renderPattern();
    renderBOM();
  },
  applyBrief,
  setTab,
  setSpec: (partial) => {
    spec = { ...spec, ...partial };
    spec.key = 'custom';
    spec.code = `CU-${String(spec.w).padStart(2, '0')}${String(spec.h).padStart(2, '0')}`;
    bom = buildBOM(spec);
    applySpec();
    syncControls();
    renderPattern();
    renderBOM();
  },
  setView,
  getSpec: () => JSON.parse(JSON.stringify(spec)),
  pause: () => { paused = true; },
  resume: () => { if (paused) { paused = false; animate(); } },
  exportGLBBase64,
  scene,
  camera,
  bag,
};

init();
