import { COLORWAYS } from './materials.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

export const PRESETS = {
  commuter: {
    key: 'commuter',
    code: 'CM-01',
    style: '城市通勤',
    name: '城市通勤双肩包',
    w: 32,
    h: 43,
    d: 18,
    frontPocket: true,
    laptop: true,
    sidePockets: false,
    luggage: true,
    sternum: true,
    sideHandle: true,
    color: 'graphite',
    material: 'NYLON 600D',
    lining: 'NYLON 210D',
    hardware: 'MATTE NICKEL',
  },
  slim: {
    key: 'slim',
    code: 'SL-02',
    style: '轻量日用',
    name: '轻量日用双肩包',
    w: 28,
    h: 39,
    d: 14,
    frontPocket: false,
    laptop: true,
    sidePockets: false,
    luggage: false,
    sternum: false,
    sideHandle: false,
    color: 'obsidian',
    material: 'NYLON 420D',
    lining: 'NYLON 210D',
    hardware: 'BLACK OXIDE',
  },
  trail: {
    key: 'trail',
    code: 'TR-03',
    style: '户外徒步',
    name: '轻量徒步背包',
    w: 30,
    h: 52,
    d: 22,
    frontPocket: true,
    laptop: false,
    sidePockets: true,
    luggage: false,
    sternum: true,
    sideHandle: true,
    color: 'olive',
    material: 'NYLON 600D RIPSTOP',
    lining: 'NYLON 210D',
    hardware: 'MATTE NICKEL',
  },
};

export const FEATURE_META = [
  { key: 'frontPocket', label: '前袋分区', note: '插袋 / 笔位 / 抓绒袋' },
  { key: 'laptop', label: '独立电脑仓', note: '15.6" / 泡棉围边' },
  { key: 'sidePockets', label: '侧袋', note: '水壶 / 雨具' },
  { key: 'luggage', label: '拉杆带', note: '行李箱叠放' },
  { key: 'sternum', label: '胸扣', note: '可调胸带' },
  { key: 'sideHandle', label: '侧提手', note: '单侧织带' },
];

export function specFromPreset(key = 'commuter') {
  return clone(PRESETS[key] || PRESETS.commuter);
}

export function parseBrief(input, fallback = PRESETS.commuter) {
  const text = String(input || '');
  const normalized = text.replace(/[×X*]/g, 'x');
  let spec = clone(fallback);
  const matched = [];
  const notes = [];

  if (/户外|登山|徒步|越野|露营|旅行/.test(text)) {
    spec = clone(PRESETS.trail);
    matched.push('户外模板');
  } else if (/轻量|简约|日用|通勤小包|极简/.test(text)) {
    spec = clone(PRESETS.slim);
    matched.push('轻量模板');
  } else if (/通勤|城市|商务|电脑包|办公/.test(text)) {
    spec = clone(PRESETS.commuter);
    matched.push('通勤模板');
  }

  const explicit = normalized.match(/高\s*(\d{2,3})\s*[^\d]{0,4}宽\s*(\d{2,3})\s*[^\d]{0,4}(?:厚|深)\s*(\d{1,2})/);
  if (explicit) {
    spec.h = Number(explicit[1]);
    spec.w = Number(explicit[2]);
    spec.d = Number(explicit[3]);
    matched.push(`尺寸 ${spec.w}×${spec.h}×${spec.d}`);
  } else {
    const m = normalized.match(/(\d{2,3})\s*x\s*(\d{2,3})\s*x\s*(\d{1,2})/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const c = Number(m[3]);
      if (a >= b) {
        spec.h = a;
        spec.w = b;
      } else {
        spec.w = a;
        spec.h = b;
      }
      spec.d = c;
      matched.push(`尺寸 ${spec.w}×${spec.h}×${spec.d}`);
    }
  }

  const setFeature = (key, label, on = true) => {
    spec[key] = on;
    matched.push(label);
  };
  if (/前袋|前仓|前口袋/.test(text)) setFeature('frontPocket', '前袋');
  if (/无前袋|不要前袋|光面/.test(text)) setFeature('frontPocket', '无前袋', false);
  if (/电脑仓|笔记本|电脑层|电脑隔层/.test(text)) setFeature('laptop', '电脑仓');
  if (/无电脑仓|不要电脑仓/.test(text)) setFeature('laptop', '无电脑仓', false);
  if (/侧袋|水壶|侧口袋/.test(text)) setFeature('sidePockets', '侧袋');
  if (/拉杆|行李箱|登机/.test(text)) setFeature('luggage', '拉杆带');
  if (/胸扣|胸带|胸带扣/.test(text)) setFeature('sternum', '胸扣');
  if (/无胸扣|不要胸扣/.test(text)) setFeature('sternum', '无胸扣', false);

  const colorMap = [
    [/石墨|深灰|灰色|灰/, 'graphite', '石墨灰'],
    [/曜石|纯黑|黑色|黑/, 'obsidian', '曜石黑'],
    [/苔原|军绿|橄榄|绿色|绿/, 'olive', '苔原绿'],
    [/砂岩|沙色|卡其|米色|米/, 'sand', '砂岩'],
  ];
  for (const [re, key, label] of colorMap) {
    if (re.test(text)) {
      spec.color = key;
      matched.push(label);
      break;
    }
  }

  if (/防水|防泼|IPX|抗菌|防盗|定位|太阳能/.test(text)) {
    notes.push('“防水 / 防盗 / 定位”等功能未在本次数字样中建模，需另做工艺确认。');
  }
  if (spec.w > 38 || spec.h > 56 || spec.d > 26) {
    notes.push('尺寸超出当前模板常规范围，已按比例预览；纸格需版师重新校样。');
  }

  spec.w = Math.min(40, Math.max(22, Math.round(spec.w)));
  spec.h = Math.min(60, Math.max(30, Math.round(spec.h)));
  spec.d = Math.min(28, Math.max(10, Math.round(spec.d)));
  spec.key = 'custom';
  spec.name = spec.style ? `${spec.style}双肩包` : '定制双肩包';
  spec.code = spec.key === 'custom' ? `CU-${String(spec.w).padStart(2, '0')}${String(spec.h).padStart(2, '0')}` : spec.code;

  return { spec, matched: [...new Set(matched)], notes };
}

export function specSummary(spec) {
  return `${spec.w} × ${spec.h} × ${spec.d} cm`;
}

export function buildBOM(spec) {
  const w = spec.w;
  const h = spec.h;
  const d = spec.d;
  const area = (2 * (w * h + d * h + w * d)) / 10000;
  const colorName = COLORWAYS[spec.color]?.name || '石墨灰';
  const rows = [
    {
      group: '面料',
      item: spec.material,
      spec: `${colorName} / 主料`,
      qty: (area * 1.18).toFixed(2),
      unit: 'm²',
      note: '按外形估算，含 15% 损耗',
    },
    {
      group: '面料',
      item: spec.lining,
      spec: '里布 / 深灰',
      qty: (area * 0.82).toFixed(2),
      unit: 'm²',
      note: '含前袋与电脑仓内衬',
    },
    {
      group: '辅料',
      item: 'EPE 泡棉',
      spec: '5 mm / 背板 + 肩带',
      qty: ((w * h * 0.45 + 2 * 5 * h) / 10000).toFixed(2),
      unit: 'm²',
      note: '电脑仓 8 mm 另计',
    },
    {
      group: '辅料',
      item: '织带',
      spec: '25 mm 黑色',
      qty: (spec.sternum ? 4.8 : 3.9).toFixed(1),
      unit: 'm',
      note: '肩带 / 提手 / 拉杆带',
    },
    {
      group: '辅料',
      item: '缝纫线',
      spec: '210D / 配色',
      qty: '120',
      unit: 'm',
      note: '按线迹估算',
    },
  ];

  const zippers = [
    { item: '主仓拉链', spec: `反穿 #5 / ${w + 10} cm`, qty: 1, unit: '条', note: '双拉头' },
  ];
  if (spec.frontPocket) zippers.push({ item: '前袋拉链', spec: `反穿 #5 / ${Math.round(h * 0.62)} cm`, qty: 1, unit: '条', note: '单拉头 + 红织带' });
  if (spec.laptop) zippers.push({ item: '电脑仓拉链', spec: `反穿 #5 / ${w + 6} cm`, qty: 1, unit: '条', note: '双拉头' });
  if (!spec.sidePockets) zippers.push({ item: '侧拉链', spec: `反穿 #3 / ${Math.round(h * 0.36)} cm`, qty: 1, unit: '条', note: '侧取物' });
  for (const z of zippers) rows.push({ group: '拉链', ...z });

  rows.push(
    { group: '五金', item: '金属拉头', spec: '哑镍 / i2GO 字标', qty: spec.laptop ? 6 : 4, unit: '个', note: '主仓 2 + 前袋 1 + 电脑仓 2 + 侧 1' },
    { group: '五金', item: '拉链滑块', spec: '#5 / 反穿', qty: spec.laptop ? 5 : 3, unit: '个', note: '与拉头配套' },
    { group: '五金', item: '肩带调节扣', spec: '25 mm 尼龙', qty: 2, unit: '个', note: '左右各一' },
    { group: '五金', item: 'D 环', spec: '哑镍 20 mm', qty: 2, unit: '个', note: '肩带上端' },
  );
  if (spec.sternum) rows.push({ group: '五金', item: '胸扣', spec: '25 mm 快拆', qty: 1, unit: '套', note: '可调胸带' });
  if (spec.luggage) rows.push({ group: '五金', item: '拉杆带', spec: '25 mm 织带 + 魔术贴', qty: 1, unit: '套', note: '背板横向' });
  if (spec.sidePockets) rows.push({ group: '辅料', item: '侧袋弹力布', spec: '2×2 弹力网', qty: 0.18, unit: 'm²', note: '左右各一' });

  return {
    rows,
    summary: {
      fabric: (area * 1.18).toFixed(2),
      lining: (area * 0.82).toFixed(2),
      zippers: zippers.length,
      hardware: spec.laptop ? 10 : 8,
      estimated: true,
    },
  };
}

export function bomCSV(bom, spec) {
  const head = ['款号', '款式', '成品尺寸', '分组', '物料', '规格', '用量', '单位', '备注'];
  const lines = [head.join(',')];
  for (const r of bom.rows) {
    lines.push([
      spec.code,
      spec.name,
      `${spec.w}x${spec.h}x${spec.d}`,
      r.group,
      r.item,
      r.spec,
      r.qty,
      r.unit,
      r.note,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }
  return '\ufeff' + lines.join('\r\n');
}
