// Queen Elizabeth Stadium (伊利沙伯體育館) — modelled from the five official
// LCSD seating plans in misc/qes (central_stage_layout.pdf,
// end_stage_layout.pdf, 3_side_end_stage_layout.pdf, boxing_ring_layout.pdf,
// central_court_layout.pdf).  The plans are pure-vector drawings with all text
// converted to outlines, so the seat rectangles, section dividers, row bands
// and printed seat numbers were recovered geometrically and by OCR, then
// reconciled against the section totals printed on each plan.
//
// The stadium seats surround a rectangular arena on four raked stands spread
// over three levels:
//   · 3/F (ground) — the arena floor plus the low north/south rows C-G
//   · 4/F          — north/south rows H-L and east/west rows F-L
//   · 5/F          — north/south rows M-P and east/west rows M-U
// Eight numbered stand sections wrap the arena (page placement: 6 = NW,
// 7 = NE, 3 = SW, 2 = SE, 5 = W-north, 4 = W-south, 8 = E-north, 1 = E-south).
// The arena floor carries sections 9 (south half) and 10 (north half) whenever
// a layout uses floor seating.
import * as THREE from 'three';
import { addGround, addOutline, createSeatInstances, labelTexture } from '../scene.js';

const QES_LABEL = {
  font: '800 70px system-ui',
  subFont: '600 36px system-ui',
  subColor: '#c8d4e8',
  textY: 104,
  subY: 170,
};

// ---------------------------------------------------------------------------
// Stand sections.  Totals are read directly off the plans and are identical in
// every layout that keeps the section open.  `stand` is the physical side;
// `sideIndex` indexes the four legend gates below.  Sections 1/4/5/8 each hide
// a 10-seat wheelchair platform (5 wheelchair + 5 minder) inside their total
// that is drawn as a platform slab rather than individual seats, so the
// per-row seat specs below sum to `total - platform`.
// ---------------------------------------------------------------------------
export const QES_STAND_SECTIONS = [
  { id: 1, total: 413, stand: 'east',  sideIndex: 1, platform: '1W' },
  { id: 2, total: 345, stand: 'south', sideIndex: 2, platform: null },
  { id: 3, total: 337, stand: 'south', sideIndex: 2, platform: null },
  { id: 4, total: 396, stand: 'west',  sideIndex: 3, platform: '4W' },
  { id: 5, total: 389, stand: 'west',  sideIndex: 3, platform: '5W' },
  { id: 6, total: 325, stand: 'north', sideIndex: 0, platform: null },
  { id: 7, total: 274, stand: 'north', sideIndex: 0, platform: null },
  { id: 8, total: 413, stand: 'east',  sideIndex: 1, platform: '8W' },
];

// Compact per-section seat data.  `|` separates physically-separate blocks
// (aisle gaps); `,` separates seat-number skips *within* one contiguous block;
// `a-b` is an inclusive range.  Row keys are letter ranges (`G-L`) or comma
// groups (`P,Q`) expanded by expandRows().
const STAND_ROWS_RAW = {
  1: [
    ['F', '29-33 | 36-47'], ['G-L', '22-33 | 36-47'],
    ['M', '3-10 | 14-17 | 20-26 | 32-34 | 37-47'],
    ['N', '5-12 | 14-17 | 20-26 | 32-34 | 37-47'],
    ['O', '6-12 | 13-17 | 20-26 | 32-34 | 37-47'],
    ['P-S', '14-17 | 20-34 | 37-47'],
    ['T', '28-34 | 37-39 | 43-47'], ['U', '37-39 | 43-47'],
  ],
  2: [
    ['C', '30-32,34-35 | 37-39,41-43 | 48-57'],
    ['D-G', '30-32,34-35 | 37-39,41-43 | 48-60'],
    ['H-L', '38-51 | 54-67'],
    ['M', '45-56 | 59-69 | 72'], ['N', '45-56 | 59-68'], ['O', '45-56 | 59-67'],
    ['P', '42-47 | 50-55 | 58-63 | 65-67'],
  ],
  3: [
    ['C-G', '13-25'], ['H-L', '6-19 | 22-35'],
    ['M', '1 | 4-14 | 17-28 | 31-42'], ['N', '5-14 | 17-28 | 31-42'],
    ['O', '6-14 | 17-28 | 31-42'],
    ['P', '6-8 | 10-15 | 18-23 | 26-31 | 33-40'],
  ],
  4: [
    ['F', '51-62 | 65-69'], ['G-L', '51-62 | 65-76'],
    ['M', '51-61 | 64-66 | 72-78 | 81-84 | 86-93'],
    ['N', '51-61 | 64-66 | 72-78 | 81-84 | 87-91'],
    ['O', '51-61 | 64-66 | 72-78 | 81 | 86-89'],
    ['P,Q', '51-61 | 64-78 | 81'], ['R,S', '51-61 | 64-78 | 81-82'],
    ['T', '51-55 | 59-61 | 64-70'], ['U', '51-55 | 59-61 | 64-66'],
  ],
  5: [
    ['F', '30-34 | 37-48'], ['G-L', '23-34 | 37-48'],
    ['M', '6-13 | 15-18 | 21-27 | 33-35 | 38-48'],
    ['N', '8-12 | 15-18 | 21-27 | 33-35 | 38-48'],
    ['O', '10-13 | 21-27 | 33-35 | 38-48'],
    ['P-S', '21-35 | 38-48'],
    ['T', '29-35 | 38-40 | 44-48'], ['U', '33-35 | 38-40 | 44-48'],
  ],
  6: [
    ['C-G', '30-32,34-35 | 37-39,41-43 | 48-60'], ['H-L', '38-51 | 54-67'],
    ['M,N', '48-51 | 54-64 | 67-72'], ['O', '47-55 | 58-71'],
  ],
  7: [
    ['C', '16-25'], ['D-G', '13-25'], ['H-L', '6-19 | 22-35'],
    ['M', '1-7 | 16-22 | 25-34 | 37-41'], ['N', '16-22 | 25-34 | 37-41'],
    ['O', '18-31 | 33-39'],
  ],
  8: [
    ['F', '50-61 | 64-68'], ['G-L', '50-61 | 64-75'],
    ['M', '50-60 | 63-65 | 71-77 | 80-83 | 87-94'],
    ['N', '50-60 | 63-65 | 71-77 | 80-84 | 86-92'],
    ['O', '50-60 | 63-65 | 71-77 | 80-84 | 85-91'],
    ['P-S', '50-60 | 63-77 | 80-83'],
    ['T', '50-54 | 58-60 | 63-69'], ['U', '50-54 | 58-60'],
  ],
};

/* Expand a row-letter key such as 'G-L' or 'P,Q' into individual letters. */
export function expandRows(key) {
  const out = [];
  for (const part of key.split(',')) {
    if (part.includes('-')) {
      const a = part.charCodeAt(0), b = part.charCodeAt(part.length - 1);
      for (let c = a; c <= b; c++) out.push(String.fromCharCode(c));
    } else {
      out.push(part);
    }
  }
  return out;
}

/* QES_STAND_ROWS[section][rowLetter] = compact seat spec string. */
export const QES_STAND_ROWS = (() => {
  const map = {};
  for (const [sec, rows] of Object.entries(STAND_ROWS_RAW)) {
    map[sec] = {};
    for (const [key, spec] of rows) {
      for (const row of expandRows(key)) map[sec][row] = spec;
    }
  }
  return map;
})();

/* Parse "a-b" / "a" (ascending or descending) into an array of seat numbers. */
function parseRange(token) {
  const parts = token.split('-');
  if (parts.length === 1) return [Number(parts[0])];
  const a = Number(parts[0]), b = Number(parts[1]);
  const step = a <= b ? 1 : -1, out = [];
  for (let n = a; ; n += step) { out.push(n); if (n === b) break; }
  return out;
}

/* Parse a seat spec into an array of physical blocks, each an array of seat
   numbers.  `|` = new physical block; `,` = number skip within a block. */
export function parseSeatSpec(spec) {
  return spec.split('|').map((block) =>
    block.trim().split(',').flatMap((tok) => parseRange(tok.trim())));
}

/* Number of drawn seats a row spec contains. */
export function standRowSeatCount(spec) {
  return parseSeatSpec(spec).reduce((sum, block) => sum + block.length, 0);
}

// ---------------------------------------------------------------------------
// Floor level (3/F / 4/F / 5/F) for a stand section + row.  North/south stands
// gain a 3/F ground tier (rows C-G); east/west stands start at 4/F (row F).
// ---------------------------------------------------------------------------
const NS_SECTIONS = [2, 3, 6, 7];

export function tierOf(section, row) {
  const c = row.charCodeAt(0) - 64; // A = 1
  if (NS_SECTIONS.includes(section)) {
    if (c <= 7) return '3/F';   // C-G
    if (c <= 12) return '4/F';  // H-L
    return '5/F';               // M-P
  }
  if (c <= 12) return '4/F';    // F-L
  return '5/F';                 // M-U
}

// ---------------------------------------------------------------------------
// Layouts.  Floor holds the arena sections 9/10 published totals (including
// their arena-floor wheelchair zones); closedStands lists stand sections hidden
// behind an end stage.  Wheelchair platforms are the E/W stand slabs.
// ---------------------------------------------------------------------------
export const QES_LAYOUTS = [
  {
    id: 'end-stage', label: 'End Stage', zh: '正面舞台',
    closedStands: [], floor: { 9: 308, 10: 302 },
    platforms: ['1W', '4W', '5W', '8W'], floorZones: ['10W'], stage: 'west',
  },
  {
    id: '3-side-end-stage', label: '3-Side End Stage', zh: '三面舞台',
    closedStands: [4, 5], floor: { 9: 302, 10: 302 },
    platforms: ['1W', '8W'], floorZones: ['9W', '10W'], stage: 'west',
  },
  {
    id: 'central-stage', label: 'Central Stage', zh: '中央舞台',
    closedStands: [], floor: { 9: 320, 10: 314 },
    platforms: ['1W', '4W', '5W', '8W'], floorZones: ['10W'], stage: 'center',
  },
  {
    id: 'boxing-ring', label: 'Boxing Ring', zh: '擂台',
    closedStands: [], floor: { 9: 240, 10: 222 },
    platforms: ['1W', '4W', '5W', '8W'], floorZones: ['10W'], stage: 'ring',
  },
  {
    id: 'central-court', label: 'Central Court', zh: '中央場地',
    closedStands: [], floor: {},
    platforms: ['1W', '4W', '5W', '8W'], floorZones: [], stage: 'center',
  },
];

/* Resolve a layout id, falling back to the default end-stage plan. */
export function qesLayout(id) {
  return QES_LAYOUTS.find((l) => l.id === id) || QES_LAYOUTS[0];
}

/* Total modelled seats for a layout: open stand totals + floor section totals. */
export function layoutSeatTotal(id) {
  const layout = qesLayout(id);
  let total = 0;
  for (const s of QES_STAND_SECTIONS) {
    if (!layout.closedStands.includes(s.id)) total += s.total;
  }
  for (const t of Object.values(layout.floor)) total += t;
  return total;
}

// ---------------------------------------------------------------------------
// Geometry mapping.  Plan coordinates are A3 points; the arena centre sits at
// (481.85, 389.70).  Seat numbers map to the along-row axis by the linear fits
// recovered from the plan; row bands give the perpendicular (depth) position.
// ---------------------------------------------------------------------------
const PDF_CX = 481.85, PDF_CY = 389.70;
const SCALE = 0.06; // points → world units
const toX = (px) => (px - PDF_CX) * SCALE;
const toZ = (py) => (py - PDF_CY) * SCALE;

// Along-row seat-number → plan-coordinate fits (central-stage extraction).
const SEAT_FIT = {
  north: (n) => -6.8506 * n + 735.95, // → plan x
  south: (n) => 7.0420 * n + 227.81,  // → plan x
  west: (n) => 6.7733 * n + 47.46,    // → plan y
  east: (n) => -6.7699 * n + 710.88,  // → plan y
};

// Perpendicular row-band plan coordinate (arena-side row first).
const WEST_BANDS = {
  U: 42, T: 54, S: 64, R: 76, Q: 88, P: 100, O: 110, N: 122, M: 134,
  L: 162, K: 174, J: 186, I: 196, H: 208, G: 220, F: 230,
};
const ROW_BANDS = {
  west: WEST_BANDS,
  east: Object.fromEntries(Object.entries(WEST_BANDS).map(([r, v]) => [r, 964 - v])),
  north: {
    O: 64, N: 76, M: 86, L: 120, K: 132, J: 142, I: 154, H: 166,
    G: 190, F: 200, E: 212, D: 224, C: 234,
  },
  south: {
    C: 538, D: 550, E: 560, F: 572, G: 584, H: 606, I: 618, J: 630,
    K: 640, L: 652, M: 682, N: 692, O: 704, P: 716,
  },
};

/* Raked seat height: rows step up away from the arena, with a jump at each
   floor-level boundary so the three tiers read as separate decks. */
function rowHeight(section, row) {
  const c = row.charCodeAt(0) - 64;
  const idx = NS_SECTIONS.includes(section) ? c - 3 : c - 6; // 0 at arena row
  const tier = tierOf(section, row);
  const off = tier === '3/F' ? 0 : tier === '4/F' ? 2.6 : 5.2;
  return 1.0 + idx * 0.34 + off;
}

const SIDE_COLOR = ['#ff5f5f', '#4aa3ff', '#46d39a', '#ffc44d'];
const SIDE_NAME = [
  'North Stand 北看台', 'East Stand 東看台',
  'South Stand 南看台', 'West Stand 西看台',
];

// Wheelchair-platform plan anchors (arena-side row F band, section centre).
const PLATFORM_ANCHOR = {
  '1W': { stand: 'east', sec: 1 }, '8W': { stand: 'east', sec: 8 },
  '4W': { stand: 'west', sec: 4 }, '5W': { stand: 'west', sec: 5 },
};

export const qes = {
  id: 'qes',
  name: 'Queen Elizabeth Stadium',
  zh: '伊利沙伯體育館',
  subtitle: 'Multi-purpose arena — five official seating configurations',
  dims: 'Arena stands over three levels (3/F ground · 4/F · 5/F) around a central floor',
  defaultLayout: 'end-stage',
  layouts: QES_LAYOUTS.map((l) => ({ id: l.id, label: l.label, zh: l.zh })),

  sides: [
    { base: 'N', color: SIDE_COLOR[0], name: `${SIDE_NAME[0]} (6–7)` },
    { base: 'E', color: SIDE_COLOR[1], name: `${SIDE_NAME[1]} (1 · 8)` },
    { base: 'S', color: SIDE_COLOR[2], name: `${SIDE_NAME[2]} (2–3)` },
    { base: 'W', color: SIDE_COLOR[3], name: `${SIDE_NAME[3]} (4–5)` },
  ],

  build(ctx, opts = {}) {
    const { scene } = ctx;
    const layout = qesLayout(opts.layout);
    const closed = new Set(layout.closedStands);

    const placements = [];

    /* raked stand seats */
    for (const s of QES_STAND_SECTIONS) {
      if (closed.has(s.id)) continue;
      const bands = ROW_BANDS[s.stand];
      const fit = SEAT_FIT[s.stand];
      const rows = QES_STAND_ROWS[s.id];
      const color = SIDE_COLOR[s.sideIndex];
      for (const [row, spec] of Object.entries(rows)) {
        const depth = bands[row];
        if (depth == null) continue;
        const y = rowHeight(s.id, row);
        const seats = parseSeatSpec(spec).flat();
        for (const n of seats) {
          let x3, z3;
          if (s.stand === 'north' || s.stand === 'south') {
            x3 = toX(fit(n)); z3 = toZ(depth);
          } else {
            z3 = toZ(fit(n)); x3 = toX(depth);
          }
          placements.push({
            x: x3, y, z: z3, yaw: Math.atan2(-x3, -z3),
            sec: s.id, row, seat: n, tier: tierOf(s.id, row),
            zone: SIDE_NAME[s.sideIndex], color, side: s.sideIndex,
            alt: row.charCodeAt(0) % 2, widthScale: 0.72,
          });
        }
      }
    }

    /* arena-floor sections 9 (south half) / 10 (north half) */
    const floorEntries = Object.entries(layout.floor);
    if (floorEntries.length) {
      const focus = layout.stage === 'west' ? [toX(250), 0] : [0, 0];
      for (const [secStr, total] of floorEntries) {
        const sec = Number(secStr);
        const north = sec === 10;
        const yr = north ? [252, 378] : [388, 516];
        const perRow = 24;
        const rowN = Math.ceil(total / perRow);
        let placed = 0;
        for (let r = 0; r < rowN && placed < total; r++) {
          const py = yr[0] + (rowN === 1 ? 0.5 : r / (rowN - 1)) * (yr[1] - yr[0]);
          const inRow = Math.min(perRow, total - placed);
          for (let sIdx = 0; sIdx < inRow; sIdx++) {
            const px = 258 + (sIdx / (perRow - 1)) * (712 - 258);
            const x3 = toX(px), z3 = toZ(py);
            placements.push({
              x: x3, y: 0, z: z3,
              yaw: Math.atan2(focus[0] - x3, focus[1] - z3),
              sec, row: 'AA', seat: placed + 1, tier: '3/F',
              zone: 'Arena Floor 場地', color: '#cf8f52', side: 2,
              alt: r % 2, widthScale: 0.7,
            });
            placed++;
          }
        }
      }
    }

    /* seat instances */
    const { seats, baseColors, seatIndex } = createSeatInstances(placements, {
      boxes: [
        { size: [0.42, 0.10, 0.36], pos: [0, 0.24, 0.03] },
        { size: [0.42, 0.42, 0.08], pos: [0, 0.44, -0.16] },
      ],
      shade: (p) => (p.tier === '5/F' ? 0.66 : p.tier === '4/F' ? 0.76 : 0.86),
      altShade: 0.05,
      roughness: 0.75,
      metalness: 0.05,
    });
    scene.add(seats);

    /* arena floor slab + outline */
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x11161f, roughness: 0.9 });
    const arena = new THREE.Mesh(new THREE.PlaneGeometry(toX(720) - toX(244), toZ(524) - toZ(246)), floorMat);
    arena.rotation.x = -Math.PI / 2; arena.position.set(0, 0, 0); scene.add(arena);
    addOutline(scene, 0, 0, toX(720) - toX(244), toZ(524) - toZ(246), 0x24644f, 0.045);
    addGround(scene, 80, 0x090d14, -0.05);

    /* wheelchair platforms */
    const wpMeshes = [];
    const wpMat = new THREE.MeshStandardMaterial({ color: 0x6b7684, roughness: 0.85, side: THREE.DoubleSide });
    for (const id of layout.platforms) {
      const a = PLATFORM_ANCHOR[id];
      if (!a || closed.has(a.sec)) continue;
      const depth = ROW_BANDS[a.stand].F;
      const along = SEAT_FIT[a.stand](a.stand === 'east' ? 46 : (a.stand === 'west' && a.sec === 4 ? 60 : 46));
      let x3, z3;
      if (a.stand === 'east' || a.stand === 'west') { x3 = toX(depth); z3 = toZ(along); }
      else { x3 = toX(along); z3 = toZ(depth); }
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.0), wpMat);
      slab.position.set(x3, 0.9, z3); slab.userData.wp = id;
      scene.add(slab); wpMeshes.push(slab);
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9),
        new THREE.MeshBasicMaterial({ map: labelTexture(id, 'Wheelchair', '#e8edf4', QES_LABEL) }));
      decal.position.set(x3, 0.97, z3); decal.rotation.x = -Math.PI / 2; scene.add(decal);
    }

    /* stage */
    const stageGroup = new THREE.Group();
    const stagePos = layout.stage === 'west' ? new THREE.Vector3(toX(250), 0.6, 0)
      : new THREE.Vector3(0, 0.6, 0);
    const stageW = layout.stage === 'west' ? 3.0 : layout.stage === 'ring' ? 8.0 : 10.0;
    const stageD = layout.stage === 'west' ? 14.0 : layout.stage === 'ring' ? 8.0 : 10.0;
    const stage = new THREE.Mesh(new THREE.BoxGeometry(stageW, 1.2, stageD),
      new THREE.MeshStandardMaterial({ color: 0x2a3242, roughness: 0.6 }));
    stage.position.copy(stagePos); stage.name = 'stage';
    stage.userData.label = `${layout.label} ${layout.zh}`;
    stageGroup.add(stage);
    if (layout.stage === 'ring') {
      const ropes = new THREE.Mesh(new THREE.BoxGeometry(stageW + 0.4, 0.1, stageD + 0.4),
        new THREE.MeshStandardMaterial({ color: 0x111622, emissive: 0xffc44d, emissiveIntensity: 0.5 }));
      ropes.position.set(stagePos.x, 1.25, stagePos.z); stageGroup.add(ropes);
    }
    scene.add(stageGroup);

    /* roof + side labels */
    const roofGroup = new THREE.Group();
    {
      const half = 34, rimY = 22;
      const rim = [
        new THREE.Vector3(-half, rimY, -half), new THREE.Vector3(half, rimY, -half),
        new THREE.Vector3(half, rimY, half), new THREE.Vector3(-half, rimY, half),
      ];
      const pts = [];
      for (let i = 0; i < 4; i++) pts.push(rim[i], rim[(i + 1) % 4]);
      roofGroup.add(new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x3f5a8a, transparent: true, opacity: 0.5 })));
    }
    scene.add(roofGroup);

    const labelGroup = new THREE.Group();
    const SIDE_POS = [
      new THREE.Vector3(0, 16, toZ(64) - 3),   // north
      new THREE.Vector3(toX(922) + 3, 16, 0),  // east
      new THREE.Vector3(0, 16, toZ(716) + 3),  // south
      new THREE.Vector3(toX(42) - 3, 16, 0),   // west
    ];
    qes.sides.forEach((s, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTexture(s.base, s.name, s.color, QES_LABEL),
        transparent: true,
        depthTest: false,
      }));
      sp.scale.set(12, 3.75, 1); sp.position.copy(SIDE_POS[i]); labelGroup.add(sp);
    });
    scene.add(labelGroup);

    const describe = (p) => ({
      main: `Sec ${p.sec} · Row ${p.row} · Seat ${p.seat}`,
      sub: `${p.zone} — ${p.tier}`,
    });

    return { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe };
  },
};
