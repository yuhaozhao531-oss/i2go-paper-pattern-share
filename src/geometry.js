import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function roundedRectPoints(w, h, z = 0, n = 120, power = 0.56) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x = (w / 2) * Math.sign(ca) * Math.pow(Math.abs(ca), power);
    const y = (h / 2) * Math.sign(sa) * Math.pow(Math.abs(sa), power);
    pts.push(V(x, y, z));
  }
  return pts;
}

export function extrudeRoundedRect(w, h, depth, radius = 3, bevel = 0.8) {
  const shape = roundedRectShape(w, h, radius);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 20,
    steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/* A rounded box whose front (or back) face puffs out like padded fabric. */
export function puffyBox(w, h, d, radius = 1, segments = 10, bulge = 0.55, toward = 1) {
  const raw = new RoundedBoxGeometry(w, h, d, segments, radius);
  const g = mergeVertices(raw, 1e-4);
  raw.dispose();
  const pos = g.attributes.position;
  const halfW = w / 2;
  const halfH = h / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    const frontness = THREE.MathUtils.smoothstep(z * toward, 0, d * 0.48);
    const edgeX = Math.max(0, 1 - Math.pow(Math.abs(x) / halfW, 5));
    const edgeY = Math.max(0, 1 - Math.pow(Math.abs(y) / halfH, 4));
    z += toward * bulge * frontness * Math.pow(edgeX * edgeY, 0.45);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export function ribbonGeometry(points, width, normal, { offset = 0, closed = false, uvScale = 1 } = {}) {
  const n = normal.clone().normalize();
  const count = points.length;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i < count; i++) {
    const prev = closed
      ? points[(i - 1 + count) % count]
      : points[Math.max(0, i - 1)];
    const next = closed
      ? points[(i + 1) % count]
      : points[Math.min(count - 1, i + 1)];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const side = new THREE.Vector3().crossVectors(n, tangent).normalize();
    const p = points[i].clone().addScaledVector(n, offset);
    const a = p.clone().addScaledVector(side, width / 2);
    const b = p.clone().addScaledVector(side, -width / 2);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    normals.push(n.x, n.y, n.z, n.x, n.y, n.z);
    uvs.push(0, i / count * uvScale, 1, i / count * uvScale);
  }

  const segs = closed ? count : count - 1;
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % count;
    const a = i * 2;
    const b = i * 2 + 1;
    const c = j * 2;
    const d = j * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

/* Loft a superellipse cross-section along a curve. widthAxis controls which
   world axis the broad face of a strap lies across. */
export function loftAlong(curve, {
  width = 5,
  thickness = 1.8,
  widthAxis = V(1, 0, 0),
  segments = 90,
  radial = 18,
  widthAt = null,
  power = 0.7,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const frames = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    let side = widthAxis.clone().addScaledVector(tangent, -widthAxis.dot(tangent));
    if (side.lengthSq() < 1e-5) side.set(0, 0, 1);
    side.normalize();
    let n = new THREE.Vector3().crossVectors(side, tangent).normalize();
    if (n.lengthSq() < 1e-5) n.set(0, 1, 0);
    const w = widthAt ? widthAt(t) : width;
    frames.push({ p, tangent, side, n, w });
  }

  for (let i = 0; i <= segments; i++) {
    const { p, side, n, w } = frames[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const sx = Math.sign(ca) * Math.pow(Math.abs(ca), power) * (w / 2);
      const sy = Math.sign(sa) * Math.pow(Math.abs(sa), power) * (thickness / 2);
      const v = p.clone().addScaledVector(side, sx).addScaledVector(n, sy);
      positions.push(v.x, v.y, v.z);
      uvs.push(j / radial, i / segments);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + 1;
      const c = a + radial + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* A stitched panel laid on the outer face of a strap/handle. */
export function surfaceStrip(curve, {
  width = 4,
  offset = 1,
  widthAxis = V(1, 0, 0),
  normalSign = 1,
  segments = 90,
  widthAt = null,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const normals = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    let side = widthAxis.clone().addScaledVector(tangent, -widthAxis.dot(tangent));
    if (side.lengthSq() < 1e-5) side.set(0, 0, 1);
    side.normalize();
    let n = new THREE.Vector3().crossVectors(side, tangent).normalize();
    n.multiplyScalar(normalSign);
    const w = widthAt ? widthAt(t) : width;
    const base = p.clone().addScaledVector(n, offset);
    const a = base.clone().addScaledVector(side, w / 2);
    const b = base.clone().addScaledVector(side, -w / 2);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    normals.push(n.x, n.y, n.z, n.x, n.y, n.z);
    uvs.push(0, i / segments * 6, 1, i / segments * 6);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

/* Real stitched dashes following a seam. */
export function addStitches(parent, points, {
  normal = V(0, 0, 1),
  closed = false,
  gap = 0.72,
  dash = 0.36,
  width = 0.055,
  thickness = 0.03,
  offset = 0.06,
  material = null,
  skip = null,
} = {}) {
  if (!material) return null;
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.5);
  const length = curve.getLength();
  const count = Math.max(1, Math.floor(length / gap));
  const geom = new THREE.BoxGeometry(dash, width, thickness);
  const inst = new THREE.InstancedMesh(geom, material, count);
  const n = normal.clone().normalize();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scl = new THREE.Vector3(1, 1, 1);
  let i = 0;
  for (let k = 0; k < count; k++) {
    const u = (k + 0.5) / count;
    if (skip && skip(u)) continue;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u).normalize();
    const side = new THREE.Vector3().crossVectors(n, t).normalize();
    q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, side, n));
    m.compose(p.clone().addScaledVector(n, offset), q, scl);
    inst.setMatrixAt(i++, m);
  }
  inst.count = i;
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

export function tube(points, radius, material, { closed = false, segments = 220, radial = 8 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.5);
  const g = new THREE.TubeGeometry(curve, segments, radius, radial, closed);
  const mesh = new THREE.Mesh(g, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makePuller(materials, length = 3.2) {
  const group = new THREE.Group();
  const size = 0.92;
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(size, length, 0.16, 3, 0.16),
    materials.metal,
  );
  body.position.y = length / 2;
  body.castShadow = true;
  group.add(body);

  const inset = new THREE.Mesh(
    new RoundedBoxGeometry(size * 0.62, length * 0.82, 0.055, 2, 0.1),
    materials.darkMetal,
  );
  inset.position.set(0, length / 2, 0.095);
  group.add(inset);

  for (const sign of [1, -1]) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), materials.pullerLogo);
    plane.position.set(0, length / 2, sign * 0.145);
    plane.rotation.z = -Math.PI / 2;
    if (sign < 0) plane.rotation.y = Math.PI;
    group.add(plane);
  }

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 8, 18), materials.metal);
  ring.position.y = 0.16;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

/* Builds tape, teeth, sliders and metal pullers along a 3D path. */
export function makeZipper(points, normal, materials, {
  width = 2.15,
  sliders = [],
  teeth = true,
  toothGap = 0.58,
  pullerLength = 3.1,
  pullDir = null,
  tapeMaterial = null,
} = {}) {
  const group = new THREE.Group();
  const n = normal.clone().normalize();
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const length = curve.getLength();

  const tape = new THREE.Mesh(
    ribbonGeometry(points, width, n, { offset: 0.015 }),
    tapeMaterial || materials.webbingFine,
  );
  tape.receiveShadow = true;
  group.add(tape);

  // raised tape edges
  for (const sign of [1, -1]) {
    const edgePts = points.map((p) => {
      const i = points.indexOf(p);
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const t = new THREE.Vector3().subVectors(next, prev).normalize();
      const side = new THREE.Vector3().crossVectors(n, t).normalize();
      return p.clone().addScaledVector(side, sign * (width / 2 - 0.12));
    });
    const edge = new THREE.Mesh(
      ribbonGeometry(edgePts, 0.22, n, { offset: 0.035 }),
      materials.trim,
    );
    group.add(edge);
  }

  if (teeth) {
    const count = Math.max(8, Math.floor(length / toothGap));    const geom = new THREE.BoxGeometry(0.3, 0.17, 0.18);
    const inst = new THREE.InstancedMesh(geom, materials.darkMetal, count * 2);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scl = new THREE.Vector3(1, 1, 1);
    let idx = 0;
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < count; i++) {
        const u = (i + 0.5 + (row ? 0.5 : 0)) / count;
        if (u > 1) continue;
        const p = curve.getPointAt(u);
        const t = curve.getTangentAt(u).normalize();
        const side = new THREE.Vector3().crossVectors(n, t).normalize();
        const pos = p.clone().addScaledVector(n, 0.12).addScaledVector(side, row ? 0.31 : -0.31);
        q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, t, n));
        m.compose(pos, q, scl);
        inst.setMatrixAt(idx++, m);
      }
    }
    inst.count = idx;
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  } else {
    // reverse-coil zipper: a continuous metallic coil instead of exposed teeth
    const coilPts = points.map((p) => p.clone().addScaledVector(n, 0.075));
    const coilCurve = new THREE.CatmullRomCurve3(coilPts, false, 'centripetal', 0.5);
    const coil = new THREE.Mesh(
      new THREE.TubeGeometry(coilCurve, Math.max(24, points.length * 12), 0.044, 5, false),
      materials.darkMetal,
    );
    coil.castShadow = false;
    group.add(coil);
  }

  for (const t of sliders) {
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(n, tangent).normalize();
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(1.25, 1.55, 0.5, 3, 0.16),
      materials.metal,
    );
    body.position.copy(p).addScaledVector(n, 0.26);
    body.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, tangent, n));
    body.castShadow = true;
    group.add(body);

    // hanging direction: downward, or forward on a horizontal top face
    let d;
    if (pullDir) {
      d = pullDir.clone().normalize();
    } else if (Math.abs(n.y) > 0.7) {
      d = V(0, -0.62, 0.79).normalize();
    } else {
      d = V(0, -1, 0).addScaledVector(n, n.y).normalize();
    }
    let face = n.clone().addScaledVector(d, -n.dot(d));
    if (face.lengthSq() < 1e-5) face.set(0, 0, 1);
    face.normalize();
    const xAxis = new THREE.Vector3().crossVectors(d, face).normalize();
    const puller = makePuller(materials, pullerLength);
    puller.position.copy(p).addScaledVector(n, 0.36).addScaledVector(d, 0.45);
    puller.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, d, face));
    group.add(puller);
  }

  return group;
}

export function makeHandle(materials, mirror = false) {
  const g = new THREE.Group();
  const pts = [
    V(-4.2, 21.0, -0.2),
    V(-4.45, 22.8, 0.0),
    V(-3.3, 24.0, 0.15),
    V(0, 24.45, 0.2),
    V(3.3, 24.0, 0.15),
    V(4.45, 22.8, 0.0),
    V(4.2, 21.0, -0.2),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const geom = loftAlong(curve, {
    width: 2.85,
    thickness: 0.92,
    widthAxis: V(0, 0, 1),
    segments: 80,
    radial: 16,
    widthAt: (t) => 2.85 - Math.sin(t * Math.PI) * 0.12,
  });
  const handle = new THREE.Mesh(geom, materials.webbing);
  handle.castShadow = true;
  handle.receiveShadow = true;
  g.add(handle);

  const strip = new THREE.Mesh(
    surfaceStrip(curve, {
      width: 1.95,
      offset: 0.46,
      widthAxis: V(0, 0, 1),
      normalSign: 1,
      segments: 80,
    }),
    materials.meshBlack,
  );
  g.add(strip);

  addStitches(g, pts.map((p) => p.clone().add(V(0, 0.47, 0))), {
    normal: V(0, 1, 0),
    gap: 0.62,
    dash: 0.3,
    offset: 0.02,
    material: materials.stitchDark,
  });

  for (const x of [-4.15, 4.15]) {
    const anchor = new THREE.Mesh(
      new RoundedBoxGeometry(3.0, 1.15, 3.1, 3, 0.4),
      materials.webbing,
    );
    anchor.position.set(x, 21.0, -0.1);
    anchor.castShadow = true;
    g.add(anchor);
    addStitches(g, roundedRectPoints(2.7, 0.9, 21.6, 36).map((p) => p.setZ(-0.1)), {
      normal: V(0, 1, 0),
      gap: 0.4,
      dash: 0.2,
      offset: 0.02,
      material: materials.stitchDark,
    });
  }

  if (mirror) g.scale.x = -1;
  return g;
}
