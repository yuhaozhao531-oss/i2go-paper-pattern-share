import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createMaterials } from './materials.js';
import { puffyBox, addStitches, tube, loftAlong, roundedRectPoints, makeZipper, V } from './geometry.js';

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
controls.target.set(0, 6.2, 0);

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
const materials = createMaterials();
const printMat = new THREE.MeshPhysicalMaterial({
  map: printTexture(),
  roughness: 0.52,
  metalness: 0.01,
  clearcoat: 0.16,
  clearcoatRoughness: 0.5,
  envMapIntensity: 0.72,
});
const redMat = new THREE.MeshPhysicalMaterial({
  color: '#a53d31',
  roughness: 0.46,
  metalness: 0.01,
  clearcoat: 0.2,
  clearcoatRoughness: 0.45,
});
const blackMat = new THREE.MeshPhysicalMaterial({
  color: '#1e1f1d',
  roughness: 0.62,
  metalness: 0.02,
  clearcoat: 0.08,
});
const edge = materials.trim;
const metal = materials.metal;
const darkMetal = materials.darkMetal;
const stitch = materials.stitchDark;

function printTexture() {
  // Seamless 512 px all-over print: small motifs, not one giant billboard.
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f1ede2';
  g.fillRect(0, 0, 512, 512);

  const cell = 128;
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const x = gx * cell;
      const y = gy * cell;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const kind = (gx + gy) % 4;

      if (kind === 0) {
        g.fillStyle = '#181916';
        g.beginPath();
        g.arc(cx, cy, 38, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#a53d31';
        g.lineWidth = 9;
        g.beginPath();
        g.arc(cx, cy, 18, 0, Math.PI * 2);
        g.stroke();
      } else if (kind === 1) {
        g.save();
        g.translate(cx, cy);
        g.rotate(-0.42);
        for (let i = -2; i <= 2; i++) {
          g.fillStyle = i % 2 ? '#a53d31' : '#181916';
          g.fillRect(i * 22, -60, 8, 120);
        }
        g.restore();
      } else if (kind === 2) {
        g.fillStyle = '#181916';
        g.font = '800 22px Arial, Helvetica, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('i2GO', cx, cy - 4);
        g.fillStyle = '#a53d31';
        g.beginPath();
        g.arc(cx, cy + 30, 7, 0, Math.PI * 2);
        g.fill();
      } else {
        g.strokeStyle = '#181916';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(cx - 24, cy - 24); g.lineTo(cx + 24, cy + 24);
        g.moveTo(cx + 24, cy - 24); g.lineTo(cx - 24, cy + 24);
        g.stroke();
        g.fillStyle = '#a53d31';
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.arc(x + 20 + i * 26, y + 102, 3.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }

  // fine halftone confetti, kept inside the tile
  for (let i = 0; i < 80; i++) {
    const px = (i * 71 + 13) % 512;
    const py = (i * 137 + 29) % 512;
    g.fillStyle = i % 5 === 0 ? '#a53d31' : 'rgba(24,25,22,.55)';
    g.beginPath();
    g.arc(px, py, 1.6 + (i % 3), 0, Math.PI * 2);
    g.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.55, 1.55);
  return t;
}

const root = new THREE.Group();
root.name = 'VLOTHO_Vanity_Pencil_POC';
scene.add(root);

const W = 23.5;
const D = 7.0;
const BODY_H = 7.2;
const LID_H = 4.3;
const H = BODY_H + LID_H;
const ZIP_Y = BODY_H - 0.05;

// Body + lid, both printed.
const body = add(root, new THREE.Mesh(puffyBox(W, BODY_H, D, 1.95, 20, 0.55, 1), printMat));
body.position.y = BODY_H / 2;
const lid = add(root, new THREE.Mesh(puffyBox(W + 0.12, LID_H, D + 0.12, 1.95, 18, 0.5, 1), printMat));
lid.position.y = BODY_H + LID_H / 2;

// Soft-goods convexity: bulge the front/back faces and pinch the ends so the
// printed PU reads as a sewn case, not a hard box.
function softenCase(mesh, w, h, d, amount = 0.34) {
  const pos = mesh.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = x / (w / 2);
    const ny = y / (h / 2);
    const nz = z / (d / 2);
    const bulge = amount * Math.max(0, 1 - nx * nx) * Math.max(0, 1 - ny * ny) * Math.pow(Math.abs(nz), 1.6);
    pos.setZ(i, z + Math.sign(z) * bulge);
    pos.setX(i, x * (1 - 0.012 * (1 - ny * ny)));
  }
  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}
softenCase(body, W, BODY_H, D);
softenCase(lid, W + 0.12, LID_H, D + 0.12, 0.28);

const bottom = add(root, new THREE.Mesh(puffyBox(W + 0.12, 0.75, D + 0.12, 0.5, 8, 0.02, 1), blackMat));
bottom.position.y = 0.4;

function ring(w, d, y, n = 140) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x = (w / 2) * Math.sign(ca) * Math.pow(Math.abs(ca), 0.56);
    const z = (d / 2) * Math.sign(sa) * Math.pow(Math.abs(sa), 0.56);
    pts.push(V(x, y, z));
  }
  return pts;
}
// Red piping: bottom and lid crown.
add(root, tube(ring(W + 0.08, D + 0.08, 0.75, 160), 0.095, redMat, { closed: true, segments: 240 }));
add(root, tube(ring(W + 0.2, D + 0.2, H - 0.28, 160), 0.095, redMat, { closed: true, segments: 240 }));

// Wrap-around zipper on three sides; hinge at the back.
function line(a, b, n = 26) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(V(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t));
  }
  return pts;
}
function zip(points, normal, sliders = []) {
  return makeZipper(points, normal, materials, {
    width: 0.95,
    sliders,
    teeth: true,
    toothGap: 0.4,
    pullerLength: 1.8,
    tapeMaterial: blackMat,
  });
}
root.add(zip(line([-9.0, ZIP_Y, D / 2 + 0.06], [9.0, ZIP_Y, D / 2 + 0.06]), V(0, 0, 1), [0.66]));
root.add(zip(line([W / 2 + 0.06, ZIP_Y, 3.45], [W / 2 + 0.06, ZIP_Y, -3.45]), V(1, 0, 0)));
root.add(zip(line([-W / 2 - 0.06, ZIP_Y, -3.45], [-W / 2 - 0.06, ZIP_Y, 3.45]), V(-1, 0, 0)));

// Corner boots hide the three zip ends.
for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
    const corner = add(root, new THREE.Mesh(new RoundedBoxGeometry(0.55, 1.35, 0.55, 2, 0.2), blackMat));
    corner.position.set(sx * (W / 2 + 0.01), ZIP_Y, sz * (D / 2 + 0.01));
  }
}

// Back hinge / fabric bridge.
const hinge = add(root, new THREE.Mesh(new RoundedBoxGeometry(12.0, 1.35, 0.28, 3, 0.15), blackMat));
hinge.position.set(0, ZIP_Y, -D / 2 - 0.02);
const hingeStrip = add(root, new THREE.Mesh(new RoundedBoxGeometry(11.2, 0.42, 0.34, 2, 0.1), redMat));
hingeStrip.position.set(0, ZIP_Y + 0.38, -D / 2 - 0.05);
for (const sx of [-4.5, 4.5]) {
  const rivet = add(root, new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 14), metal));
  rivet.rotation.x = Math.PI / 2;
  rivet.position.set(sx, ZIP_Y + 0.38, -D / 2 - 0.16);
}

// Big handle loop at one end (the reference pencil case has an end handle).
const handlePts = [
  V(-11.7, 4.9, -2.2),
  V(-13.9, 5.45, -2.2),
  V(-15.2, 7.5, -2.2),
  V(-14.15, 9.8, -2.2),
  V(-11.8, 10.55, -2.2),
];
add(root, tube(handlePts, 0.48, blackMat, { segments: 56, radial: 12 }));
for (const p of [handlePts[0], handlePts[4]]) {
  const patch = add(root, new THREE.Mesh(new RoundedBoxGeometry(3.8, 2.0, 0.35, 3, 0.3), blackMat));
  patch.position.copy(p).add(V(0.55, 0, 0));
}

// Red pull tab next to the slider.
const pullTab = add(root, new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.55, 0.12, 2, 0.12), redMat));
pullTab.position.set(4.35, ZIP_Y - 1.15, D / 2 + 0.34);

// Stitch lines on the lid seam and bottom.
addStitches(root, line([-9.2, ZIP_Y + 0.14, D / 2 + 0.08], [9.2, ZIP_Y + 0.14, D / 2 + 0.08], 40), {
  normal: V(0, 0, 1), gap: 0.62, dash: 0.26, offset: 0.012, material: stitch,
});
addStitches(root, line([-9.2, ZIP_Y - 0.78, D / 2 + 0.08], [9.2, ZIP_Y - 0.78, D / 2 + 0.08], 40), {
  normal: V(0, 0, 1), gap: 0.62, dash: 0.26, offset: 0.012, material: stitch,
});
for (const side of [-1, 1]) {
  addStitches(root, line([side * (W / 2 + 0.08), ZIP_Y + 0.14, -3.25], [side * (W / 2 + 0.08), ZIP_Y + 0.14, 3.25], 30), {
    normal: V(side, 0, 0), gap: 0.62, dash: 0.26, offset: 0.012, material: stitch,
  });
}
addStitches(root, ring(W + 0.04, D + 0.04, 0.72, 160), {
  normal: V(0, 1, 0), closed: true, gap: 0.62, dash: 0.28, offset: 0.012, material: stitch,
});

// Red i2GO side label.
function labelTexture(text) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 200;
  const g = c.getContext('2d');
  g.fillStyle = '#a53d31';
  g.fillRect(0, 0, 640, 200);
  g.fillStyle = '#f6f1e7';
  g.font = '900 98px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 320, 108);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
const brand = new THREE.Mesh(
  new THREE.PlaneGeometry(4.4, 1.38),
  new THREE.MeshStandardMaterial({ map: labelTexture('i2GO'), roughness: 0.6 }),
);
brand.position.set(7.0, 9.05, D / 2 + 0.075);
root.add(brand);

// Small POC stamp on the bottom corner.
const stamp = new THREE.Mesh(
  new THREE.PlaneGeometry(3.1, 0.72),
  new THREE.MeshStandardMaterial({ map: labelTexture('POC 02'), transparent: true, roughness: 0.8 }),
);
stamp.position.set(-7.5, 1.5, D / 2 + 0.075);
stamp.scale.setScalar(0.8);
root.add(stamp);

/* ------------------------------------------------------------------ */
/*  Camera / views                                                     */
/* ------------------------------------------------------------------ */
const DIRECTIONS = {
  iso: [0.55, 0.24, 0.8],
  front: [0, 0.14, 1],
  side: [1, 0.16, 0.03],
  back: [0.08, 0.12, -1],
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
  ) * 1.38;
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
