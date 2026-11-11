import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Procedural material library for the i2GO commuter backpack.
 *  All textures are generated in the browser, so the viewer is fully
 *  self-contained: no external HDRIs, no image downloads.
 * ------------------------------------------------------------------ */

function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function texture(c, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

/* A neutral 600D-ish plain weave. Kept light so material.color can tint it. */
function weaveMap(size = 512, { contrast = 1 } = {}) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const r = rng(7);
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(0, 0, size, size);

  const step = 4;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const over = ((x / step + y / step) & 1) === 0;
      const n = 0.82 + r() * 0.25;
      const v = Math.round((over ? 226 : 202) * n);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, step, step);
      ctx.fillStyle = `rgba(255,255,255,${0.10 * contrast})`;
      ctx.fillRect(x, y, step, 1);
      ctx.fillStyle = `rgba(0,0,0,${0.07 * contrast})`;
      ctx.fillRect(x, y + step - 1, step, 1);
    }
  }

  // fine fibre flecks
  for (let i = 0; i < 7000; i++) {
    const a = 0.04 + r() * 0.09;
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(r() * size, r() * size, 1, 1);
  }
  return c;
}

function weaveBump(size = 512) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  const step = 4;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const over = ((x / step + y / step) & 1) === 0;
      const v = over ? 162 : 118;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  return c;
}

/* Diamond ripstop / air-mesh. */
function meshMap(size = 256, { diamond = true } = {}) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9c9c9';
  ctx.fillRect(0, 0, size, size);

  if (diamond) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4a4a4a';
    const gap = 16;
    for (let i = -size; i < size * 2; i += gap) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#2e2e2e';
    for (let y = 0; y <= size; y += gap) {
      for (let x = 0; x <= size; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const gap = 8;
    for (let x = 0; x < size; x += gap) {
      ctx.fillStyle = x % (gap * 2) === 0 ? '#8c8c8c' : '#bcbcbc';
      ctx.fillRect(x, 0, 3, size);
    }
    for (let y = 0; y < size; y += gap) {
      ctx.fillStyle = y % (gap * 2) === 0 ? 'rgba(40,40,40,.35)' : 'rgba(255,255,255,.35)';
      ctx.fillRect(0, y, size, 2);
    }
  }
  return c;
}

function meshBump(size = 256) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8b8b8';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 3;
  const gap = 16;
  for (let i = -size; i < size * 2; i += gap) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
  return c;
}

/* Heavy nylon webbing with a fine horizontal rib. */
function webbingMap(size = 256) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const r = rng(21);
  ctx.fillStyle = '#cfcfcf';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.22)';
    ctx.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.08})`;
    ctx.fillRect(r() * size, r() * size, 1, 1);
  }
  return c;
}

function webbingBump(size = 256) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? '#c8c8c8' : '#5a5a5a';
    ctx.fillRect(0, y, size, 2);
  }
  return c;
}

function fleeceMap(size = 256) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const r = rng(33);
  ctx.fillStyle = '#dcdcdc';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 22000; i++) {
    const a = 0.05 + r() * 0.16;
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const x = r() * size;
    const y = r() * size;
    ctx.fillRect(x, y, 1 + r() * 1.5, 1);
  }
  return c;
}

function ripstopMap(size = 256) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d2d2d2';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(50,50,50,.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  return c;
}

function brushedMetalMap(size = 512) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const r = rng(9);
  ctx.fillStyle = '#d8d9db';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) {
    const y = r() * size;
    ctx.strokeStyle = `rgba(${r() > 0.5 ? 255 : 80},${r() > 0.5 ? 255 : 80},${r() > 0.5 ? 255 : 80},${r() * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  return c;
}

function logoTexture(text = 'i2GO') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 188px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function pullerLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 512);
  ctx.translate(128, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 62px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(55,57,60,.9)';
  ctx.fillText('i2GO', 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function cloneMap(tex, repeat) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
}

export function createMaterials() {
  const weave = weaveMap();
  const weaveB = weaveBump();
  const mesh = meshMap();
  const meshB = meshBump();
  const webbing = webbingMap();
  const webbingB = webbingBump();
  const fleece = fleeceMap();
  const ripstop = ripstopMap();
  const brushed = brushedMetalMap();

  const fabric = (repeat, tint, extra = {}) =>
    new THREE.MeshPhysicalMaterial({
      color: tint,
      map: cloneMap(texture(weave, { repeat }), repeat),
      bumpMap: cloneMap(texture(weaveB, { repeat, srgb: false }), repeat),
      bumpScale: 0.055,
      roughness: 0.8,
      metalness: 0.02,
      sheen: 0.42,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color('#d2cec2'),
      envMapIntensity: 0.38,
      ...extra,
    });

  const meshMat = (repeat, tint) =>
    new THREE.MeshStandardMaterial({
      color: tint,
      map: cloneMap(texture(mesh, { repeat }), repeat),
      bumpMap: cloneMap(texture(meshB, { repeat, srgb: false }), repeat),
      bumpScale: 0.075,
      roughness: 0.93,
      metalness: 0.02,
      envMapIntensity: 0.25,
      side: THREE.DoubleSide,
    });

  const webbingMat = (repeat = [4, 8], tint = '#1d1e20') =>
    new THREE.MeshStandardMaterial({
      color: tint,
      map: cloneMap(texture(webbing, { repeat }), repeat),
      bumpMap: cloneMap(texture(webbingB, { repeat, srgb: false }), repeat),
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.3,
    });

  const body = fabric([3.2, 3.9], '#45474b');
  const bodySide = fabric([3.2, 3.9], '#3e4043');
  const panel = fabric([3.6, 4.6], '#4d4f53');
  const olive = fabric([3.4, 4.2], '#535a4e');
  const oliveDark = fabric([3.4, 4.2], '#454b41');

  const materials = {
    body,
    bodySide,
    panel,
    olive,
    oliveDark,
    mesh: meshMat([4, 8], '#4b4e52'),
    meshWing: meshMat([2.6, 6.5], '#5e6266'),
    sideMesh: meshMat([3.5, 5.5], '#8d9286'),
    meshOlive: meshMat([5, 7], '#a3aa97'),
    meshBlack: meshMat([10, 14], '#1a1b1e'),
    webbing: webbingMat([4, 8]),
    webbingFine: webbingMat([8, 16]),
    webbingBlack: webbingMat([4, 8], '#141517'),
    webbingGrey: webbingMat([4, 8], '#3e4043'),
    trim: new THREE.MeshStandardMaterial({
      color: '#202123',
      roughness: 0.68,
      metalness: 0.04,
      envMapIntensity: 0.45,
    }),
    trimSoft: new THREE.MeshStandardMaterial({
      color: '#242528',
      roughness: 0.86,
      metalness: 0.02,
    }),
    interior: new THREE.MeshStandardMaterial({
      color: '#35373b',
      map: cloneMap(texture(ripstop, { repeat: [8, 10] }), [8, 10]),
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    lining: new THREE.MeshStandardMaterial({
      color: '#9b9c9a',
      map: cloneMap(texture(fleece, { repeat: [4, 4] }), [4, 4]),
      roughness: 1.0,
      metalness: 0.0,
    }),
    fleece: new THREE.MeshStandardMaterial({
      color: '#b9bab6',
      map: cloneMap(texture(fleece, { repeat: [4, 4] }), [4, 4]),
      roughness: 1,
      metalness: 0,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: '#b9bcc1',
      map: cloneMap(texture(brushed, { repeat: [1, 2] }), [1, 2]),
      metalness: 0.96,
      roughness: 0.23,
      envMapIntensity: 1.35,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: '#6d7076',
      metalness: 0.92,
      roughness: 0.34,
      envMapIntensity: 1.2,
    }),
    plastic: new THREE.MeshPhysicalMaterial({
      color: '#1a1b1d',
      roughness: 0.42,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.6,
    }),
    red: new THREE.MeshStandardMaterial({
      color: '#b52320',
      roughness: 0.5,
      metalness: 0.03,
      envMapIntensity: 0.5,
    }),
    stitch: new THREE.MeshStandardMaterial({
      color: '#767571',
      roughness: 0.9,
      metalness: 0,
    }),
    stitchDark: new THREE.MeshStandardMaterial({
      color: '#3a3b3a',
      roughness: 0.95,
      metalness: 0,
    }),
    laptop: new THREE.MeshPhysicalMaterial({
      color: '#b8bcc0',
      metalness: 0.85,
      roughness: 0.32,
      clearcoat: 0.2,
      envMapIntensity: 1.1,
    }),
    screen: new THREE.MeshPhysicalMaterial({
      color: '#08090b',
      roughness: 0.12,
      metalness: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.1,
    }),
    phone: new THREE.MeshPhysicalMaterial({
      color: '#191b1e',
      roughness: 0.3,
      metalness: 0.3,
      clearcoat: 0.7,
      envMapIntensity: 0.7,
    }),
    paper: new THREE.MeshStandardMaterial({
      color: '#dedbd2',
      roughness: 0.95,
    }),
    logo: new THREE.MeshStandardMaterial({
      map: logoTexture('i2GO'),
      transparent: true,
      opacity: 0.62,
      roughness: 0.8,
      metalness: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    pullerLogo: new THREE.MeshStandardMaterial({
      map: pullerLogoTexture(),
      transparent: true,
      opacity: 0.9,
      roughness: 0.5,
      metalness: 0.4,
      depthWrite: false,
    }),
  };

  return materials;
}

export const COLORWAYS = {
  graphite: {
    name: '石墨灰',
    english: 'GRAPHITE',
    body: '#45474b',
    panel: '#4d4f53',
    back: '#3f4144',
    mesh: '#3a3c3f',
    swatch: '#45474b',
  },
  obsidian: {
    name: '曜石黑',
    english: 'OBSIDIAN',
    body: '#2c2e31',
    panel: '#343639',
    back: '#383e39',
    mesh: '#36383b',
    swatch: '#2c2e31',
  },
  olive: {
    name: '苔原绿',
    english: 'TUNDRA',
    body: '#4f5a41',
    panel: '#5c6849',
    back: '#56614b',
    mesh: '#515a46',
    swatch: '#4f5a41',
  },
  sand: {
    name: '砂岩',
    english: 'SANDSTONE',
    body: '#7e7a70',
    panel: '#8a857a',
    back: '#63685c',
    mesh: '#5a574f',
    swatch: '#7e7a70',
  },
};
