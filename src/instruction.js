import { COLORWAYS } from './materials.js';
import { specSummary } from './spec.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 10) / 10;

function rr(x, y, w, h, r = 8) {
  const rad = Math.min(r, w / 2, h / 2);
  return `M ${x + rad} ${y} H ${x + w - rad} Q ${x + w} ${y} ${x + w} ${y + rad} V ${y + h - rad} Q ${x + w} ${y + h} ${x + w - rad} ${y + h} H ${x + rad} Q ${x} ${y + h} ${x} ${y + h - rad} V ${y + rad} Q ${x} ${y} ${x + rad} ${y} Z`;
}

function bar(x, y, w, text, right = '') {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="27" fill="#7d8a63" />
    <text x="${x + 12}" y="${y + 18}" class="bar-text">${esc(text)}</text>
    <text x="${x + w - 12}" y="${y + 18}" text-anchor="end" class="bar-sub">${esc(right)}</text>
  </g>`;
}

function image(sources, key, x, y, w, h, { fit = 'slice', radius = 0 } = {}) {
  const src = sources[key] || '';
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eeeae0" stroke="#d1cabd" stroke-width=".8" />
    ${src ? `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${fit}" ${radius ? `clip-path="url(#clip-${key})"` : ''} />` : `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" class="img-missing">IMAGE</text>`}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#cfc8bb" stroke-width=".8" />
  </g>`;
}

function callout(x1, y1, px, py, color, lines, align = 'left') {
  const anchor = align === 'left' ? 'start' : 'end';
  const tx = align === 'left' ? x1 : x1;
  const lineEnd = align === 'left' ? x1 + 168 : x1 - 168;
  const textX = align === 'left' ? x1 + 20 : x1 - 20;
  return `<g class="callout">
    <line x1="${lineEnd}" y1="${y1 + 7}" x2="${px}" y2="${py}" stroke="#6e6a60" stroke-width=".8" />
    <circle cx="${px}" cy="${py}" r="3.2" fill="${color}" stroke="#fffdf8" stroke-width="1" />
    <rect x="${tx}" y="${y1 - 1}" width="14" height="14" fill="${color}" stroke="#2a2a25" stroke-width=".6" />
    <text x="${textX}" y="${y1 + 10}" text-anchor="${anchor}" class="callout-title">${esc(lines[0])}</text>
    <text x="${textX}" y="${y1 + 24}" text-anchor="${anchor}" class="callout-sub">${esc(lines[1] || '')}</text>
  </g>`;
}

function dimH(x1, x2, y, text) {
  const mid = (x1 + x2) / 2;
  return `<g class="dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />
    <line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}" /><line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}" />
    <text x="${mid}" y="${y - 7}" text-anchor="middle">${esc(text)}</text></g>`;
}
function dimV(x, y1, y2, text) {
  const mid = (y1 + y2) / 2;
  return `<g class="dim"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />
    <line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}" /><line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}" />
    <text x="${x - 8}" y="${mid}" text-anchor="middle" transform="rotate(-90 ${x - 8} ${mid})">${esc(text)}</text></g>`;
}

function lineDrawing(spec) {
  const S = 4.2;
  const w = spec.w * S;
  const h = spec.h * S;
  const d = spec.d * S;
  const x = 90;
  const y = 1070;
  const sx = x + w + 100;
  return `<g class="line-drawing">
    <path d="${rr(x, y, w, h, 15)}" fill="none" stroke="#2a2b25" stroke-width="1.2" />
    <path d="${rr(x + 10, y + 18, w - 20, h - 70, 10)}" fill="none" stroke="#2a2b25" stroke-width=".8" />
    <path d="M ${x + w * 0.3} ${y + 2} C ${x + w * 0.3} ${y - 18}, ${x + w * 0.7} ${y - 18}, ${x + w * 0.7} ${y + 2}" fill="none" stroke="#2a2b25" stroke-width="4" stroke-linecap="round" />
    <line x1="${x + w - 35}" y1="${y + 65}" x2="${x + w - 35}" y2="${y + h - 30}" stroke="#2a2b25" stroke-width="1.6" />
    <rect x="${x + w - 40}" y="${y + h * 0.55}" width="10" height="16" fill="none" stroke="#2a2b25" stroke-width=".8" />
    <text x="${x + w / 2}" y="${y + h - 18}" text-anchor="middle" class="ld-logo">i2GO</text>
    <path d="${rr(sx, y, d, h, 10)}" fill="none" stroke="#2a2b25" stroke-width="1.2" />
    <path d="M ${sx + d - 8} ${y + 20} C ${sx + d + 12} ${y + 80}, ${sx + d + 8} ${y + h * 0.62}, ${sx + d - 12} ${y + h - 20}" fill="none" stroke="#2a2b25" stroke-width="5" stroke-linecap="round" />
    <line x1="${sx + d * 0.35}" y1="${y + 60}" x2="${sx + d * 0.35}" y2="${y + h - 55}" stroke="#2a2b25" stroke-width="1" stroke-dasharray="4 3" />
    ${dimH(x, x + w, y + h + 26, `${spec.w} cm`)}
    ${dimH(sx, sx + d, y + h + 26, `${spec.d} cm`)}
    ${dimV(x - 18, y, y + h, `${spec.h} cm`)}
    <text x="${x + w / 2}" y="${y + h + 48}" text-anchor="middle" class="ld-label">FRONT / 前幅</text>
    <text x="${sx + d / 2}" y="${y + h + 48}" text-anchor="middle" class="ld-label">SIDE / 侧面</text>
  </g>`;
}

function hardware(x, y) {
  return `<g class="hardware">
    <!-- puller -->
    <g transform="translate(${x} ${y})">
      <circle cx="0" cy="0" r="10" fill="none" stroke="#2a2b25" stroke-width="1.2" />
      <path d="${rr(-17, 8, 34, 112, 8)}" fill="#d9dadd" stroke="#2a2b25" stroke-width="1" />
      <path d="${rr(-10, 16, 20, 92, 5)}" fill="none" stroke="#85888c" stroke-width=".8" />
      <text x="0" y="60" text-anchor="middle" transform="rotate(-90 0 60)" class="puller-logo">i2GO</text>
      <line x1="-34" y1="8" x2="-34" y2="120" class="dim-line" />
      <text x="-40" y="68" text-anchor="middle" transform="rotate(-90 -40 68)" class="dim-text">3.1 cm</text>
      <line x1="-17" y1="134" x2="17" y2="134" class="dim-line" />
      <text x="0" y="148" text-anchor="middle" class="dim-text">0.9 cm</text>
      <text x="0" y="166" text-anchor="middle" class="hw-note">ZINC ALLOY / MATTE NICKEL</text>
      <text x="0" y="182" text-anchor="middle" class="hw-title">METAL PULLER</text>
    </g>
    <!-- red tab -->
    <g transform="translate(${x + 190} ${y})">
      <rect x="-9" y="10" width="18" height="112" rx="2" fill="#a53d31" stroke="#5c201b" stroke-width=".8" />
      <line x1="-22" y1="10" x2="-22" y2="122" class="dim-line" />
      <text x="-28" y="68" text-anchor="middle" transform="rotate(-90 -28 68)" class="dim-text">4.8 cm</text>
      <line x1="-9" y1="134" x2="9" y2="134" class="dim-line" />
      <text x="0" y="148" text-anchor="middle" class="dim-text">0.42 cm</text>
      <text x="0" y="166" text-anchor="middle" class="hw-note">PANTONE 1805 C (TBC)</text>
      <text x="0" y="182" text-anchor="middle" class="hw-title">RED PULL TAB</text>
    </g>
    <!-- logo -->
    <g transform="translate(${x + 370} ${y + 28})">
      <rect x="0" y="0" width="180" height="52" fill="none" stroke="#cfc8bb" stroke-width=".8" />
      <text x="90" y="36" text-anchor="middle" class="hw-logo">i2GO</text>
      <line x1="0" y1="68" x2="180" y2="68" class="dim-line" />
      <text x="90" y="82" text-anchor="middle" class="dim-text">5.8 cm</text>
      <line x1="196" y1="0" x2="196" y2="52" class="dim-line" />
      <text x="204" y="29" class="dim-text">1.75 cm</text>
      <text x="90" y="108" text-anchor="middle" class="hw-note">HEAT TRANSFER / TONAL</text>
      <text x="90" y="124" text-anchor="middle" class="hw-title">i2GO LOGO</text>
    </g>
  </g>`;
}

function seamDetail(x, y) {
  return `<g transform="translate(${x} ${y})">
    <text x="0" y="0" class="detail-head">SEAM SECTION / 缝份剖面</text>
    <rect x="0" y="12" width="150" height="9" fill="#e8e3d7" stroke="#2a2b25" stroke-width=".7" />
    <rect x="0" y="21" width="150" height="9" fill="#d8d1c2" stroke="#2a2b25" stroke-width=".7" />
    <rect x="0" y="30" width="150" height="9" fill="#e8e3d7" stroke="#2a2b25" stroke-width=".7" />
    <line x1="18" y1="7" x2="18" y2="43" stroke="#a53d31" stroke-width="1" />
    <line x1="27" y1="7" x2="27" y2="43" stroke="#a53d31" stroke-width="1" />
    <text x="42" y="54" class="detail-text">10 mm SA · 2 mm topstitch</text>
  </g>`;
}

function zipEnd(x, y) {
  return `<g transform="translate(${x} ${y})">
    <text x="0" y="0" class="detail-head">ZIP END / 拉链收口</text>
    <path d="M 0 18 H 120" stroke="#1e1f1c" stroke-width="7" />
    <path d="M 0 28 H 120" stroke="#1e1f1c" stroke-width="3" />
    <path d="M 46 10 L 56 36 M 56 10 L 46 36" stroke="#a53d31" stroke-width="1.2" />
    <path d="M 8 10 V 36 M 112 10 V 36" stroke="#a53d31" stroke-width="1.2" stroke-dasharray="3 2" />
    <text x="60" y="54" text-anchor="middle" class="detail-text">BOX-X BARTACK · 42 mm</text>
  </g>`;
}

export function buildInstructionSVG(spec, bom, sources = {}) {
  const color = COLORWAYS[spec.color] || COLORWAYS.graphite;
  const styleEn = {
    '城市通勤': 'COMMUTER',
    '轻量日用': 'LIGHT DAYPACK',
    '户外徒步': 'TRAIL',
  }[spec.style] || 'BACKPACK';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1414" width="2000" height="1414" role="img" aria-label="i2GO industrial instruction sheet">
    <defs>
      <style>
        text { font-family: "Helvetica Neue", "Arial", "PingFang SC", "Microsoft YaHei", sans-serif; fill: #25261f; }
        .hdr-white { fill: #fffdf8; }
        .hdr-title { font-size: 25px; font-weight: 700; letter-spacing: .18em; }
        .hdr-right { font-size: 10px; letter-spacing: .12em; fill: #fffdf8; }
        .subbar { font-size: 8px; letter-spacing: .1em; fill: #3f4636; }
        .bar-text { font-size: 12px; font-weight: 600; letter-spacing: .1em; fill: #fffdf8; }
        .bar-sub { font-size: 7px; letter-spacing: .08em; fill: #e9eddf; }
        .callout-title { font-size: 10px; font-weight: 600; letter-spacing: .02em; }
        .callout-sub { font-size: 7.5px; fill: #827a6c; }
        .card-label { font-size: 10px; font-weight: 600; }
        .card-sub { font-size: 7.5px; fill: #827a6c; }
        .spec-key { font-size: 7px; fill: #8a8274; letter-spacing: .08em; }
        .spec-val { font-size: 9px; fill: #33342c; }
        .spec-note { font-size: 6.8px; fill: #9a9283; }
        .dim line, .dim-line { stroke: #a53d31; stroke-width: .7; opacity: .75; }
        .dim text, .dim-text { font-size: 7px; fill: #8d392d; }
        .ld-logo { font-size: 8px; fill: #8b8477; letter-spacing: .1em; }
        .ld-label { font-size: 8px; fill: #6d665a; letter-spacing: .08em; }
        .detail-head { font-size: 8px; font-weight: 600; letter-spacing: .06em; fill: #4d493f; }
        .detail-text { font-size: 7px; fill: #7d7669; }
        .hw-title { font-size: 9px; font-weight: 600; letter-spacing: .07em; }
        .hw-note { font-size: 6.5px; fill: #8b8477; letter-spacing: .04em; }
        .puller-logo { font-size: 8px; letter-spacing: .14em; fill: #4f5154; }
        .hw-logo { font-size: 22px; font-weight: 700; letter-spacing: -.05em; }
        .img-missing { font-size: 8px; fill: #aaa294; }
        .foot { font-size: 8px; fill: #f4f3ea; letter-spacing: .08em; }
        .tiny { font-size: 6.5px; fill: #8b8477; }
      </style>
    </defs>
    <rect width="2000" height="1414" fill="#fffdf8" />
    <rect width="2000" height="72" fill="#7d8a63" />
    <text x="42" y="46" class="hdr-title hdr-white">INSTRUCTIONS</text>
    <text x="1958" y="30" text-anchor="end" class="hdr-right">${styleEn} BACKPACK / ${esc(spec.code)}</text>
    <text x="1958" y="48" text-anchor="end" class="hdr-right">REV A · 2026-11-09 · PAGE 1 / 2</text>
    <rect y="72" width="2000" height="30" fill="#eef1e6" />
    <text x="42" y="91" class="subbar">MAIN MATERIAL: ${esc(spec.material)} · SIZE: ${esc(specSummary(spec))} CM · COLOR: ${esc(color.name)} · HARDWARE: ${esc(spec.hardware)}</text>

    ${bar(40, 124, 1040, '01 / PRODUCT & CALLOUTS', '主视 / CALLOUTS')}
    ${image(sources, 'hero', 300, 168, 600, 740, { fit: 'meet' })}
    <text x="600" y="928" text-anchor="middle" class="tiny">3/4 FRONT RENDER · 产品主视 · RENDER REFERENCE / GRAPHITE · 生产色以确认色卡为准</text>

    ${callout(62, 330, 540, 410, '#5d5f62', ['600D NYLON', '石墨灰 / PANTONE 19-3906 TCX'], 'left')}
    ${callout(62, 500, 770, 470, '#44473d', ['3D AIR MESH', '透气背板 + 肩带贴合'], 'left')}
    ${callout(62, 760, 560, 805, '#9a9284', ['i2GO LOGO', '热转印 / 5.8 × 1.75 cm'], 'left')}
    ${callout(948, 240, 610, 220, '#1e1f1c', ['PADDED HANDLE', '织带 + 网布 + 泡棉'], 'right')}
    ${callout(948, 500, 660, 555, '#4b4e52', ['REVERSE ZIP', '#5 反穿 + 金属拉头'], 'right')}
    ${callout(948, 700, 642, 685, '#a53d31', ['RED ACCENT', 'PANTONE 1805 C (TBC)'], 'right')}

    ${bar(1120, 124, 840, '02 / MATERIALS & DETAILS', '材料与细节')}
    ${image(sources, 'zip', 1140, 168, 390, 205)}
    <text x="1140" y="390" class="card-label">REVERSE ZIP + METAL PULLER</text>
    <text x="1140" y="404" class="card-sub">#5 反穿 · 哑镍拉头 · 双拉头</text>
    ${image(sources, 'back', 1560, 168, 390, 205)}
    <text x="1560" y="390" class="card-label">3D AIR MESH + LUGGAGE STRAP</text>
    <text x="1560" y="404" class="card-sub">三通道泡棉 · 行李箱拉杆带</text>
    ${image(sources, 'handle', 1140, 456, 390, 205)}
    <text x="1140" y="678" class="card-label">PADDED HANDLE + MESH</text>
    <text x="1140" y="692" class="card-sub">4 层复合 · 网布贴合 · 加厚</text>
    ${image(sources, 'fabric', 1560, 456, 390, 205)}
    <text x="1560" y="678" class="card-label">NYLON 600D / GRAPHITE</text>
    <text x="1560" y="692" class="card-sub">主料 · 细纹 · 防泼水（待确认）</text>

    ${bar(1120, 720, 840, '03 / SPECIFICATION', '规格')}
    ${[
      ['MAIN MATERIAL', spec.material],
      ['LINING', spec.lining],
      ['SIZE', `${spec.w} × ${spec.h} × ${spec.d} cm`],
      ['HARDWARE', spec.hardware],
      ['ZIPPER', '#5 reverse coil'],
      ['SEAM / STITCH', '10 mm / 8–9 SPI'],
      ['COLOR', color.name],
      ['PANTONE', '19-3906 TCX (TBC)'],
    ].map(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 1140 + col * 410;
      const y = 782 + row * 33;
      return `<text x="${x}" y="${y}" class="spec-key">${esc(k)}</text>
        <text x="${x}" y="${y + 13}" class="spec-val">${esc(v)}</text>`;
    }).join('')}
    ${Object.entries(COLORWAYS).map(([k, c], i) => `<circle cx="${1148 + i * 34}" cy="912" r="9" fill="${c.swatch}" stroke="#2a2a24" stroke-width=".7" />`).join('')}
    <rect x="1290" y="903" width="18" height="18" rx="3" fill="#a53d31" stroke="#2a2a24" stroke-width=".7" />
    <text x="1316" y="916" class="spec-note">ACCENT RED / PANTONE 1805 C</text>

    ${bar(40, 966, 1040, '04 / DIMENSIONS & CONSTRUCTION', '尺寸与结构')}
    ${lineDrawing(spec)}
    ${seamDetail(470, 1070)}
    ${zipEnd(470, 1180)}
    <text x="700" y="1070" class="detail-head">CONSTRUCTION NOTES / 结构说明</text>
    ${[
      'SEAM ALLOWANCE 10 mm · STITCH 301 / 8–9 SPI',
      'TOPSTITCH 2 mm from fold · double row on straps',
      'MAIN ZIP #5 reverse coil · box-X both ends',
      'SHOULDER STRAP 8 mm EPE + 3D mesh · bartack',
      'HANDLE 4 layers · 42 mm bartack · reinforced',
      'INTERNAL SEAMS bound 20 mm · laptop sleeve 5 mm EPE',
    ].map((t, i) => `<text x="700" y="${1092 + i * 19}" class="detail-text">${esc(t)}</text>`).join('')}

    ${bar(1120, 966, 840, '05 / HARDWARE DETAILS', '五金细节')}
    ${hardware(1190, 1030)}
    <text x="1140" y="1308" class="tiny">Pullers and tabs are visual specs; confirm finish, logo method and dimensions with the hardware supplier.</text>

    <rect y="1360" width="2000" height="54" fill="#7d8a63" />
    <text x="42" y="1392" class="foot">i2GO · CONFIDENTIAL · INDUSTRIAL INSTRUCTION SHEET · NOT FOR PRODUCTION WITHOUT SIGN-OFF</text>
    <text x="1958" y="1392" text-anchor="end" class="foot">PATTERN / BOM / TECH PACK ISSUED SEPARATELY · PAGE 1/2</text>
  </svg>`;
}
