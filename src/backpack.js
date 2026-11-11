import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  V,
  roundedRectPoints,
  puffyBox,
  ribbonGeometry,
  loftAlong,
  addStitches,
  tube,
  makeZipper,
  makeHandle,
} from './geometry.js';

const add = (parent, mesh, { cast = true, receive = true } = {}) => {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
};

function labelMesh(materials, width = 6.2, height = 1.85) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.logo);
  m.renderOrder = 2;
  return m;
}

export function buildBackpack(materials) {
  const root = new THREE.Group();
  root.name = 'i2GO_Commuter_Backpack';

  const bodyGroup = new THREE.Group();
  bodyGroup.name = '01_Body';
  root.add(bodyGroup);

  /* ---------------------------------------------------------------- *
   *  Main body — 43 x 32 x 18 cm envelope (32 wide, 43 tall).
   * ---------------------------------------------------------------- */
  const bodyH = 42.6;
  const bodyW = 31.5;
  const bodyD = 14.8;
  const bodyGeom = puffyBox(bodyW, bodyH, bodyD, 4.25, 18, 0.55, 1);
  // Taper the top a touch so the silhouette reads like a soft goods pattern,
  // not a hard case.
  {
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = THREE.MathUtils.clamp((y + bodyH / 2) / bodyH, 0, 1);
      const nx = x / (bodyW / 2);
      const ny = y / (bodyH / 2);
      const nz = z / (bodyD / 2);
      // Stuffed-soft silhouette: narrow waist, wider bottom, tapered top,
      // a slight forward belly and a flatter back.
      const waist = 1 - 0.04 * Math.sin(Math.PI * t);
      const bottom = 1 + 0.045 * Math.pow(1 - t, 2);
      const top = 1 - 0.07 * t * t;
      const sx = waist * bottom * top;
      const depth = 1 + 0.055 * Math.sin(Math.PI * t) - 0.04 * t * t;
      const belly = 0.34 * Math.sin(Math.PI * t) * (1 - 0.25 * ny * ny);
      const mask = Math.pow(Math.abs(nz), 1.55);
      const bulge = 0.4 * (1 - nx * nx) * (1 - 0.24 * ny * ny) * mask;
      const sag = 0.28 * (1 - nx * nx) * (1 - nz * nz) * Math.max(0, -ny - 0.55);
      pos.setX(i, x * sx);
      pos.setZ(i, z * depth + (z > 0 ? belly : 0) + Math.sign(z) * bulge);
      pos.setY(i, y - sag);
    }
    pos.needsUpdate = true;
    bodyGeom.computeVertexNormals();
  }
  const body = add(bodyGroup, new THREE.Mesh(bodyGeom, materials.body));
  body.name = 'Nylon_600D_Body';

  // slim integrated bottom reinforcement (kept flush so it does not read as a tray)
  const baseStitch = roundedRectPoints(30.0, 14.2, 0, 96, 0.45).map((p) => p.setY(-20.2));
  addStitches(bodyGroup, baseStitch, {
    normal: V(0, 1, 0),
    closed: true,
    gap: 0.95,
    dash: 0.42,
    offset: 0.03,
    material: materials.stitchDark,
  });

  addStitches(bodyGroup, [V(-14.2, -16.5, 7.42), V(0, -16.5, 7.47), V(14.2, -16.5, 7.42)], {
    normal: V(0, 0, 1),
    gap: 0.9,
    dash: 0.34,
    offset: 0.01,
    material: materials.stitchDark,
  });
  addStitches(bodyGroup, [V(-13.2, -19.2, 7.35), V(0, -19.2, 7.4), V(13.2, -19.2, 7.35)], {
    normal: V(0, 0, 1),
    gap: 0.9,
    dash: 0.34,
    offset: 0.01,
    material: materials.stitchDark,
  });

  /* Front mesh wings hug the rounded shoulder of the body. */
  const flatHalf = bodyW / 2 - 4.25;
  const frontZAt = (x) => {
    const d = Math.abs(x) - flatHalf;
    if (d <= 0) return bodyD / 2;
    if (d >= 4.25) return bodyD / 2 - 4.25;
    return bodyD / 2 - 4.25 + Math.sqrt(4.25 * 4.25 - d * d);
  };

  function wing(sign) {
    const nu = 20;
    const nv = 56;
    const positions = [];
    const uvs = [];
    const indices = [];
    const edgeInner = [];
    const edgeOuter = [];
    const edgeBottom = [];
    const edgeTop = [];
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const x = (11.15 + u * 3.55) * sign;
      const yMin = -13.4 + u * 3.2;
      const yMax = 15.6 - u * 0.8;
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        const y = THREE.MathUtils.lerp(yMin, yMax, v);
        const z = frontZAt(Math.abs(x)) + 0.045;
        positions.push(x, y, z);
        uvs.push(u, v);
        if (i === 0) edgeInner.push(V(x, y, z + 0.02));
        if (i === nu) edgeOuter.push(V(x, y, z + 0.02));
        if (j === 0) edgeBottom.push(V(x, y, z + 0.02));
        if (j === nv) edgeTop.push(V(x, y, z + 0.02));
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = i * (nv + 1) + j;
        const b = a + 1;
        const c = a + nv + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    const mesh = add(bodyGroup, new THREE.Mesh(g, materials.meshWing));
    mesh.name = 'Front_Mesh_Wing';
    for (const edge of [edgeInner, edgeOuter, edgeBottom, edgeTop]) {
      add(bodyGroup, tube(edge, 0.075, materials.trim, { segments: 90 }), { cast: false });
    }
  }
  wing(-1);
  wing(1);

  /* Vertical seams and a lower compression strap keep the side profile
     from reading as one blank slab. */
  function sideDetail(sign) {
    // flush sewn-on side panel
    const g = new THREE.Group();
    g.position.set(sign * 15.55, -1.5, 0.5);
    g.rotation.y = sign * Math.PI / 2;
    const w = 8.4;
    const h = 17.6;
    add(g, new THREE.Mesh(puffyBox(w, h, 0.3, 1.15, 8, 0.08, 1), materials.bodySide));
    const outline = roundedRectPoints(w, h, 0.23, 100, 0.56);
    add(g, tube(outline, 0.07, materials.trim, { closed: true, segments: 170 }), { cast: false });
    addStitches(g, outline.map((p) => p.clone().setZ(0.27)), {
      normal: V(0, 0, 1),
      closed: true,
      gap: 0.82,
      dash: 0.3,
      offset: 0.01,
      material: materials.stitchDark,
    });
    bodyGroup.add(g);

    const seamPts = [];
    for (let i = 0; i <= 34; i++) {
      const t = i / 34;
      seamPts.push(V(sign * 15.68, -15.5 + t * 30.5, -5.65));
    }
    addStitches(bodyGroup, seamPts, {
      normal: V(sign, 0, 0),
      gap: 0.92,
      dash: 0.34,
      offset: 0.02,
      material: materials.stitchDark,
    });
    const strapPts = [
      V(sign * 15.76, -16.8, -5.4),
      V(sign * 15.78, -16.8, -1.8),
      V(sign * 15.78, -16.8, 1.8),
      V(sign * 15.76, -16.8, 5.4),
    ];
    add(
      bodyGroup,
      new THREE.Mesh(ribbonGeometry(strapPts, 2.8, V(sign, 0, 0), { offset: 0 }), materials.webbingGrey),
      { cast: false },
    );
    const keeper = add(
      bodyGroup,
      new THREE.Mesh(new RoundedBoxGeometry(0.45, 2.0, 2.4, 2, 0.14), materials.plastic),
    );
    keeper.position.set(sign * 15.84, -16.8, 2.2);
  }
  sideDetail(-1);
  sideDetail(1);

  /* ---------------------------------------------------------------- *
   *  Front pocket panel (removable in the exploded view).
   * ---------------------------------------------------------------- */
  const frontPanel = new THREE.Group();
  frontPanel.name = '02_Front_Pocket';
  // Sits almost flush with the body: the piping and stitches define the
  // pocket, instead of a separate slab floating in front of the bag.
  frontPanel.position.z = 0.25;
  frontPanel.position.y = 1.2;
  frontPanel.scale.set(0.9, 0.8, 1);
  root.add(frontPanel);

  // dark lining inside the front compartment, visible when opened
  const cavity = add(
    bodyGroup,
    new THREE.Mesh(puffyBox(19.2, 23.2, 0.14, 0.9, 8, 0.0, 1), materials.interior),
    { cast: false },
  );
  cavity.position.set(0, 1.0, 7.43);
  cavity.name = 'Front_Cavity';

  const panelBase = add(
    frontPanel,
    new THREE.Mesh(puffyBox(21.8, 30.0, 1.15, 2.2, 16, 0.6, 1), materials.panel),
  );
  panelBase.position.set(0, 1.0, 8.55);
  panelBase.name = 'Front_Pocket_Panel';

  // Soft gusset wall: fills the gap between body and pocket, so the panel
  // reads as a sewn-on pocket instead of a slab floating in front.
  const gussetPts = roundedRectPoints(21.8, 30.0, 7.68, 180, 0.56).map((p) => p.setY(p.y + 1.0));
  add(frontPanel, tube(gussetPts, 0.76, materials.panel, { closed: true, segments: 260, radial: 10 }), { cast: false });
  {
    const pp = panelBase.geometry.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const z = pp.getZ(i);
      if (z <= 0) continue;
      const nx = pp.getX(i) / 10.9;
      const ny = pp.getY(i) / 15.0;
      const bulge = 0.62 * Math.max(0, 1 - nx * nx) * Math.max(0, 1 - ny * ny);
      pp.setZ(i, z + bulge);
    }
    pp.needsUpdate = true;
    panelBase.geometry.computeVertexNormals();
  }

  const panelOutline = roundedRectPoints(21.8, 30.0, 9.14, 160, 0.56).map((p) => p.setY(p.y + 1.0));
  add(
    frontPanel,
    tube(panelOutline, 0.055, materials.panel, { closed: true, segments: 260 }),
    { cast: false },
  );
  addStitches(frontPanel, panelOutline.map((p) => p.clone().setZ(9.22)), {
    normal: V(0, 0, 1),
    closed: true,
    gap: 0.68,
    dash: 0.34,
    offset: 0.02,
    material: materials.stitchDark,
  });
  const innerSeam = roundedRectPoints(20.3, 28.2, 9.25, 150, 0.57).map((p) => p.setY(p.y + 1.0));
  addStitches(frontPanel, innerSeam, {
    normal: V(0, 0, 1),
    closed: true,
    gap: 0.92,
    dash: 0.36,
    offset: 0.02,
    material: materials.stitchDark,
  });

  // a fine horizontal construction seam breaks up the large panel
  addStitches(frontPanel, [V(-10.0, 4.0, 9.27), V(0, 4.0, 9.4), V(10.0, 4.0, 9.27)], {
    normal: V(0, 0, 1),
    gap: 0.86,
    dash: 0.36,
    offset: 0.01,
    material: materials.stitchDark,
  });

  // diagonal utility seams near the lower corners
  addStitches(frontPanel, [V(-10.0, -9.8, 9.24), V(-7.6, -11.7, 9.34), V(-7.6, -13.5, 9.3)], {
    normal: V(0, 0, 1),
    gap: 0.55,
    dash: 0.3,
    offset: 0.01,
    material: materials.stitch,
  });
  addStitches(frontPanel, [V(10.0, -7.6, 9.24), V(7.6, -10.0, 9.36)], {
    normal: V(0, 0, 1),
    gap: 0.55,
    dash: 0.3,
    offset: 0.01,
    material: materials.stitch,
  });

  // vertical front zip with red pull tab
  const frontZipPts = [
    V(7.45, -13.0, 9.34),
    V(7.48, -8.0, 9.45),
    V(7.5, -2.0, 9.53),
    V(7.48, 3.6, 9.47),
    V(7.43, 5.8, 9.36),
  ];
  const frontZip = makeZipper(frontZipPts, V(0, 0, 1), materials, {
    width: 1.35,
    sliders: [0.63],
    teeth: false,
    pullerLength: 2.85,
  });
  frontPanel.add(frontZip);

  const redTab = add(
    frontPanel,
    new THREE.Mesh(new RoundedBoxGeometry(0.42, 4.8, 0.16, 2, 0.1), materials.red),
  );
  redTab.position.set(6.45, -6.3, 9.55);
  const redTip = add(
    frontPanel,
    new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.55, 0.18, 2, 0.08), materials.trim),
  );
  redTip.position.set(6.45, -3.7, 9.52);

  const garage = add(
    frontPanel,
    new THREE.Mesh(new RoundedBoxGeometry(1.75, 3.1, 0.2, 2, 0.22), materials.webbingBlack),
  );
  garage.position.set(7.45, -13.35, 9.34);

  const logo = labelMesh(materials, 5.8, 1.75);
  logo.position.set(-0.1, -12.1, 9.58);
  logo.material.opacity = 0.52;
  frontPanel.add(logo);

  // reinforced webbing tab at the bottom edge of the front pocket
  const bottomTab = add(
    frontPanel,
    new THREE.Mesh(new RoundedBoxGeometry(4.3, 1.3, 0.18, 2, 0.16), materials.webbing),
  );
  bottomTab.position.set(0, -13.8, 9.32);
  addStitches(frontPanel, [V(-1.8, -13.5, 9.43), V(1.8, -13.5, 9.43)], {
    normal: V(0, 0, 1),
    gap: 0.4,
    dash: 0.22,
    offset: 0.01,
    material: materials.stitchDark,
  });

  // inner lining face, visible when the panel is pulled away
  const lining = add(
    frontPanel,
    new THREE.Mesh(puffyBox(22.7, 29.9, 0.16, 1.1, 8, 0.01, -1), materials.interior),
    { cast: false },
  );
  lining.position.set(0, 1.2, 8.03);

  /* ---------------------------------------------------------------- *
   *  Front organizer: slip pockets, pen loops, fleece zip pocket.
   * ---------------------------------------------------------------- */
  const organizer = new THREE.Group();
  organizer.name = '03_Front_Organizer';
  root.add(organizer);

  const board = add(
    organizer,
    new THREE.Mesh(puffyBox(21.4, 29.2, 0.3, 1.4, 8, 0.02, 1), materials.interior),
    { cast: false },
  );
  board.position.set(0, 1.1, 7.5);
  addStitches(
    organizer,
    roundedRectPoints(20.9, 28.6, 7.68, 100, 0.55).map((p) => p.setY(p.y + 1.1)),
    {
      normal: V(0, 0, 1),
      closed: true,
      gap: 0.78,
      dash: 0.32,
      offset: 0.01,
      material: materials.stitchDark,
    },
  );

  const slip = (x, w = 8.6, h = 9.2) => {
    const p = add(
      organizer,
      new THREE.Mesh(puffyBox(w, h, 0.48, 0.45, 6, 0.13, 1), materials.webbingFine),
    );
    p.position.set(x, 5.0, 7.69);
    addStitches(
      organizer,
      roundedRectPoints(w - 0.4, h - 0.4, 7.95, 70, 0.5).map((q) => q.setX(q.x + x).setY(q.y + 5.0)),
      {
        normal: V(0, 0, 1),
        closed: true,
        gap: 0.55,
        dash: 0.24,
        offset: 0.01,
        material: materials.stitchDark,
      },
    );
    const elastic = add(
      organizer,
      new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.38, 0.12), materials.webbingBlack),
    );
    elastic.position.set(x, 9.5, 7.95);
    return p;
  };
  slip(-5.7, 8.8);
  slip(3.7, 7.4);

  // phone tucked into the left slip pocket
  const phone = add(
    organizer,
    new THREE.Mesh(new RoundedBoxGeometry(5.8, 11.7, 0.4, 4, 0.45), materials.phone),
  );
  phone.position.set(-5.7, 4.9, 7.87);
  phone.rotation.z = -0.025;
  const camera = add(
    organizer,
    new THREE.Mesh(new RoundedBoxGeometry(1.9, 1.9, 0.1, 3, 0.28), materials.darkMetal),
  );
  camera.position.set(-6.7, 8.1, 8.09);
  camera.rotation.z = -0.025;

  // pen loops + pens
  for (let i = 0; i < 2; i++) {
    const x = 8.8 + i * 1.35;
    const loop = add(
      organizer,
      new THREE.Mesh(new THREE.BoxGeometry(1.05, 6.7, 0.24), materials.webbingBlack),
    );
    loop.position.set(x, 4.0, 7.8);
    const pen = add(
      organizer,
      new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 9.1, 10), materials.plastic),
    );
    pen.position.set(x, 4.8, 7.9);
    pen.rotation.z = i ? 0.035 : -0.03;
    const clip = add(
      organizer,
      new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.16), materials.metal),
    );
    clip.position.set(x + 0.2, 7.1, 7.94);
    clip.rotation.z = i ? 0.035 : -0.03;
  }

  // small mesh zip pocket, upper right
  const meshPocket = add(
    organizer,
    new THREE.Mesh(puffyBox(5.2, 4.1, 0.28, 0.5, 6, 0.08, 1), materials.meshBlack),
  );
  meshPocket.position.set(8.35, 10.7, 7.76);
  const meshZip = makeZipper(
    [V(5.85, 12.6, 7.98), V(8.35, 12.45, 8.0), V(10.85, 12.0, 7.96)],
    V(0, 0, 1),
    materials,
    { width: 1.05, sliders: [0.55], teeth: false, pullerLength: 1.9 },
  );
  organizer.add(meshZip);

  // lower fleece-lined zip pocket
  const pouch = add(
    organizer,
    new THREE.Mesh(puffyBox(20.2, 8.2, 0.62, 0.8, 8, 0.16, 1), materials.webbingFine),
  );
  pouch.position.set(0, -8.4, 7.68);
  const fleeceBand = add(
    organizer,
    new THREE.Mesh(new THREE.BoxGeometry(15.8, 1.5, 0.07), materials.fleece),
    { cast: false },
  );
  fleeceBand.position.set(0, -6.1, 7.98);
  const pouchZip = makeZipper(
    [V(-10.2, -4.9, 7.99), V(0, -4.75, 8.02), V(10.2, -4.9, 7.99)],
    V(0, 0, 1),
    materials,
    { width: 1.3, sliders: [0.53], teeth: false, pullerLength: 2.25 },
  );
  organizer.add(pouchZip);

  // small key leash detail on the right
  const leash = add(
    organizer,
    new THREE.Mesh(new THREE.BoxGeometry(0.28, 8.0, 0.08), materials.webbingBlack),
    { cast: false },
  );
  leash.position.set(10.2, -8.0, 7.94);

  /* ---------------------------------------------------------------- *
   *  Back: padded mesh panel, luggage strap, laptop compartment.
   * ---------------------------------------------------------------- */
  const backPanel = new THREE.Group();
  backPanel.name = '04_Back_Panel';
  root.add(backPanel);

  const backPad = add(
    backPanel,
    new THREE.Mesh(puffyBox(29.4, 38.8, 1.5, 4.2, 14, 0.42, -1), materials.olive),
  );
  backPad.position.set(0, 0.2, -8.12);

  const meshInset = add(
    backPanel,
    new THREE.Mesh(puffyBox(21.0, 30.2, 0.38, 2.0, 10, 0.13, -1), materials.meshOlive),
  );
  meshInset.position.set(0, 1.2, -8.9);

  for (const x of [-7.1, 7.1]) {
    const ridge = add(
      backPanel,
      new THREE.Mesh(puffyBox(3.6, 31.5, 1.15, 1.0, 8, 0.24, -1), materials.oliveDark),
    );
    ridge.position.set(x, 1.2, -8.98);
  }
  // horizontal quilting lines on the back pad
  for (const y of [12.0, 7.5, -6.0, -11.0]) {
    addStitches(
      backPanel,
      [V(-12.4, y, -8.82), V(-4.4, y, -8.86), V(4.4, y, -8.86), V(12.4, y, -8.82)],
      { normal: V(0, 0, -1), gap: 0.9, dash: 0.34, offset: 0.02, material: materials.stitchDark },
    );
  }

  const topYoke = add(
    backPanel,
    new THREE.Mesh(puffyBox(28.8, 7.4, 1.15, 2.4, 10, 0.18, -1), materials.oliveDark),
  );
  topYoke.position.set(0, 17.2, -8.52);

  const lumbar = add(
    backPanel,
    new THREE.Mesh(puffyBox(23.0, 5.0, 1.0, 2.0, 10, 0.22, -1), materials.meshOlive),
  );
  lumbar.position.set(0, -15.2, -8.86);

  // luggage pass-through strap
  const luggagePts = [
    V(-8.0, 5.2, -9.38),
    V(-3.0, 5.15, -9.48),
    V(3.0, 5.15, -9.48),
    V(8.0, 5.2, -9.38),
  ];
  const luggage = add(
    backPanel,
    new THREE.Mesh(ribbonGeometry(luggagePts, 3.1, V(0, 0, -1), { offset: 0.02 }), materials.webbing),
  );
  for (const y of [4.0, 6.35]) {
    addStitches(
      backPanel,
      [V(-7.9, y, -9.38), V(7.9, y, -9.38)],
      { normal: V(0, 0, -1), gap: 0.6, dash: 0.28, offset: 0.02, material: materials.stitchDark },
    );
  }
  const velcro = add(
    backPanel,
    new THREE.Mesh(new RoundedBoxGeometry(5.2, 1.4, 0.08, 2, 0.1), materials.webbingBlack),
  );
  velcro.position.set(0, 5.2, -9.42);

  // top laptop-compartment zip
  const backZipPts = [
    V(-13.2, 14.8, -8.9),
    V(-7.0, 16.8, -9.02),
    V(0, 17.3, -9.05),
    V(7.0, 16.8, -9.02),
    V(13.2, 14.8, -8.9),
  ];
  backPanel.add(
    makeZipper(backZipPts, V(0, 0, -1), materials, {
      width: 1.4,
      sliders: [0.47, 0.56],
      teeth: false,
      pullerLength: 2.6,
    }),
  );

  // woven label on the yoke
  const woven = add(
    backPanel,
    new THREE.Mesh(new RoundedBoxGeometry(4.4, 1.25, 0.1, 2, 0.08), materials.webbing),
  );
  woven.position.set(0, 19.35, -9.1);
  add(
    backPanel,
    new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.65), materials.logo),
    { cast: false },
  ).position.set(0, 19.35, -9.17);

  // dark opening left behind when the back panel is lifted away
  const backCavity = add(
    bodyGroup,
    new THREE.Mesh(puffyBox(28.8, 37.2, 0.22, 1.4, 8, 0.0, -1), materials.interior),
    { cast: false },
  );
  backCavity.position.set(0, 0.2, -7.52);
  backCavity.name = 'Back_Cavity';

  /* Laptop sleeve stays with the body while the back panel lifts away. */
  const laptopAssembly = new THREE.Group();
  laptopAssembly.name = '05_Laptop_Sleeve';
  root.add(laptopAssembly);

  const sleevePad = add(
    laptopAssembly,
    new THREE.Mesh(puffyBox(26.8, 33.4, 0.7, 2.2, 10, 0.1, -1), materials.oliveDark),
  );
  sleevePad.position.set(0, 1.0, -7.72);

  const laptop = add(
    laptopAssembly,
    new THREE.Mesh(new RoundedBoxGeometry(24.0, 32.4, 1.0, 4, 0.42), materials.laptop),
  );
  laptop.position.set(0, 1.0, -8.02);

  // subtle lid seam so the closed laptop reads as a product
  const lidSeam = add(
    laptopAssembly,
    new THREE.Mesh(new THREE.BoxGeometry(22.8, 0.1, 0.05), materials.darkMetal),
    { cast: false },
  );
  lidSeam.position.set(0, -14.2, -8.545);

  // padded border around the sleeve opening
  for (const [w, h, x, y] of [
    [27.2, 1.9, 0, 17.8],
    [27.2, 1.9, 0, -15.8],
    [1.9, 31.8, -12.65, 1.0],
    [1.9, 31.8, 12.65, 1.0],
  ]) {
    const b = add(
      laptopAssembly,
      new THREE.Mesh(puffyBox(w, h, 0.95, 0.6, 6, 0.14, -1), materials.olive),
    );
    b.position.set(x, y, -8.48);
  }

  const elasticPts = [
    V(-11.0, 2.8, -8.7),
    V(-6.0, 2.75, -8.78),
    V(0, 2.7, -8.82),
    V(6.0, 2.75, -8.78),
    V(11.0, 2.8, -8.7),
  ];
  add(
    laptopAssembly,
    new THREE.Mesh(ribbonGeometry(elasticPts, 1.7, V(0, 0, -1), { offset: 0 }), materials.webbingBlack),
  );
  const elasticPull = add(
    laptopAssembly,
    new THREE.Mesh(new RoundedBoxGeometry(2.1, 2.8, 0.12, 2, 0.14), materials.webbingBlack),
  );
  elasticPull.position.set(0, 1.4, -8.88);

  /* ---------------------------------------------------------------- *
   *  Shoulder straps, sternum strap, hardware.
   * ---------------------------------------------------------------- */
  const straps = new THREE.Group();
  straps.name = '06_Harness';
  root.add(straps);

  function shoulder(sign) {
    const g = new THREE.Group();
    const pts = [
      V(5.8 * sign, 19.2, -7.7),
      V(8.4 * sign, 16.4, -8.7),
      V(10.5 * sign, 11.0, -9.3),
      V(11.5 * sign, 4.0, -9.95),
      V(11.25 * sign, -4.0, -9.9),
      V(10.1 * sign, -11.4, -9.35),
      V(8.9 * sign, -16.8, -8.8),
      V(8.0 * sign, -19.8, -8.4),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    const widthAt = (t) => 4.35 + Math.sin(Math.min(1, t * 1.3) * Math.PI) * 0.7 - t * 0.7;
    const geom = loftAlong(curve, {
      width: 4.6,
      thickness: 1.75,
      widthAxis: V(1, 0, 0),
      segments: 120,
      radial: 18,
      widthAt,
    });
    const strap = add(g, new THREE.Mesh(geom, materials.webbing));
    strap.name = 'Shoulder_Strap';

    // Piped edges define the foam channel.
    for (const sideSign of [-1, 1]) {
      const edgePts = [];
      const N = 70;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t).normalize();
        let side = V(1, 0, 0).addScaledVector(tan, -tan.x);
        side.normalize();
        edgePts.push(p.clone().addScaledVector(side, sideSign * widthAt(t) * 0.47).addScaledVector(V(0, 0, -1), 0.78));
      }
      add(g, tube(edgePts, 0.11, materials.webbingGrey, { segments: 110, radial: 5 }), { cast: false });
    }

    // stitched borders along both edges of the padded strap
    for (const sideSign of [-1, 1]) {
      const edgePts = [];
      const N = 52;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t).normalize();
        let side = V(1, 0, 0).addScaledVector(tan, -tan.x);
        side.normalize();
        edgePts.push(p.clone().addScaledVector(side, sideSign * widthAt(t) * 0.36).addScaledVector(V(0, 0, -1), 0.87));
      }
      addStitches(g, edgePts, {
        normal: V(0, 0, -1),
        gap: 0.85,
        dash: 0.33,
        offset: 0.02,
        material: materials.stitchDark,
        skip: (u) => u > 0.93 || u < 0.04,
      });
    }

    // top webbing bridge over the shoulder of the bag
    const bridgePts = [
      V(5.8 * sign, 19.4, -7.6),
      V(6.0 * sign, 20.6, -6.7),
      V(6.3 * sign, 21.25, -5.4),
    ];
    const bridgeCurve = new THREE.CatmullRomCurve3(bridgePts, false, 'centripetal', 0.5);
    add(
      g,
      new THREE.Mesh(
        loftAlong(bridgeCurve, {
          width: 2.9,
          thickness: 0.65,
          widthAxis: V(1, 0, 0),
          segments: 24,
          radial: 12,
        }),
        materials.webbing,
      ),
    );
    const ring = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.11, 8, 20), materials.metal));
    ring.position.set(6.5 * sign, 19.8, -7.4);
    ring.rotation.y = Math.PI / 2;

    // Load-lifter webbing from the strap crest to the body top.
    const lifterPts = [
      V(6.35 * sign, 20.7, -7.4),
      V(7.15 * sign, 19.9, -8.0),
      V(7.85 * sign, 18.6, -8.45),
    ];
    add(g, new THREE.Mesh(
      ribbonGeometry(lifterPts, 1.65, V(0, 0, -1), { offset: 0.02 }),
      materials.webbingGrey,
    ), { cast: false });
    const lifterKeeper = add(g, new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.7, 0.55, 2, 0.14), materials.plastic));
    lifterKeeper.position.set(7.45 * sign, 19.35, -8.2);

    // bottom adjuster + loose webbing tail
    const t = 0.84;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = V(1, 0, 0).addScaledVector(tangent, -tangent.x).normalize();
    const n = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const buckle = add(
      g,
      new THREE.Mesh(new RoundedBoxGeometry(3.7, 2.2, 0.62, 3, 0.2), materials.plastic),
    );
    buckle.position.copy(p).addScaledVector(n, 0.48);
    buckle.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, tangent, n));
    const slot = add(
      g,
      new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.45, 0.72), materials.trimSoft),
      { cast: false },
    );
    slot.position.copy(buckle.position).addScaledVector(n, 0.1);
    slot.quaternion.copy(buckle.quaternion);

    const tailPts = [
      p.clone().addScaledVector(n, 0.7),
      p.clone().add(V(0.4 * sign, -3.0, 0.12)).addScaledVector(n, 0.75),
      p.clone().add(V(0.75 * sign, -5.6, 0.2)).addScaledVector(n, 0.75),
    ];
    add(
      g,
      new THREE.Mesh(ribbonGeometry(tailPts, 2.0, V(0, 0, -1), { offset: 0 }), materials.webbing),
    );
    return g;
  }

  straps.add(shoulder(-1));
  straps.add(shoulder(1));

  // sternum strap
  const sternum = new THREE.Group();
  sternum.name = 'Sternum_Strap';
  straps.add(sternum);
  const sternumPts = [
    V(-11.5, 4.1, -10.55),
    V(-6.0, 3.15, -10.9),
    V(0, 2.95, -11.02),
    V(6.0, 3.15, -10.9),
    V(11.5, 4.1, -10.55),
  ];
  add(
    sternum,
    new THREE.Mesh(ribbonGeometry(sternumPts, 2.1, V(0, 0, -1), { offset: 0 }), materials.webbingGrey),
  );
  const sternumBuckle = add(
    sternum,
    new THREE.Mesh(new RoundedBoxGeometry(3.3, 2.5, 0.8, 3, 0.2), materials.plastic),
  );
  sternumBuckle.position.set(0, 2.95, -11.16);
  const sternumSlot = add(
    sternum,
    new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.46, 0.88), materials.trimSoft),
    { cast: false },
  );
  sternumSlot.position.set(0, 2.95, -11.16);
  const sternumPin = add(
    sternum,
    new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.1), materials.metal),
    { cast: false },
  );
  sternumPin.position.set(0, 2.95, -11.59);

  /* ---------------------------------------------------------------- *
   *  Handles, top zip, side details.
   * ---------------------------------------------------------------- */
  const handle = new THREE.Group();
  handle.name = '07_Top_Handle';
  const handlePts = [
    V(-4.4, 21.25, 0.0),
    V(-4.65, 22.1, 0.0),
    V(-3.55, 22.85, 0.0),
    V(0, 23.1, 0.0),
    V(3.55, 22.85, 0.0),
    V(4.65, 22.1, 0.0),
    V(4.4, 21.25, 0.0),
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePts, false, 'centripetal', 0.5);
  add(handle, new THREE.Mesh(
    loftAlong(handleCurve, {
      width: 2.45,
      thickness: 0.56,
      widthAxis: V(0, 0, 1),
      segments: 56,
      radial: 14,
      power: 0.62,
    }),
    materials.webbing,
  ));
  for (const s of [-1, 1]) {
    const edge = [];
    for (let i = 0; i <= 30; i++) {
      const p = handleCurve.getPointAt(i / 30);
      edge.push(p.clone().add(V(0, 0.32, s * 1.08)));
    }
    addStitches(handle, edge, {
      normal: V(0, 1, 0),
      gap: 0.62,
      dash: 0.26,
      offset: 0.012,
      material: materials.stitchDark,
    });
  }
  for (const s of [-1, 1]) {
    const anchor = add(handle, new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.55, 3.0, 2, 0.2), materials.webbing));
    anchor.position.set(s * 4.5, 21.25, 0);
  }
  root.add(handle);

  // leather logo patch under the handle
  const patch = add(
    root,
    new THREE.Mesh(new RoundedBoxGeometry(5.4, 1.35, 0.16, 2, 0.16), materials.webbing),
  );
  patch.position.set(0, 21.5, -2.4);

  // Lid seam above the front pocket: separates the top panel from the
  // pocket so the bulge reads as a lid, not a suitcase door.
  addStitches(root, [V(-13.4, 18.4, 8.1), V(0, 18.4, 8.35), V(13.4, 18.4, 8.1)], {
    normal: V(0, 0, 1), gap: 0.74, dash: 0.3, offset: 0.01, material: materials.stitchDark,
  });

  // Main compartment zip runs across the top, behind the handle. Keeping it
  // off the front face stops the bag reading like a hard suitcase.
  const topZipPts = [
    V(-12.2, 20.25, -3.1),
    V(-8.0, 20.95, -3.05),
    V(-4.0, 21.25, -3.0),
    V(0, 21.33, -2.98),
    V(4.0, 21.25, -3.0),
    V(8.0, 20.95, -3.05),
    V(12.2, 20.25, -3.1),
  ];
  root.add(
    makeZipper(topZipPts, V(0, 1, 0), materials, {
      width: 1.62,
      sliders: [0.45, 0.55],
      teeth: false,
      pullerLength: 1.9,
      pullDir: V(0, -0.45, -0.9),
    }),
  );
  for (const y of [-1.05, 1.05]) {
    addStitches(
      root,
      [V(-11.8, 21.0 + y * 0.02, -3.1 + y), V(0, 21.3 + y * 0.02, -2.98 + y), V(11.8, 21.0 + y * 0.02, -3.1 + y)],
      { normal: V(0, 1, 0), gap: 0.62, dash: 0.26, offset: 0.01, material: materials.stitchDark },
    );
  }

  // small centre grab loop behind the sliders
  const grab = add(
    root,
    new THREE.Mesh(new RoundedBoxGeometry(3.6, 0.95, 0.65, 3, 0.28), materials.webbingBlack),
  );
  grab.position.set(0, 21.55, 1.35);

  // side zip + red pull
  const sideZipPts = [
    V(15.79, -10.4, 2.8),
    V(15.81, -6.0, 2.95),
    V(15.82, -1.0, 3.0),
    V(15.79, 3.4, 2.9),
  ];
  const sideZip = makeZipper(sideZipPts, V(1, 0, 0), materials, {
    width: 1.3,
    sliders: [0.57],
    teeth: false,
    pullerLength: 2.35,
  });
  root.add(sideZip);
  const sideRed = add(
    root,
    new THREE.Mesh(new RoundedBoxGeometry(0.12, 3.7, 0.42, 2, 0.08), materials.red),
  );
  sideRed.position.set(15.86, -6.3, 2.05);

  // side grab handle (right side only, like the sample)
  const sideHandlePts = [
    V(15.45, 12.6, -3.6),
    V(16.02, 11.5, -3.35),
    V(16.05, 7.8, -3.05),
    V(15.45, 6.5, -2.75),
  ];
  const sideHandleCurve = new THREE.CatmullRomCurve3(sideHandlePts, false, 'centripetal', 0.5);
  const sideHandle = add(
    root,
    new THREE.Mesh(
      loftAlong(sideHandleCurve, {
        width: 1.65,
        thickness: 0.48,
        widthAxis: V(0, 0, 1),
        segments: 40,
        radial: 12,
      }),
      materials.webbing,
    ),
  );

  // tiny red key loop on the shoulder strap
  const keyLoop = add(
    root,
    new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.09, 8, 18), materials.metal),
  );
  keyLoop.position.set(-11.05, 9.8, -10.55);
  keyLoop.rotation.y = 0.2;

  /* ---------------------------------------------------------------- *
   *  Shadow flags + metadata.
   * ---------------------------------------------------------------- */
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material && (o.material.transparent || o.material.map === materials.logo.map)) {
      o.castShadow = false;
    }
  });

  root.userData = {
    materials,
    parts: {
      frontPanel,
      organizer,
      frontCavity: cavity,
      backPanel,
      backCavity,
      laptopAssembly,
      straps,
      sternum,
      luggage,
      handle,
      sideHandle,
      sideZip,
      sideRed,
    },
    basePositions: {
      frontPanel: frontPanel.position.clone(),
      organizer: organizer.position.clone(),
      backPanel: backPanel.position.clone(),
      laptopAssembly: laptopAssembly.position.clone(),
      straps: straps.position.clone(),
    },
  };

  return root;
}

/* Smoothly open the sample into a construction-style exploded view. */
export function setExploded(root, amount, reduceMotion = false) {
  const { parts, basePositions } = root.userData;
  const k = THREE.MathUtils.clamp(amount, 0, 1);
  const ease = k * k * (3 - 2 * k);

  parts.frontPanel.position.x = basePositions.frontPanel.x - 11.2 * ease;
  parts.frontPanel.position.z = basePositions.frontPanel.z + 11.2 * ease;
  parts.frontPanel.position.y = basePositions.frontPanel.y + 0.9 * ease;
  parts.frontPanel.rotation.y = 0.18 * ease;

  parts.organizer.position.z = basePositions.organizer.z + 0.6 * ease;

  parts.backPanel.position.z = basePositions.backPanel.z - 10.2 * ease;
  parts.backPanel.position.x = basePositions.backPanel.x + 1.4 * ease;
  parts.laptopAssembly.position.z = basePositions.laptopAssembly.z - 1.6 * ease;

  const opacity = 1 - 0.86 * ease;
  parts.straps.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.material.userData._harnessCopy) {
      o.material = o.material.clone();
      o.material.userData._harnessCopy = true;
      o.material.userData._origOpacity = o.material.opacity ?? 1;
    }
    o.material.transparent = ease > 0.01;
    o.material.opacity = (o.material.userData._origOpacity || 1) * opacity;
    o.material.depthWrite = ease < 0.01;
    o.castShadow = ease < 0.01;
  });
  if (reduceMotion) {
    parts.frontPanel.position.x = basePositions.frontPanel.x - 14.5 * ease;
  }
}

export function setColorway(root, colorway) {
  const { materials } = root.userData;
  materials.body.color.set(colorway.body);
  materials.bodySide.color.set(colorway.body).multiplyScalar(0.92);
  materials.panel.color.set(colorway.panel);
  materials.olive.color.set(colorway.back);
  materials.oliveDark.color.set(colorway.back).multiplyScalar(0.84);
  materials.mesh.color.set(colorway.mesh);
  materials.meshOlive.color.set(colorway.mesh);
}
