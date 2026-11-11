import { COLORWAYS } from './materials.js';
import { specSummary } from './spec.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SA = 1.0; // cm
const SHEET_W = 1600;
const SHEET_H = 1120;
const S = 4.8; // px per cm on the review sheet (≈1:5)

function rrPath(x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  return `M ${x + rad} ${y} H ${x + w - rad} Q ${x + w} ${y} ${x + w} ${y + rad} V ${y + h - rad} Q ${x + w} ${y + h} ${x + w - rad} ${y + h} H ${x + rad} Q ${x} ${y + h} ${x} ${y + h - rad} V ${y + rad} Q ${x} ${y} ${x + rad} ${y} Z`;
}

function panelPath(x, y, w, h, taper = 0.93, r = 3.0) {
  const rad = Math.min(r, w / 2, h / 2);
  const topW = w * taper;
  const inset = (w - topW) / 2;
  return `M ${x + rad} ${y + h}
    H ${x + w - rad}
    Q ${x + w} ${y + h} ${x + w} ${y + h - rad}
    L ${x + w - inset} ${y + rad}
    Q ${x + w / 2} ${y - rad * 0.35} ${x + inset} ${y + rad}
    L ${x} ${y + h - rad}
    Q ${x} ${y + h} ${x + rad} ${y + h} Z`;
}

function rrPoints(x, y, w, h, r, n = 8) {
  const rad = Math.min(r, w / 2, h / 2);
  const pts = [];
  for (const [cx, cy, a0] of [
    [x + w - rad, y + rad, -Math.PI / 2],
    [x + w - rad, y + h - rad, 0],
    [x + rad, y + h - rad, Math.PI / 2],
    [x + rad, y + rad, Math.PI],
  ]) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * i / n;
      pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
    }
  }
  return pts;
}

function panelPoints(x, y, w, h, taper = 0.93, r = 3.0, n = 8) {
  const pts = [];
  const topW = w * taper;
  const inset = (w - topW) / 2;
  // bottom edge + right bottom corner
  pts.push([x + r, y + h], [x + w - r, y + h]);
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) * i / n;
    pts.push([x + w - r + r * Math.cos(a), y + h - r + r * Math.sin(a)]);
  }
  pts.push([x + w - inset, y + r]);
  // top curved edge (quadratic)
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const bx = x + w - inset + (x + inset - (x + w - inset)) * t;
    const by = y + r - 2 * (1 - t) * t * (r * 1.35);
    pts.push([bx, by]);
  }
  pts.push([x, y + h - r]);
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) + (Math.PI / 2) * i / n;
    pts.push([x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]);
  }
  return pts;
}

function shape(kind, x, y, w, h, inset = 0) {
  const sa = inset;
  const W = w + sa * 2;
  const H = h + sa * 2;
  const X = x - sa;
  const Y = y - sa;
  if (kind === 'panel') {
    return {
      svg: panelPath(X, Y, W, H, 0.93, Math.max(1, 3 + sa)),
      points: panelPoints(X, Y, W, H, 0.93, Math.max(1, 3 + sa)),
    };
  }
  return {
    svg: rrPath(X, Y, W, H, Math.max(1, 2.4 + sa)),
    points: rrPoints(X, Y, W, H, Math.max(1, 2.4 + sa)),
  };
}

function dimH(x1, x2, y, text) {
  const mid = (x1 + x2) / 2;
  return `<g class="dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}"/><line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}"/><text x="${mid}" y="${y - 6}" text-anchor="middle">${esc(text)}</text></g>`;
}

function dimV(x, y1, y2, text) {
  const mid = (y1 + y2) / 2;
  return `<g class="dim"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}"/><line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}"/><text x="${x - 7}" y="${mid}" text-anchor="middle" transform="rotate(-90 ${x - 7} ${mid})">${esc(text)}</text></g>`;
}

function grain(x, y, w, h, vertical = true) {
  if (vertical) {
    const cx = x + w / 2;
    const a = y + h * 0.22;
    const b = y + h * 0.78;
    return `<g class="grain"><line x1="${cx}" y1="${a}" x2="${cx}" y2="${b}"/><path d="M ${cx - 4} ${a + 7} L ${cx} ${a} L ${cx + 4} ${a + 7}"/><path d="M ${cx - 4} ${b - 7} L ${cx} ${b} L ${cx + 4} ${b - 7}"/><text x="${cx + 7}" y="${(a + b) / 2}" transform="rotate(-90 ${cx + 7} ${(a + b) / 2})">GRAIN</text></g>`;
  }
  const cy = y + h / 2;
  return `<g class="grain"><line x1="${x + w * 0.16}" y1="${cy}" x2="${x + w * 0.84}" y2="${cy}"/><path d="M ${x + w * 0.16 + 7} ${cy - 4} L ${x + w * 0.16} ${cy} L ${x + w * 0.16 + 7} ${cy + 4}"/><path d="M ${x + w * 0.84 - 7} ${cy - 4} L ${x + w * 0.84} ${cy} L ${x + w * 0.84 - 7} ${cy + 4}"/><text x="${x + w / 2}" y="${cy - 6}" text-anchor="middle">GRAIN</text></g>`;
}

function notches(x, y, w, h) {
  const xs = [x + w * 0.25, x + w * 0.5, x + w * 0.75];
  return `<g class="notch">${xs.map((xx) => `<line x1="${xx}" y1="${y - 5}" x2="${xx}" y2="${y + 5}"/><line x1="${xx}" y1="${y + h - 5}" x2="${xx}" y2="${y + h + 5}"/>`).join('')}<line x1="${x - 5}" y1="${y + h / 2}" x2="${x + 5}" y2="${y + h / 2}"/><line x1="${x + w - 5}" y1="${y + h / 2}" x2="${x + w + 5}" y2="${y + h / 2}"/></g>`;
}

function darts(x, y, w, h) {
  const a = x + w * 0.26;
  const b = x + w * 0.74;
  const t = y + h - 6;
  return `<g class="dart"><path d="M ${a - 7} ${t} L ${a} ${t - h * 0.16} L ${a + 7} ${t}" fill="none"/><path d="M ${b - 7} ${t} L ${b} ${t - h * 0.16} L ${b + 7} ${t}" fill="none"/></g>`;
}

function getPieces(spec) {
  const pieces = [
    { code: 'P01', name: 'FRONT', cn: '前幅', w: spec.w, h: spec.h, qty: 1, kind: 'panel', mat: 'SHELL', note: '前袋开口 / 拉链位见刀口' },
    { code: 'P02', name: 'BACK', cn: '后幅', w: spec.w, h: spec.h, qty: 1, kind: 'panel', mat: 'SHELL', note: spec.laptop ? '电脑仓开口 30 × 24' : '贴背 / 肩带位', anchors: true },
    { code: 'P03', name: 'GUSSET', cn: '侧围', w: spec.d, h: spec.h, qty: 2, kind: 'round', mat: 'SHELL', note: '左右各一 / 底角收口' },
    { code: 'P04', name: 'BOTTOM', cn: '底幅', w: spec.w, h: spec.d, qty: 1, kind: 'round', mat: 'SHELL', note: '四周压线' },
  ];
  if (spec.frontPocket) {
    pieces.push({ code: 'P05', name: 'POCKET', cn: '前袋', w: spec.w * 0.72, h: spec.h * 0.64, qty: 1, kind: 'round', mat: 'SHELL', note: '拉链开口 / 内贴插袋' });
  }
  if (spec.laptop) {
    pieces.push({ code: 'P06', name: 'SLEEVE', cn: '电脑仓', w: spec.w * 0.84, h: spec.h * 0.76, qty: 1, kind: 'round', mat: 'LINING', note: '适配 15.6"' });
  }
  pieces.push(
    { code: 'P07', name: 'HANDLE', cn: '提手', w: 22, h: 4.5, qty: 1, kind: 'round', mat: 'WEBBING', note: '织带 + 网布' },
    { code: 'P08', name: 'STRAP', cn: '肩带', w: 62, h: 6.5, qty: 2, kind: 'round', mat: 'FOAM+MESH', note: '左右各一 / 展开长 62' },
    { code: 'P09', name: 'ZIP TAPE', cn: '拉链带', w: spec.w + 8, h: 2.4, qty: 1, kind: 'round', mat: 'ZIP', note: '#5 反穿 / 双拉头', sa: 0 },
    { code: 'P11', name: 'HANDLE REINF', cn: '提手补强', w: 10, h: 6, qty: 2, kind: 'round', mat: 'SHELL', note: '提手两端' },
    { code: 'P12', name: 'ZIP GARAGE', cn: '拉链仓', w: 4, h: 2.4, qty: 2, kind: 'round', mat: 'SHELL', note: '双端', sa: 0 },
  );
  if (spec.sidePockets) {
    pieces.push({ code: 'P10', name: 'SIDE POCKET', cn: '侧袋', w: 7, h: 15, qty: 2, kind: 'round', mat: 'MESH', note: '弹力网 / 左右各一' });
  }
  return pieces;
}

function drawPiece(p, x, y) {
  const sa = p.sa ?? SA;
  const cut = shape(p.kind, x, y, p.w * S, p.h * S, sa * S);
  const seam = shape(p.kind, x, y, p.w * S, p.h * S, 0);
  const cw = p.w + sa * 2;
  const ch = p.h + sa * 2;
  const vertical = !['P04', 'P09', 'P12'].includes(p.code);
  return `<g class="piece">
    <path d="${cut.svg}" fill="#fffdf8" stroke="#262621" stroke-width="1.15"/>
    <path d="${seam.svg}" fill="none" class="seam"/>
    ${grain(x, y, p.w * S, p.h * S, vertical)}
    ${notches(x, y, p.w * S, p.h * S)}
    ${p.kind === 'panel' ? darts(x, y, p.w * S, p.h * S) : ''}
    ${(() => {
      const short = p.w < 12 || p.code.endsWith('b');
      const low = p.h * S < 34;
      const ly = low ? y - 19 : y + 14;
      const sy = low ? y - 8 : y + 25;
      return `<text x="${x + 6}" y="${ly}" class="piece-label">${short ? esc(p.code) : `${esc(p.code)} · ${esc(p.name)}`}</text>
        <text x="${x + 6}" y="${sy}" class="piece-en">${esc(p.cn)}</text>
        <text x="${x + p.w * S - 6}" y="${ly}" text-anchor="end" class="piece-qty">QTY ${p.qty}</text>`;
    })()}
  </g>`;
}

function titleBlock(spec, bom) {
  const x = 1110;
  const y = 710;
  const w = 430;
  const h = 340;
  const swatch = COLORWAYS[spec.color]?.swatch || '#4b4d50';
  const rows = [
    ['CODE', spec.code],
    ['STYLE', spec.name],
    ['FINISHED', `${specSummary(spec)} cm`],
    ['SHELL', spec.material],
    ['LINING', spec.lining],
    ['HARDWARE', spec.hardware],
    ['SEAM', '1.0 cm'],
    ['SCALE', '1 : 5 review · 1:1 DXF'],
  ];
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fbf8f0" stroke="#2a2a25" stroke-width="1.2"/>
    <text x="${x + 16}" y="${y + 28}" class="tb-brand">i2GO</text>
    <text x="${x + 82}" y="${y + 28}" class="tb-sub">PAPER PATTERN / 纸格</text>
    <line x1="${x + 16}" y1="${y + 42}" x2="${x + w - 16}" y2="${y + 42}" class="rule"/>
    <rect x="${x + w - 78}" y="${y + 54}" width="54" height="54" rx="27" fill="${swatch}" stroke="#2a2a25" stroke-width=".8"/>
    <text x="${x + w - 51}" y="${y + 124}" text-anchor="middle" class="piece-note">${esc(COLORWAYS[spec.color]?.name || '')}</text>
    ${rows.map(([k, v], i) => `<text x="${x + 16}" y="${y + 66 + i * 23}" class="tb-key">${esc(k)}</text><text x="${x + 122}" y="${y + 66 + i * 23}" class="tb-val">${esc(v)}</text>`).join('')}
    <line x1="${x + 16}" y1="${y + 248}" x2="${x + w - 16}" y2="${y + 248}" class="rule"/>
    <text x="${x + 16}" y="${y + 268}" class="tb-warn">DRAFT v0.1 · 待版师校核 · NOT SIGNED</text>
    <text x="${x + 16}" y="${y + 284}" class="piece-note">纸格为草案；刀口/缝份/拉链长度需版师复核。</text>
    <text x="${x + 16}" y="${y + 310}" class="piece-note">1:1 SVG / DXF 已导出；本页为 1:5 审阅。</text>
  </g>`;
}

function legend(x, y) {
  return `<g>
    <text x="${x}" y="${y}" class="section-label">图例 / LEGEND</text>
    <line x1="${x}" y1="${y + 18}" x2="${x + 46}" y2="${y + 18}" stroke="#262621" stroke-width="1.4"/>
    <text x="${x + 58}" y="${y + 22}" class="legend-text">毛样 / CUT（含 1.0 cm SA）</text>
    <line x1="${x}" y1="${y + 40}" x2="${x + 46}" y2="${y + 40}" class="seam"/>
    <text x="${x + 58}" y="${y + 44}" class="legend-text">净样 / STITCH</text>
    <line x1="${x + 20}" y1="${y + 70}" x2="${x + 20}" y2="${y + 56}" class="grain-line"/>
    <text x="${x + 58}" y="${y + 66}" class="legend-text">纱向 / GRAIN</text>
    <line x1="${x}" y1="${y + 88}" x2="${x + 10}" y2="${y + 88}" class="dart"/>
    <text x="${x + 58}" y="${y + 92}" class="legend-text">省道 / DART</text>
  </g>`;
}

function stamp(x, y) {
  return `<g transform="rotate(-5 ${x + 150} ${y + 30})">
    <rect x="${x}" y="${y}" width="300" height="58" fill="none" stroke="#a53d31" stroke-width="2"/>
    <text x="${x + 150}" y="${y + 24}" text-anchor="middle" class="stamp-main">DRAFT v0.1</text>
    <text x="${x + 150}" y="${y + 44}" text-anchor="middle" class="stamp-sub">待版师校核 / NOT SIGNED</text>
  </g>`;
}

function schedule(pieces) {
  const x = 70;
  const y = 660;
  const w = 940;
  const row = 19;
  const out = [
    `<text x="${x}" y="${y}" class="section-label">PIECE SCHEDULE / 纸格清单</text>`,
    `<line x1="${x}" y1="${y + 8}" x2="${x + w}" y2="${y + 8}" class="rule"/>`,
    `<text x="${x}" y="${y + 24}" class="piece-note">CODE</text>`,
    `<text x="${x + 62}" y="${y + 24}" class="piece-note">PIECE</text>`,
    `<text x="${x + 230}" y="${y + 24}" class="piece-note">CUT (cm)</text>`,
    `<text x="${x + 372}" y="${y + 24}" class="piece-note">FIN (cm)</text>`,
    `<text x="${x + 500}" y="${y + 24}" class="piece-note">QTY</text>`,
    `<text x="${x + 550}" y="${y + 24}" class="piece-note">MATERIAL</text>`,
  ];
  pieces.forEach((p, i) => {
    const sa = p.sa ?? SA;
    const yy = y + 42 + i * row;
    out.push(`<text x="${x}" y="${yy}" class="piece-label">${esc(p.code)}</text>`);
    out.push(`<text x="${x + 62}" y="${yy}" class="piece-note">${esc(p.name)} / ${esc(p.cn)}</text>`);
    out.push(`<text x="${x + 230}" y="${yy}" class="piece-note">${(p.w + sa * 2).toFixed(1)} × ${(p.h + sa * 2).toFixed(1)}</text>`);
    out.push(`<text x="${x + 372}" y="${yy}" class="piece-note">${p.w.toFixed(1)} × ${p.h.toFixed(1)}</text>`);
    out.push(`<text x="${x + 500}" y="${yy}" class="piece-note">${p.qty}</text>`);
    out.push(`<text x="${x + 550}" y="${yy}" class="piece-note">${esc(p.mat)} · SA ${sa.toFixed(1)}</text>`);
  });
  out.push(`<line x1="${x}" y1="${y + 42 + pieces.length * row}" x2="${x + w}" y2="${y + 42 + pieces.length * row}" class="rule"/>`);
  return `<g>${out.join('')}</g>`;
}

export function buildPatternSVG(spec, bom, { showSeam = true } = {}) {
  const pieces = getPieces(spec);
  const pos = {
    P01: [70, 160], P02: [270, 160], P03: [475, 160], P05: [690, 170], P06: [840, 170],
    P04: [70, 470], P07: [270, 470], P08: [400, 470], P09: [70, 620], P10: [300, 560],
    P11: [400, 560], P12: [500, 560],
  };
  const out = pieces.filter((p) => !['P11', 'P12'].includes(p.code)).map((p) => {
    let [x, y] = pos[p.code] || [70, 470];
    if (p.code === 'P03') {
      // two gussets side by side
      return drawPiece(p, x, y) + drawPiece({ ...p, code: 'P03b' }, x + p.w * S + 14, y);
    }
    if (p.code === 'P08') {
      return drawPiece(p, x, y) + drawPiece({ ...p, code: 'P08b' }, x, y + p.h * S + 18);
    }
    if (p.code === 'P10') {
      return drawPiece(p, x, y) + drawPiece({ ...p, code: 'P10b' }, x + p.w * S + 12, y);
    }
    if (p.code === 'P11') {
      return drawPiece(p, x, y) + drawPiece({ ...p, code: 'P11b' }, x + p.w * S + 12, y);
    }
    if (p.code === 'P12') {
      return drawPiece(p, x, y) + drawPiece({ ...p, code: 'P12b' }, x + p.w * S + 12, y);
    }
    return drawPiece(p, x, y);
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}" height="${SHEET_H}" role="img" aria-label="i2GO paper pattern draft">
    <defs><style>
      text { font-family: "Cascadia Mono", "SFMono-Regular", Consolas, "Microsoft YaHei", monospace; fill: #2a2a25; }
      .piece-label { font-size: 9.5px; font-weight: 600; }
      .piece-en { font-size: 7px; fill: #8b8375; }
      .piece-note { font-size: 6.5px; fill: #8b8375; }
      .piece-qty { font-size: 8px; fill: #a53d31; }
      .tb-brand { font-size: 22px; font-weight: 700; }
      .tb-sub { font-size: 8px; fill: #8b8375; letter-spacing: .06em; }
      .tb-key { font-size: 6.5px; fill: #9a9284; }
      .tb-val { font-size: 8.5px; }
      .tb-warn { font-size: 7.5px; fill: #a53d31; font-weight: 600; }
      .section-label { font-size: 9px; fill: #6b655a; letter-spacing: .1em; }
      .legend-text { font-size: 8px; fill: #6b655a; }
      .seam { fill: none; stroke: #9b9282; stroke-width: .8; stroke-dasharray: 5 4; ${showSeam ? '' : 'opacity:0;'} }
      .grain line, .grain-line { stroke: #a39a8a; stroke-width: .8; stroke-dasharray: 3 3; }
      .grain path { fill: none; stroke: #a39a8a; stroke-width: .8; }
      .grain text { font-size: 5.5px; fill: #a39a8a; }
      .notch line { stroke: #262621; stroke-width: 1.1; }
      .dart path { stroke: #262621; stroke-width: 1; stroke-dasharray: 3 3; }
      .dim line { stroke: #a53d31; stroke-width: .7; opacity: .72; }
      .dim text { font-size: 7px; fill: #8d392d; }
      .rule { stroke: #d6cfc1; stroke-width: .8; }
      .stamp-main { font-size: 17px; font-weight: 700; fill: #a53d31; letter-spacing: .08em; }
      .stamp-sub { font-size: 8px; fill: #a53d31; }
    </style></defs>
    <rect width="${SHEET_W}" height="${SHEET_H}" fill="#f3f0e7"/>
    <rect width="${SHEET_W}" height="70" fill="#7d8a63"/>
    <text x="34" y="43" font-size="23" font-weight="700" letter-spacing="3" fill="#fffdf8">PAPER PATTERN / 纸格</text>
    <text x="1568" y="28" text-anchor="end" font-size="9" fill="#fffdf8">${esc(spec.code)} · ${esc(specSummary(spec))} cm</text>
    <text x="1568" y="46" text-anchor="end" font-size="9" fill="#fffdf8">SA 1.0 cm · 1:5 REVIEW · 1:1 SVG+DXF · DRAFT v0.1</text>
    <rect y="70" width="${SHEET_W}" height="26" fill="#eef1e6"/>
    <text x="34" y="88" font-size="7.5" fill="#3f4636">10–12 PIECES · CUT / STITCH / NOTCH / GRAIN / DART · NOT A SIGNED PRODUCTION PATTERN</text>
    ${out}
    ${schedule(pieces)}
    ${legend(70, 950)}
    ${stamp(400, 985)}
    ${titleBlock(spec, bom)}
    <rect y="${SHEET_H - 42}" width="${SHEET_W}" height="42" fill="#7d8a63"/>
    <text x="34" y="${SHEET_H - 17}" font-size="7.5" fill="#f4f3ea">i2GO · PAPER PATTERN DRAFT v0.1 · 待版师校核 · 1:1 DXF/SVG 可下载</text>
    <text x="1568" y="${SHEET_H - 17}" text-anchor="end" font-size="7.5" fill="#f4f3ea">PAGE 1/1 · REVIEW SHEET</text>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/*  1:1 SVG                                                           */
/* ------------------------------------------------------------------ */
export function buildPattern1to1SVG(spec, bom) {
  const pieces = getPieces(spec);
  const positions = {
    P01: [20, 30], P02: [360, 30], P03: [700, 30], P05: [900, 30], P06: [1100, 30],
    P04: [20, 520], P07: [360, 520], P08: [500, 520], P09: [20, 700], P10: [440, 700],
    P11: [560, 700], P12: [780, 700],
  };
  const mm = (v) => v * 10;
  const out = pieces.filter((p) => !['P11', 'P12'].includes(p.code)).map((p) => {
    const [xcm, ycm] = positions[p.code] || [20, 520];
    const x = mm(xcm);
    const y = mm(ycm);
    const w = mm(p.w);
    const h = mm(p.h);
    const sa = mm(p.sa ?? SA);
    const cut = shape(p.kind, x - sa, y - sa, w + sa * 2, h + sa * 2, 0);
    const seam = shape(p.kind, x, y, w, h, 0);
    return `<g><path d="${cut.svg}" fill="#fffdf8" stroke="#1e1f1c" stroke-width=".6"/><path d="${seam.svg}" fill="none" stroke="#8b8477" stroke-width=".45" stroke-dasharray="5 4"/>
      <text x="${x + 8}" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="600">${esc(p.code)} · ${esc(p.name)} / ${esc(p.cn)}</text>
      <text x="${x + 8}" y="${y + 31}" font-family="Arial, Helvetica, sans-serif" font-size="6.5" fill="#6d675c">CUT ${(p.w + (p.sa ?? SA) * 2).toFixed(0)} × ${(p.h + (p.sa ?? SA) * 2).toFixed(0)} cm · FIN ${p.w.toFixed(0)} × ${p.h.toFixed(0)} · QTY ${p.qty}</text>
      <line x1="${x + w / 2}" y1="${y + h * 0.25}" x2="${x + w / 2}" y2="${y + h * 0.75}" stroke="#a53d31" stroke-width=".5"/>
      <text x="${x + w / 2 + 6}" y="${y + h / 2}" font-family="Arial, Helvetica, sans-serif" font-size="5" fill="#a53d31" transform="rotate(-90 ${x + w / 2 + 6} ${y + h / 2})">GRAIN</text>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400mm" height="900mm" viewBox="0 0 1400 900">
    <rect width="100%" height="100%" fill="#fffdf8"/>
    ${out}
    <rect x="20" y="780" width="1360" height="100" fill="none" stroke="#1e1f1c" stroke-width=".6"/>
    <text x="34" y="810" font-family="Arial, Helvetica, sans-serif" font-size="6" font-weight="700">i2GO · PAPER PATTERN DRAFT v0.1 · ${esc(spec.code)} · ${esc(specSummary(spec))} cm · SA 1.0 cm · 1:1 mm</text>
    <text x="34" y="824" font-family="Arial, Helvetica, sans-serif" font-size="4.5" fill="#8a3b2f">DRAFT — pattern maker must verify seam allowance, notches, zipper length and hardware before cutting. Not a signed production pattern.</text>
    <text x="34" y="838" font-family="Arial, Helvetica, sans-serif" font-size="4" fill="#6d675c">LAYERS: CUT / STITCH / NOTCH / GRAIN · UNITS: mm · ${new Date().toISOString().slice(0, 10)}</text>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/*  DXF (R12 ASCII, mm)                                               */
/* ------------------------------------------------------------------ */
function dxfText(s) {
  return String(s).replace(/\r?\n/g, ' ').slice(0, 250);
}

export function buildPatternDXF(spec, bom) {
  const pieces = getPieces(spec);
  const positions = {
    P01: [20, 30], P02: [360, 30], P03: [700, 30], P05: [900, 30], P06: [1100, 30],
    P04: [20, 520], P07: [360, 520], P08: [500, 520], P09: [20, 700], P10: [440, 700],
    P11: [560, 700], P12: [780, 700],
  };
  const L = [];
  const p = (...xs) => L.push(...xs);
  p('0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '9', '$MEASUREMENT', '70', '1', '0', 'ENDSEC');
  p('0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '5');
  for (const [name, color] of [['CUT', 1], ['STITCH', 5], ['NOTCH', 3], ['GRAIN', 6], ['TEXT', 7]]) {
    p('0', 'LAYER', '2', name, '70', '0', '62', String(color), '6', 'CONTINUOUS');
  }
  p('0', 'ENDTAB', '0', 'ENDSEC');
  p('0', 'SECTION', '2', 'ENTITIES');

  const poly = (pts, layer, closed = true) => {
    p('0', 'POLYLINE', '8', layer, '66', '1', '70', closed ? '1' : '0');
    for (const [x, y] of pts) {
      p('0', 'VERTEX', '8', layer, '10', x.toFixed(2), '20', y.toFixed(2));
    }
    p('0', 'SEQEND', '8', layer);
  };
  const line = (x1, y1, x2, y2, layer) => {
    p('0', 'LINE', '8', layer, '10', x1.toFixed(2), '20', y1.toFixed(2), '11', x2.toFixed(2), '21', y2.toFixed(2));
  };
  const text = (x, y, h, s, layer = 'TEXT') => {
    p('0', 'TEXT', '8', layer, '10', x.toFixed(2), '20', y.toFixed(2), '40', h.toFixed(2), '1', dxfText(s));
  };

  for (const piece of pieces) {
    const [xcm, ycm] = positions[piece.code] || [20, 520];
    const x = xcm * 10;
    const y = ycm * 10;
    const w = piece.w * 10;
    const h = piece.h * 10;
    const sa = (piece.sa ?? SA) * 10;
    const cut = shape(piece.kind, x - sa, y - sa, w + sa * 2, h + sa * 2, 0);
    const seam = shape(piece.kind, x, y, w, h, 0);
    poly(cut.points, 'CUT');
    poly(seam.points, 'STITCH');
    // notches
    for (const t of [0.25, 0.5, 0.75]) {
      line(x + w * t, y - 5, x + w * t, y + 5, 'NOTCH');
      line(x + w * t, y + h - 5, x + w * t, y + h + 5, 'NOTCH');
    }
    line(x - 5, y + h / 2, x + 5, y + h / 2, 'NOTCH');
    line(x + w - 5, y + h / 2, x + w + 5, y + h / 2, 'NOTCH');
    // grain
    if (!['P04', 'P09', 'P12'].includes(piece.code)) {
      line(x + w / 2, y + h * 0.2, x + w / 2, y + h * 0.8, 'GRAIN');
      line(x + w / 2 - 4, y + h * 0.2 + 6, x + w / 2, y + h * 0.2, 'GRAIN');
      line(x + w / 2 + 4, y + h * 0.2 + 6, x + w / 2, y + h * 0.2, 'GRAIN');
    }
    text(x + 5, y + h - 6, 5, `${piece.code} ${piece.name} / ${piece.cn}`, 'TEXT');
    text(x + 5, y + h - 12, 3.2, `CUT ${(piece.w + (piece.sa ?? SA) * 2).toFixed(1)}x${(piece.h + (piece.sa ?? SA) * 2).toFixed(1)} FIN ${piece.w.toFixed(1)}x${piece.h.toFixed(1)} SA ${(piece.sa ?? SA).toFixed(1)} QTY ${piece.qty}`, 'TEXT');
  }

  text(20, 600, 8, `i2GO PAPER PATTERN DRAFT v0.1 - ${spec.code} - ${specSummary(spec)} cm - SA 1.0 cm - 1:1 mm`, 'TEXT');
  text(20, 588, 4, 'DRAFT - pattern maker must verify before cutting. Not a signed production pattern.', 'TEXT');
  text(20, 580, 3.2, 'Layers: CUT / STITCH / NOTCH / GRAIN / TEXT. Units: mm.', 'TEXT');
  p('0', 'ENDSEC', '0', 'EOF');
  return L.join('\n');
}
