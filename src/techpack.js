import { COLORWAYS } from './materials.js';
import { specSummary } from './spec.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const F = (n) => Math.round(n * 10) / 10;
const S = 6;

function rr(x, y, w, h, r = 8) {
  const rad = Math.min(r, w / 2, h / 2);
  return `M ${x + rad} ${y} H ${x + w - rad} Q ${x + w} ${y} ${x + w} ${y + rad} V ${y + h - rad} Q ${x + w} ${y + h} ${x + w - rad} ${y + h} H ${x + rad} Q ${x} ${y + h} ${x} ${y + h - rad} V ${y + rad} Q ${x} ${y} ${x + rad} ${y} Z`;
}

function balloon(x, y, n, color = '#a53d31') {
  return `<g><circle cx="${x}" cy="${y}" r="8.5" fill="${color}" /><text x="${x}" y="${y + 3}" text-anchor="middle" class="balloon-text">${n}</text></g>`;
}

function dimH(x1, x2, y, text) {
  const mid = (x1 + x2) / 2;
  const tw = Math.max(34, String(text).length * 7 + 12);
  return `<g class="dim">
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />
    <line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}" />
    <line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}" />
    <rect x="${mid - tw / 2}" y="${y - 15}" width="${tw}" height="13" fill="#f7f4eb" />
    <text x="${mid}" y="${y - 4}" text-anchor="middle">${esc(text)}</text>
  </g>`;
}

function dimV(x, y1, y2, text) {
  const mid = (y1 + y2) / 2;
  const tw = Math.max(34, String(text).length * 7 + 12);
  return `<g class="dim">
    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />
    <line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}" />
    <line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}" />
    <rect x="${x - 7}" y="${mid - tw / 2}" width="14" height="${tw}" fill="#f7f4eb" transform="rotate(-90 ${x} ${mid})" />
    <text x="${x}" y="${mid}" text-anchor="middle" transform="rotate(-90 ${x} ${mid})">${esc(text)}</text>
  </g>`;
}

function section(x, y, w, num, en, cn) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="3" fill="#7d8a63" />
    <text x="${x}" y="${y + 18}" class="section-num">${num}</text>
    <text x="${x + 30}" y="${y + 18}" class="section-title">${esc(en)}</text>
    <text x="${x + w}" y="${y + 18}" text-anchor="end" class="section-cn">${esc(cn)}</text>
  </g>`;
}

function flatFront(x, y, spec) {
  const w = spec.w * S;
  const h = spec.h * S;
  const cx = x + w / 2;
  const hasPocket = spec.frontPocket;
  return `<g class="flat">
    <path d="${rr(x, y, w, h, 18)}" fill="#e9e5da" stroke="#292a24" stroke-width="1.4" />
    <path d="${rr(x + 5, y + 5, w - 10, h - 10, 15)}" class="stitch" />
    <!-- handle -->
    <path d="M ${x + w * 0.3} ${y + 1} C ${x + w * 0.3} ${y - 26}, ${x + w * 0.7} ${y - 26}, ${x + w * 0.7} ${y + 1}" fill="none" stroke="#1f201c" stroke-width="7" stroke-linecap="round" />
    <path d="M ${x + w * 0.36} ${y - 2} C ${x + w * 0.36} ${y - 20}, ${x + w * 0.64} ${y - 20}, ${x + w * 0.64} ${y - 2}" fill="none" stroke="#f7f4eb" stroke-width="2" stroke-dasharray="3 3" />
    <!-- top zipper -->
    <line x1="${x + 16}" y1="${y + 17}" x2="${x + w - 16}" y2="${y + 17}" stroke="#1e1f1c" stroke-width="3" />
    <line x1="${x + 24}" y1="${y + 13.5}" x2="${x + w - 24}" y2="${y + 13.5}" class="stitch" />
    <rect x="${cx - 13}" y="${y + 12}" width="9" height="12" rx="2" fill="#c3c6c9" stroke="#5e6165" />
    <rect x="${cx + 4}" y="${y + 12}" width="9" height="12" rx="2" fill="#c3c6c9" stroke="#5e6165" />
    <path d="M ${cx - 8.5} ${y + 24} l -4 20" stroke="#c3c6c9" stroke-width="2.4" />
    <path d="M ${cx + 8.5} ${y + 24} l 4 20" stroke="#c3c6c9" stroke-width="2.4" />
    <!-- mesh wings -->
    <path d="M ${x + 8} ${y + 50} L ${x + 24} ${y + 62} L ${x + 24} ${y + h - 40} L ${x + 12} ${y + h - 28} Z" class="mesh" />
    <path d="M ${x + w - 8} ${y + 50} L ${x + w - 24} ${y + 62} L ${x + w - 24} ${y + h - 40} L ${x + w - 12} ${y + h - 28} Z" class="mesh" />
    <!-- front pocket -->
    ${hasPocket ? `
    <path d="${rr(x + 24, y + 48, w - 48, h - 100, 14)}" fill="#f3efe5" stroke="#292a24" stroke-width="1.1" />
    <path d="${rr(x + 31, y + 55, w - 62, h - 114, 11)}" class="stitch" />
    <line x1="${x + w - 42}" y1="${y + 93}" x2="${x + w - 42}" y2="${y + h - 45}" stroke="#1e1f1c" stroke-width="3.1" />
    <rect x="${x + w - 48}" y="${y + h * 0.55}" width="12" height="20" rx="2" fill="#c3c6c9" stroke="#5e6165" />
    <path d="M ${x + w - 42} ${y + h * 0.55 + 20} l -3 25" stroke="#c3c6c9" stroke-width="2.3" />
    <line x1="${x + w - 54}" y1="${y + h * 0.58}" x2="${x + w - 54}" y2="${y + h * 0.74}" stroke="#a53d31" stroke-width="4" />
    <rect x="${x + w - 49}" y="${y + h - 44}" width="14" height="20" rx="2" fill="#1e1f1c" />
    <text x="${cx}" y="${y + h - 26}" text-anchor="middle" class="logo-text">i2GO</text>
    ` : `<text x="${cx}" y="${y + h - 26}" text-anchor="middle" class="logo-text">i2GO</text>`}
    <!-- seams -->
    <path d="M ${x + 22} ${y + h - 40} L ${x + 40} ${y + h - 62}" class="stitch" />
    <path d="M ${x + w - 22} ${y + h - 40} L ${x + w - 40} ${y + h - 62}" class="stitch" />
    ${dimH(x, x + w, y + h + 34, `${spec.w} cm`)}
    ${dimV(x - 26, y, y + h, `${spec.h} cm`)}
    ${balloon(x + 10, y + 40, '01')}
    ${balloon(x + w * 0.58, y + 18, '02')}
    ${balloon(x + w * 0.53, y + 40, '03')}
    ${hasPocket ? balloon(x + 60, y + h * 0.56, '04') : ''}
    ${hasPocket ? balloon(x + w - 42, y + h * 0.66, '05') : ''}
    ${balloon(cx, y - 14, '06')}
    ${balloon(x + w - 18, y + h * 0.32, '07')}
    ${balloon(cx, y + h - 32, '08')}
    <text x="${cx}" y="${y + h + 66}" text-anchor="middle" class="view-label">FRONT / 前幅</text>
  </g>`;
}

function flatBack(x, y, spec) {
  const w = spec.w * S;
  const h = spec.h * S;
  const cx = x + w / 2;
  return `<g class="flat">
    <path d="${rr(x, y, w, h, 18)}" fill="#e9e5da" stroke="#292a24" stroke-width="1.4" />
    <path d="${rr(x + 5, y + 5, w - 10, h - 10, 15)}" class="stitch" />
    <path d="M ${x + w * 0.3} ${y + 1} C ${x + w * 0.3} ${y - 26}, ${x + w * 0.7} ${y - 26}, ${x + w * 0.7} ${y + 1}" fill="none" stroke="#1f201c" stroke-width="7" stroke-linecap="round" />
    <!-- back panel -->
    <path d="${rr(x + 14, y + 24, w - 28, h - 38, 13)}" fill="#f1ede3" stroke="#292a24" stroke-width="1.1" />
    <path d="${rr(x + 40, y + 46, w - 80, h - 90, 8)}" class="mesh" />
    <path d="M ${x + 40} ${y + h * 0.45} H ${x + w - 40} M ${x + 40} ${y + h * 0.62} H ${x + w - 40}" class="stitch" />
    <!-- shoulder straps -->
    <path d="M ${x + 42} ${y + 18} C ${x + 22} ${y + 90}, ${x + 18} ${y + h * 0.55}, ${x + 30} ${y + h - 18}" fill="none" stroke="#1d1e1b" stroke-width="17" stroke-linecap="round" />
    <path d="M ${x + w - 42} ${y + 18} C ${x + w - 22} ${y + 90}, ${x + w - 18} ${y + h * 0.55}, ${x + w - 30} ${y + h - 18}" fill="none" stroke="#1d1e1b" stroke-width="17" stroke-linecap="round" />
    <path d="M ${x + 42} ${y + 18} C ${x + 22} ${y + 90}, ${x + 18} ${y + h * 0.55}, ${x + 30} ${y + h - 18}" fill="none" stroke="#77786f" stroke-width="1" stroke-dasharray="4 4" />
    <path d="M ${x + w - 42} ${y + 18} C ${x + w - 22} ${y + 90}, ${x + w - 18} ${y + h * 0.55}, ${x + w - 30} ${y + h - 18}" fill="none" stroke="#77786f" stroke-width="1" stroke-dasharray="4 4" />
    ${spec.sternum ? `<line x1="${x + 45}" y1="${y + h * 0.56}" x2="${x + w - 45}" y2="${y + h * 0.56}" stroke="#1d1e1b" stroke-width="4" /><rect x="${cx - 10}" y="${y + h * 0.56 - 6}" width="20" height="12" rx="2" fill="#2d2e2a" stroke="#77786f" />` : ''}
    ${spec.luggage ? `<rect x="${cx - 58}" y="${y + h * 0.37}" width="116" height="9" fill="#1d1e1b" /><text x="${cx}" y="${y + h * 0.37 + 7}" text-anchor="middle" class="micro-text">LUGGAGE STRAP</text>` : ''}
    ${spec.laptop ? `<path d="M ${x + 28} ${y + 34} C ${x + w * 0.25} ${y + 20}, ${x + w * 0.75} ${y + 20}, ${x + w - 28} ${y + 34}" fill="none" stroke="#1e1f1c" stroke-width="3" /><rect x="${cx - 8}" y="${y + 24}" width="7" height="10" rx="1.5" fill="#c3c6c9" /><rect x="${cx + 1}" y="${y + 24}" width="7" height="10" rx="1.5" fill="#c3c6c9" />` : ''}
    ${dimH(x, x + w, y + h + 34, `${spec.w} cm`)}
    ${dimV(x - 26, y, y + h, `${spec.h} cm`)}
    ${balloon(x + 50, y + h * 0.28, '09')}
    ${spec.laptop ? balloon(cx + 18, y + 44, '10') : ''}
    ${spec.luggage ? balloon(cx + 48, y + h * 0.37 + 5, '11') : ''}
    ${spec.sternum ? balloon(cx + 18, y + h * 0.56, '12') : ''}
    <text x="${cx}" y="${y + h + 66}" text-anchor="middle" class="view-label">BACK / 背负</text>
  </g>`;
}

function flatSide(x, y, spec) {
  const w = spec.d * S;
  const h = spec.h * S;
  return `<g class="flat">
    <path d="${rr(x, y, w, h, 16)}" fill="#e9e5da" stroke="#292a24" stroke-width="1.4" />
    <path d="${rr(x + 4, y + 4, w - 8, h - 8, 13)}" class="stitch" />
    <path d="M ${x + w - 18} ${y + 20} C ${x + w - 4} ${y + 95}, ${x + w - 8} ${y + h * 0.58}, ${x + w - 22} ${y + h - 18}" fill="none" stroke="#1d1e1b" stroke-width="12" stroke-linecap="round" />
    <path d="${rr(x + 16, y + 60, w - 34, h - 120, 10)}" fill="#f1ede3" stroke="#292a24" stroke-width="1" />
    ${spec.sidePockets ? `<path d="M ${x + 6} ${y + h * 0.48} C ${x - 8} ${y + h * 0.55}, ${x - 8} ${y + h * 0.72}, ${x + 10} ${y + h * 0.76} L ${x + 22} ${y + h * 0.48} Z" class="mesh" />` : ''}
    ${!spec.sidePockets ? `<line x1="${x + w * 0.68}" y1="${y + 95}" x2="${x + w * 0.68}" y2="${y + h - 60}" stroke="#1e1f1c" stroke-width="3" /><rect x="${x + w * 0.68 - 4}" y="${y + h * 0.55}" width="10" height="18" rx="2" fill="#c3c6c9" stroke="#5e6165" />` : ''}
    ${spec.sideHandle ? `<path d="M ${x + w - 6} ${y + 52} C ${x + w + 12} ${y + 60}, ${x + w + 12} ${y + 92}, ${x + w - 6} ${y + 100}" fill="none" stroke="#1d1e1b" stroke-width="7" stroke-linecap="round" />` : ''}
    <path d="M ${x + 8} ${y + h - 20} H ${x + w - 8}" class="stitch" />
    ${dimH(x, x + w, y + h + 34, `${spec.d} cm`)}
    ${dimV(x - 26, y, y + h, `${spec.h} cm`)}
    ${balloon(x + w - 2, y + 80, '13')}
    ${!spec.sidePockets ? balloon(x + w * 0.68, y + h * 0.66, '14') : ''}
    ${spec.sidePockets ? balloon(x - 2, y + h * 0.63, '15') : ''}
    <text x="${x + w / 2}" y="${y + h + 66}" text-anchor="middle" class="view-label">SIDE / 侧面</text>
  </g>`;
}

function legend(x, y, spec) {
  const all = [
    ['01', '600D nylon shell / 主料'],
    ['02', '#5 reverse-coil zipper / 反装'],
    ['03', 'Metal puller / 金属拉头'],
    ['04', 'Front pocket organizer / 前袋分区'],
    ['05', 'Red webbing tab / 红色织带'],
    ['06', 'Padded top handle / 加厚提手'],
    ['07', 'Front mesh wing / 前侧网布'],
    ['08', 'i2GO logo / 字标'],
    ['09', '3D air-mesh back / 透气背板'],
    ['10', 'Laptop sleeve / 电脑仓'],
    ['11', 'Luggage strap / 拉杆带'],
    ['12', 'Sternum strap / 胸扣'],
    ['13', 'Side handle / 侧提手'],
    ['14', 'Side zip / 侧拉链'],
    ['15', 'Bottle pocket / 侧袋'],
  ];
  const visible = all.filter(([n]) => {
    if (n === '04' || n === '05') return spec.frontPocket;
    if (n === '10') return spec.laptop;
    if (n === '11') return spec.luggage;
    if (n === '12') return spec.sternum;
    if (n === '14') return !spec.sidePockets;
    if (n === '15') return spec.sidePockets;
    if (n === '13') return spec.sideHandle;
    return true;
  });
  const cols = 3;
  const colW = 360;
  return `<g class="legend">
    <text x="${x}" y="${y}" class="legend-title">CALLOUT LEGEND / 部件编号</text>
    ${visible.map(([n, label], i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const xx = x + c * colW;
      const yy = y + 24 + r * 22;
      return `<circle cx="${xx + 7}" cy="${yy - 3}" r="7" fill="#a53d31" />
        <text x="${xx + 7}" y="${yy}" text-anchor="middle" class="legend-num">${n}</text>
        <text x="${xx + 20}" y="${yy}" class="legend-text">${esc(label)}</text>`;
    }).join('')}
  </g>`;
}

function materialTable(spec) {
  const color = COLORWAYS[spec.color] || COLORWAYS.graphite;
  const pantone = {
    graphite: '19-3906 TCX',
    obsidian: '19-4005 TCX',
    olive: '18-0625 TCX',
    sand: '15-1116 TCX',
  }[spec.color] || 'TBC';
  const rows = [
    ['SHELL', spec.material, `${color.name} / ${pantone}`, '主料 · 客户确认色卡'],
    ['LINING', spec.lining, '深灰 / 19-3903', '内里 · 不褪色'],
    ['FOAM', 'EPE 5 mm', '—', '背板 / 肩带 / 电脑仓 8 mm'],
    ['MESH', '3D air mesh', '黑 / 19-4005', '背板 + 肩带贴合'],
    ['WEBBING', 'PP 25 mm', '黑 / 19-4005', '肩带 / 提手 / 拉杆带'],
    ['ZIPPER', '#5 reverse coil', '黑 / 19-4005', '主仓 / 前袋 / 电脑仓'],
    ['PULLER', 'Zinc alloy', spec.hardware, '哑镍 / 字标'],
    ['THREAD', '210D bonded', '配色', '301 stitch / 8–9 SPI'],
  ];
  return `<g>
    <text x="1260" y="150" class="table-head">ITEM</text>
    <text x="1372" y="150" class="table-head">SPECIFICATION</text>
    <text x="1630" y="150" class="table-head">COLOR / PANTONE</text>
    <text x="1810" y="150" class="table-head">NOTE</text>
    <line x1="1260" y1="156" x2="1940" y2="156" class="rule" />
    ${rows.map(([a, b, c, d], i) => {
      const y = 174 + i * 25;
      return `<text x="1260" y="${y}" class="cell-key">${esc(a)}</text>
      <text x="1372" y="${y}" class="cell">${esc(b)}</text>
      <text x="1630" y="${y}" class="cell">${esc(c)}</text>
      <text x="1810" y="${y}" class="cell-muted">${esc(d)}</text>
      <line x1="1260" y1="${y + 7}" x2="1940" y2="${y + 7}" class="rule-soft" />`;
    }).join('')}
    <text x="1260" y="390" class="tiny">COLOR CHIPS</text>
    ${Object.entries(COLORWAYS).map(([k, c], i) => `<circle cx="${1282 + i * 34}" cy="414" r="10" fill="${c.swatch}" stroke="#2a2a24" stroke-width=".8" /><text x="${1282 + i * 34}" y="434" text-anchor="middle" class="tiny">${esc(c.english)}</text>`).join('')}
    <rect x="1430" y="402" width="18" height="18" rx="3" fill="#a53d31" />
    <text x="1456" y="415" class="tiny">ACCENT RED / PANTONE 1805 C</text>
    <text x="1260" y="452" class="tiny">Pantone references are indicative — confirm against physical swatches before bulk.</text>
  </g>`;
}

function construction() {
  const notes = [
    'SEAM ALLOWANCE 10 mm. STITCH 301, 8–9 SPI, 210D bonded thread.',
    'TOPSTITCH 2 mm from fold, 2 rows on shoulder straps and handle.',
    'MAIN ZIP #5 reverse coil, double sliders, box-X at both ends.',
    'FRONT POCKET ZIP #5, metal puller, red webbing pull tab.',
    'SHOULDER STRAP 8 mm EPE + 3D mesh, double-needle, bartack at anchors.',
    'HANDLE 4 layers: 600D + EPE + webbing + mesh; 42 mm bartack.',
    'INTERNAL SEAMS bound 20 mm; laptop sleeve 5 mm EPE + elastic.',
    'BOTTOM double-layer 600D, perimeter topstitch, reinforced corners.',
  ];
  return `<g>
    ${notes.map((n, i) => `<text x="1260" y="${520 + i * 25}" class="note-line">${esc(n)}</text>`).join('')}
    <g transform="translate(1610 690)">
      <text x="0" y="0" class="tiny">SEAM SECTION / 缝份剖面</text>
      <rect x="0" y="10" width="150" height="8" fill="#ddd7c9" stroke="#2a2a24" stroke-width=".8" />
      <rect x="0" y="18" width="150" height="8" fill="#cfc8b8" stroke="#2a2a24" stroke-width=".8" />
      <rect x="0" y="26" width="150" height="8" fill="#ddd7c9" stroke="#2a2a24" stroke-width=".8" />
      <line x1="18" y1="6" x2="18" y2="38" stroke="#a53d31" stroke-width="1.2" />
      <line x1="26" y1="6" x2="26" y2="38" stroke="#a53d31" stroke-width="1.2" />
      <text x="42" y="48" class="tiny">10 mm SA · 2 mm topstitch</text>
    </g>
  </g>`;
}

function bomTable(bom) {
  const rows = bom.rows.slice(0, 9);
  return `<g>
    <text x="1260" y="850" class="table-head">#</text>
    <text x="1284" y="850" class="table-head">MATERIAL</text>
    <text x="1480" y="850" class="table-head">SPEC</text>
    <text x="1800" y="850" class="table-head">QTY</text>
    <text x="1880" y="850" class="table-head">UNIT</text>
    <line x1="1260" y1="858" x2="1940" y2="858" class="rule" />
    ${rows.map((r, i) => {
      const y = 878 + i * 28;
      return `<text x="1260" y="${y}" class="cell-key">${String(i + 1).padStart(2, '0')}</text>
      <text x="1284" y="${y}" class="cell">${esc(r.item)}</text>
      <text x="1480" y="${y}" class="cell-muted">${esc(r.spec)}</text>
      <text x="1830" y="${y}" text-anchor="end" class="cell">${esc(r.qty)}</text>
      <text x="1880" y="${y}" class="cell-muted">${esc(r.unit)}</text>
      <line x1="1260" y1="${y + 8}" x2="1940" y2="${y + 8}" class="rule-soft" />`;
    }).join('')}
    <text x="1260" y="1160" class="tiny">Estimated from envelope; excludes waste, labor and tooling. Not a quotation.</text>
    <text x="1260" y="1180" class="tiny">FABRIC ${esc(bom.summary.fabric)} m² · LINING ${esc(bom.summary.lining)} m² · ${bom.summary.zippers} ZIPPERS</text>
  </g>`;
}

function qcBlock(spec) {
  const checks = [
    'Finished size within ±5 mm of spec; front/back symmetric.',
    'Zipper pull force 5–15 N; no snag; sliders meet at centre.',
    'Shoulder strap anchor pull ≥ 400 N; bartacks intact.',
    'Handle anchor pull ≥ 500 N; no stitch failure.',
    'No needle holes, skipped stitches, thread tails or glue stains.',
    'Color match to approved swatch under D65; no shading across panels.',
    'Metal hardware free of scratches, sharp edges and color variance.',
    'Laptop sleeve depth and elastic tension fit 15.6" dummy.',
  ];
  return `<g>
    ${checks.map((c, i) => {
      const y = 900 + i * 26;
      return `<rect x="70" y="${y - 9}" width="9" height="9" fill="none" stroke="#2a2a24" stroke-width=".9" />
      <text x="86" y="${y}" class="check-text">${esc(c)}</text>`;
    }).join('')}
    <text x="70" y="1128" class="table-head">PACKING</text>
    <text x="70" y="1148" class="check-text">Polybag + desiccant · hangtag · SKU sticker · 10 pcs / carton · carton mark per buyer.</text>
    <text x="70" y="1166" class="check-text">Tolerance: ±5 mm · Color: D65 · Zipper: 5–15 N · Hardware: matte nickel.</text>
  </g>`;
}

function patternSummary(spec) {
  const rows = [
    ['Front panel / 前幅', 1, spec.material],
    ['Back panel / 后幅', 1, spec.material],
    ['Gusset / 侧围', 2, spec.material],
    ['Bottom / 底幅', 1, spec.material],
    ['Front pocket / 前袋', spec.frontPocket ? 1 : 0, spec.material],
    ['Laptop sleeve / 电脑仓', spec.laptop ? 1 : 0, spec.lining],
    ['Shoulder strap / 肩带', 2, 'EPE + mesh'],
    ['Handle / 提手', 1, 'webbing + mesh'],
    ['Zip tape / 拉链带', 1, 'reverse coil'],
  ];
  return `<g>
    <text x="640" y="900" class="table-head">PIECE</text>
    <text x="900" y="900" class="table-head">CUT</text>
    <text x="950" y="900" class="table-head">MATERIAL</text>
    <text x="1160" y="900" class="table-head">SA</text>
    <line x1="640" y1="908" x2="1200" y2="908" class="rule" />
    ${rows.map(([a, b, c], i) => {
      const y = 928 + i * 22;
      return `<text x="640" y="${y}" class="cell">${esc(a)}</text>
      <text x="908" y="${y}" class="cell-key">${b}</text>
      <text x="950" y="${y}" class="cell-muted">${esc(c)}</text>
      <text x="1160" y="${y}" class="cell-key">10 mm</text>
      <line x1="640" y1="${y + 7}" x2="1200" y2="${y + 7}" class="rule-soft" />`;
    }).join('')}
    <text x="640" y="1148" class="tiny">Pattern map is issued separately. This sheet is not a cutting pattern.</text>
  </g>`;
}

function signoff() {
  const labels = ['DESIGN', 'PATTERN', 'MERCH', 'BUYER', 'DATE'];
  return `<g>
    <text x="70" y="1190" class="section-title">SIGN-OFF</text>
    ${labels.map((l, i) => {
      const x = 70 + i * 225;
      return `<rect x="${x}" y="1210" width="205" height="54" fill="none" stroke="#2a2a24" stroke-width=".8" />
      <text x="${x + 8}" y="1230" class="tiny">${l}</text>
      <line x1="${x + 8}" y1="1254" x2="${x + 197}" y2="1254" class="rule-soft" />`;
    }).join('')}
  </g>`;
}

export function buildTechPackSVG(spec, bom, { page = '2/2' } = {}) {
  const color = COLORWAYS[spec.color] || COLORWAYS.graphite;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1414" width="2000" height="1414" role="img" aria-label="i2GO industrial tech pack">
    <defs>
      <pattern id="meshHatch" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M 0 6 L 6 0 M -2 2 L 2 -2 M 4 8 L 8 4" stroke="#6d6a60" stroke-width=".7" opacity=".55" />
      </pattern>
      <style>
        text { font-family: "Cascadia Mono", "SFMono-Regular", Consolas, "Microsoft YaHei", monospace; fill: #2a2b25; }
        .header-brand { font-size: 30px; font-weight: 700; letter-spacing: -.06em; }
        .header-title { font-size: 15px; letter-spacing: .14em; }
        .header-meta { font-size: 8px; fill: #7d7669; letter-spacing: .06em; }
        .section-num { font-size: 13px; fill: #a53d31; font-weight: 600; }
        .section-title { font-size: 12px; letter-spacing: .1em; font-weight: 600; }
        .section-cn { font-size: 8px; fill: #7d7669; letter-spacing: .08em; }
        .view-label { font-size: 9px; fill: #4f4b42; letter-spacing: .1em; }
        .flat path, .flat line, .flat rect { stroke-linejoin: round; }
        .stitch { fill: none; stroke: #8b8477; stroke-width: .8; stroke-dasharray: 5 4; }
        .mesh { fill: url(#meshHatch); stroke: #33342d; stroke-width: .8; }
        .logo-text { font-size: 9px; fill: #8b8477; letter-spacing: .12em; }
        .balloon-text { font-size: 7.5px; fill: #fbf8f0; }
        .dim line { stroke: #a53d31; stroke-width: .7; opacity: .7; }
        .dim text { font-size: 7px; fill: #8d392d; }
        .legend-title { font-size: 8px; fill: #6b655a; letter-spacing: .1em; }
        .legend-num { font-size: 6.5px; fill: #fbf8f0; }
        .legend-text { font-size: 7px; fill: #5f5a50; }
        .table-head { font-size: 7px; fill: #7d7669; letter-spacing: .08em; }
        .cell { font-size: 8px; fill: #37372f; }
        .cell-key { font-size: 7.5px; fill: #5b564c; letter-spacing: .02em; }
        .cell-muted { font-size: 7.5px; fill: #8b8477; }
        .tiny { font-size: 6.5px; fill: #948c7e; letter-spacing: .02em; }
        .micro-text { font-size: 5.5px; fill: #f7f4eb; letter-spacing: .08em; }
        .note-line { font-size: 7.5px; fill: #4f4b42; }
        .check-text { font-size: 7.5px; fill: #4f4b42; }
        .rule { stroke: #c9c2b4; stroke-width: .8; }
        .rule-soft { stroke: #e2dccf; stroke-width: .6; }
        .stamp { font-size: 12px; fill: #a53d31; font-weight: 600; letter-spacing: .14em; }
      </style>
    </defs>
    <rect width="2000" height="1414" fill="#f7f4eb" />
    <rect width="2000" height="8" fill="#7d8a63" />
    <text x="54" y="54" class="header-brand">i2GO</text>
    <text x="154" y="51" class="header-title">INDUSTRIAL TECH PACK / 工业工艺单</text>
    <text x="154" y="66" class="header-meta">COMMUTER BACKPACK · REV A · 1:6 · UNIT CM</text>
    <text x="1946" y="38" text-anchor="end" class="header-meta">MODEL ${esc(spec.code)} / ${esc(specSummary(spec))} CM</text>
    <text x="1946" y="54" text-anchor="end" class="header-meta">SHELL ${esc(color.english)} · ${esc(spec.material)}</text>
    <text x="1946" y="70" text-anchor="end" class="header-meta">DATE 2026-11-09 · PAGE ${esc(page)} · CONFIDENTIAL</text>
    <line x1="54" y1="86" x2="1946" y2="86" class="rule" />

    ${section(54, 110, 1170, '01', 'TECHNICAL FLATS', '结构图 / 三视图')}
    ${flatFront(110, 190, spec)}
    ${flatBack(390, 190, spec)}
    ${flatSide(680, 190, spec)}
    ${legend(80, 548, spec)}

    ${section(1250, 110, 700, '02', 'MATERIALS & COLORS', '物料与配色')}
    ${materialTable(spec)}

    ${section(1250, 480, 700, '03', 'CONSTRUCTION', '结构与车缝')}
    ${construction()}

    ${section(1250, 810, 700, '04', 'BILL OF MATERIALS', '物料清单')}
    ${bomTable(bom)}

    ${section(54, 780, 1170, '05', 'QC & PACKING', '质检 / 包装')}
    ${qcBlock(spec)}
    ${patternSummary(spec)}
    ${signoff()}

    <g transform="rotate(-6 1700 1280)">
      <rect x="1540" y="1240" width="360" height="62" fill="none" stroke="#a53d31" stroke-width="1.4" />
      <text x="1720" y="1262" text-anchor="middle" class="stamp">INDUSTRIAL REV A</text>
      <text x="1720" y="1282" text-anchor="middle" class="tiny">NOT FOR PRODUCTION WITHOUT SIGN-OFF</text>
    </g>

    <line x1="54" y1="1360" x2="1946" y2="1360" class="rule" />
    <text x="54" y="1382" class="tiny">i2GO · CONFIDENTIAL · THIS SHEET IS A VISUAL / STRUCTURAL SPEC, NOT A CUTTING PATTERN.</text>
    <text x="1946" y="1382" text-anchor="end" class="tiny">PATTERN MAP ISSUED SEPARATELY · PANTONE TBC · 2026-11-09 · PAGE ${esc(page)}</text>
  </svg>`;
}
