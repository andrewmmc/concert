// Hong Kong Coliseum (香港體育館) — centre-stage 四面台 360° and end-stage
// 三面台 configurations, modelled from the official LCSD arena plans
// (hkc_center_stage.pdf "HKC_NCS_AW_July2024", hkc_end_stage.pdf) and LCSD
// technical data:
//   · arena floor 40 m × 40 m · indoor ceiling 23 m · inverted-pyramid roof 41 m
//   · 40 sections: Red 40-49, Blue 50-59, Green 60-69, Yellow 70-79
//   · rows 1-13 lower tier · 14-15 promenade level (11 wheelchair platforms)
//   · rows 16-39 upper tier; row limits differ by gate and by the two seat
//     blocks adjoining each numbered aisle
//   · seat numbers are fixed "column" slots 81-98 repeated in every row;
//     seats 90-98 of a gate lie in the block before its aisle and seats
//     81-89 in the block after it (see blockAfterAisleForSeat)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRingR, ringStripGeo } from '../scene.js';

const DEG = Math.PI / 180;

// The PDF numbers entrance aisles (gates), not self-contained rectangular
// sections.  Each physical block between two aisles is shared by two gates:
// seats 90-98 belong to the higher gate and seats 81-89 to the lower one, so
// a gate's seats run continuously (e.g. 84-96) across two neighbouring
// blocks.  Seat 90 and seat 89 sit beside their own gate's aisle, so along a
// block the numbers run 89,88…81 then 98…91,90.  Row depth therefore has to
// be stored per block and applied independently to each half of a block.
export const ROW_LIMITS_BY_GATE = [
  [39, 39, 36, 36, 36, 36, 36, 36, 39, 39], // Red 40-49
  [39, 39, 36, 36, 36, 36, 36, 36, 39, 39], // Blue 50-59
  [39, 39, 36, 33, 34, 34, 34, 33, 36, 39], // Green 60-69
  [39, 39, 36, 36, 36, 36, 36, 36, 39, 39], // Yellow 70-79
];

// Each platform occupies rows 14-15 of the block after `aisle`.  The compact
// corner platforms only have rows 9-13 in front of them; the central
// platforms retain rows 1-13.  IDs and anchors follow the labels in the PDF.
export const WHEELCHAIR_PLATFORMS = [
  { id: 6, aisle: 41, firstRow: 9 },
  { id: 7, aisle: 44, firstRow: 1 },
  { id: 8, aisle: 47, firstRow: 9 },
  { id: 9, aisle: 51, firstRow: 9 },
  { id: 10, aisle: 54, firstRow: 1 },
  { id: 11, aisle: 56, firstRow: 9 },
  { id: 1, aisle: 61, firstRow: 9 },
  { id: 2, aisle: 64, firstRow: 9 },
  { id: 3, aisle: 67, firstRow: 9 },
  { id: 4, aisle: 72, firstRow: 1 },
  { id: 5, aisle: 75, firstRow: 9 },
];

const PLATFORM_BY_AISLE = new Map(WHEELCHAIR_PLATFORMS.map((wp) => [wp.aisle, wp]));

// End-stage 三面台 arena floor (Brown Gate 啡閘): thirteen flat-floor
// blocks in three banks facing the stage — a back bank of three 12-seat
// blocks (rows AA-AG) flanked by the two WZ wheelchair seating zones, then
// middle and front banks of five blocks (rows A-J and K-S) whose outer
// blocks are 10 seats wide.  The stage stands at the Green Gate end, so the
// Red Gate is 正面 to the stage and the floor gates take Red-range numbers
// 42-47 (the Red-side counterpart of the 62-67 shown on the LCSD plan,
// where the stage is drawn at the Red end).  Aisle numbers increase from
// the Yellow side (-x) to the Blue side (+x) like the Red Gate stands; as
// in the stands, seat 89 and seat 90 sit beside their own gate's aisle, so
// within a block the 80s half of the lower gate comes first, then the 90s
// half of the higher gate.  gateHigh/gateLow are the gates owning the
// 90s/80s halves of each block.  x/z are the centre of the first row on the
// 40 m × 40 m arena floor, placed to scale from the plan (seat pitch
// ≈ 0.55 m, row pitch ≈ 0.78 m); the stage occupies z > 10, so the back
// bank (rows AA-AG) sits closest to it and the rows of each bank run
// towards -Z.
export const END_STAGE_FLOOR_BLOCKS = [
  // back bank, rows AA-AG (7 rows × 12 seats)
  { gateHigh: 44, gateLow: 43, x: -7.55, z: 7.56, rows: 7, seats: 12, rowOffset: 0 },
  { gateHigh: 45, gateLow: 44, x: 0, z: 7.56, rows: 7, seats: 12, rowOffset: 0 },
  { gateHigh: 46, gateLow: 45, x: 7.55, z: 7.56, rows: 7, seats: 12, rowOffset: 0 },
  // middle bank, rows A-J (10 rows; side blocks 10 seats, centre blocks 12)
  { gateHigh: 43, gateLow: 42, x: -14.49, z: 1.15, rows: 10, seats: 10, rowOffset: 7 },
  { gateHigh: 44, gateLow: 43, x: -7.55, z: 1.15, rows: 10, seats: 12, rowOffset: 7 },
  { gateHigh: 45, gateLow: 44, x: 0, z: 1.15, rows: 10, seats: 12, rowOffset: 7 },
  { gateHigh: 46, gateLow: 45, x: 7.55, z: 1.15, rows: 10, seats: 12, rowOffset: 7 },
  { gateHigh: 47, gateLow: 46, x: 14.49, z: 1.15, rows: 10, seats: 10, rowOffset: 7 },
  // front bank, rows K-S (9 rows; same column layout as the middle bank)
  { gateHigh: 43, gateLow: 42, x: -14.49, z: -7.80, rows: 9, seats: 10, rowOffset: 17 },
  { gateHigh: 44, gateLow: 43, x: -7.55, z: -7.80, rows: 9, seats: 12, rowOffset: 17 },
  { gateHigh: 45, gateLow: 44, x: 0, z: -7.80, rows: 9, seats: 12, rowOffset: 17 },
  { gateHigh: 46, gateLow: 45, x: 7.55, z: -7.80, rows: 9, seats: 12, rowOffset: 17 },
  { gateHigh: 47, gateLow: 46, x: 14.49, z: -7.80, rows: 9, seats: 10, rowOffset: 17 },
];

// The two arena-floor wheelchair seating zones (WZ) flanking the back bank;
// x/z are each zone's centre.
export const END_STAGE_FLOOR_WZ = [
  { x: -12.8, z: 5.15 },
  { x: 12.8, z: 5.15 },
];

// Rows AA-AG in the back bank, then A-S across the middle and front banks.
export const FLOOR_ROW_LETTERS = [
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG',
  ...'ABCDEFGHIJKLMNOPQRS',
];

// Seat numbers within a floor block, left to right (-x to +x): 89…(90-half)
// of the lower gate, then (89+half)…90 of the higher gate, so seats 89 and
// 90 sit beside their own gate's aisle as in the stands.
export function floorBlockSeatNumbers(seats) {
  const half = seats / 2;
  return Array.from({ length: seats }, (_, s) => (s < half ? 89 - s : 89 + seats - s));
}

const previousAisle = (aisle) => aisle === 40 ? 79 : aisle - 1;
const gateAndOffset = (aisle) => {
  const normalized = aisle - 40;
  return { gate: Math.floor(normalized / 10), offset: normalized % 10 };
};
// Seats 90-98 of a gate lie in the block before its aisle (between aisles
// N-1 and N); seats 81-89 lie in the block after it (between aisles N and
// N+1).
const blockAfterAisleForSeat = (aisle, seat) => seat >= 90 ? previousAisle(aisle) : aisle;
const rowLimitAfterAisle = (aisle) => {
  const { gate, offset } = gateAndOffset(aisle);
  return ROW_LIMITS_BY_GATE[gate][offset];
};

function compactPlatformRange(platform, row) {
  // WP1 is the smaller curved platform block marked (35) on the plan.
  if (platform.id === 1) return { highMax: 93, lowMin: 87 };
  if (row <= 10) return { highMax: 94, lowMin: 85 };
  if (row === 11) return { highMax: 95, lowMin: 85 };
  return { highMax: 95, lowMin: 84 };
}

function narrowOuterRange(row, extraHighSeat = 0) {
  let highCount;
  let lowCount;
  if (row === 21) { highCount = 3; lowCount = 3; }
  else if (row <= 23) { highCount = 4; lowCount = 3; }
  else if (row <= 25) { highCount = 4; lowCount = 4; }
  else if (row <= 27) { highCount = 5; lowCount = 4; }
  else if (row <= 30) { highCount = 5; lowCount = 5; }
  else if (row <= 32) { highCount = 6; lowCount = 5; }
  else if (row <= 36) { highCount = 6 + (row === 36 ? 1 : 0); lowCount = 6; }
  else if (row === 37) { highCount = 6; lowCount = 6; }
  else if (row === 38) { highCount = 4; lowCount = 4; }
  else { highCount = 3; lowCount = 3; }
  highCount = Math.min(9, highCount + extraHighSeat);
  return { highMax: 89 + highCount, lowMin: 90 - lowCount };
}

function seatRangeAfterAisle(aisle, row) {
  const platform = PLATFORM_BY_AISLE.get(aisle);
  if (platform?.firstRow === 9 && row >= 9 && row <= 13) {
    return compactPlatformRange(platform, row);
  }

  if (row <= 15) return { highMax: 96, lowMin: 84 };
  if (row <= 17) return { highMax: 93, lowMin: 86 };
  if (row <= 20) return { highMax: 94, lowMin: 86 };

  const { gate, offset } = gateAndOffset(aisle);
  if (offset === 1 || offset === 9) {
    // Corner shoulders total 188 seats (186 at Green Gate) in the PDF.
    const widen = gate === 2 ? row >= 32 && row <= 36 : row >= 30 && row <= 36;
    return narrowOuterRange(row, widen ? 1 : 0);
  }
  if (offset === 0) {
    // The corner block itself totals 205 seats (199 at Green Gate).
    const range = narrowOuterRange(row, gate === 2 ? (row <= 38 ? 1 : 0) : 1);
    if (gate !== 2 && row >= 30 && row <= 34) range.lowMin -= 1;
    return range;
  }
  if (offset === 2 || offset === 8) {
    // These tapering blocks total 154 seats, or 152 at Green Gate.
    const range = narrowOuterRange(row);
    if ((gate === 2 && row >= 33 && row <= 35) || (gate !== 2 && row === 35)) {
      range.highMax -= 1;
    }
    return range;
  }

  // The Green Gate's straight upper blocks contain 13 seats per row.  The
  // other straight gates contain 14, with the shoulder blocks widening from
  // 13 to 14 seats over their final six rows.
  if (gate === 2) return { highMax: 96, lowMin: 84 };
  if ((offset === 3 || offset === 7) && row <= 30) return { highMax: 96, lowMin: 84 };
  return { highMax: 96, lowMin: 83 };
}

export function seatExistsOnPlan(aisle, row, seat) {
  if (!Number.isInteger(aisle) || aisle < 40 || aisle > 79 ||
      !Number.isInteger(row) || row < 1 || row > 39 ||
      !Number.isInteger(seat) || seat < 81 || seat > 98) return false;

  const blockAisle = blockAfterAisleForSeat(aisle, seat);
  if (row > rowLimitAfterAisle(blockAisle)) return false;

  const platform = PLATFORM_BY_AISLE.get(blockAisle);
  if (platform && (row === 14 || row === 15 || row < platform.firstRow)) return false;

  const { highMax, lowMin } = seatRangeAfterAisle(blockAisle, row);
  return seat >= 90 ? seat <= highMax : seat >= lowMin;
}

export const hkc = {
  id: 'hkc',
  name: 'Hong Kong Coliseum',
  zh: '香港體育館',
  subtitle: 'Centre Stage 360° configuration',
  dims: 'Arena 40 m × 40 m · ceiling 23 m · inverted-pyramid roof 41 m',
  planUrl: 'https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf',
  defaultLayout: 'center-stage',
  layouts: [
    {
      id: 'center-stage',
      label: 'Centre Stage',
      zh: '四面台',
      planUrl: 'https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf',
    },
    {
      id: 'end-stage',
      label: 'End Stage',
      zh: '三面台',
      planUrl: 'https://www.lcsd.gov.hk/en/hkc/common/form/hkc_end_stage.pdf',
    },
  ],

  sides: [
    { base: 40, center: 270 * DEG, color: '#ff5f5f', name: 'Red Gate (40s)' },
    { base: 50, center: 360 * DEG, color: '#4aa3ff', name: 'Blue Gate (50s)' },
    { base: 60, center:  90 * DEG, color: '#46d39a', name: 'Green Gate (60s)' },
    { base: 70, center: 180 * DEG, color: '#ffc44d', name: 'Yellow Gate (70s)' },
  ],

  build(ctx, opts = {}) {
    const { scene } = ctx;
    // The bowl is identical for both layouts; the end-stage 三面台 layout
    // moves the stage to the Green Gate (60s) end and adds floor blocks.
    const endStage = opts.layout === 'end-stage';
    const P_SUPER = 3.2;
    const ringR = makeRingR(P_SUPER);
    const SIDES = this.sides;
    const SECS_PER_SIDE = 10, SEC_DEG = 9;

    const TIER = {
      lower: { r0: 22.5, y0: 1.00, dr: 0.80, dy: 0.42 },
      prom:  { r0: 32.9, y0: 6.04, dr: 0.80, dy: 0.42 },
      upper: { r0: 34.9, y0: 7.30, dr: 0.85, dy: 0.50 },
    };
    const rowGeo = (i) => {
      if (i < 13)  { const k = i;      return { S: TIER.lower.r0 + k * TIER.lower.dr, y: TIER.lower.y0 + k * TIER.lower.dy, name: 'Lower Tier' }; }
      if (i < 15)  { const k = i - 13; return { S: TIER.prom.r0  + k * TIER.prom.dr,  y: TIER.prom.y0  + k * TIER.prom.dy,  name: 'Promenade Level' }; }
      const k = i - 15; return { S: TIER.upper.r0 + k * TIER.upper.dr, y: TIER.upper.y0 + k * TIER.upper.dy, name: 'Upper Tier' };
    };
    const WALK = { S0: 33.9, S1: 35.2, y: 6.9 };

    const terraceMat = new THREE.MeshStandardMaterial({ color: 0x1c2432, roughness: 0.95, metalness: 0.05 });
    const strip = (rings) => ringStripGeo(ringR, rings);

    function buildTierRows(rowStart, rowEnd, base) {
      const rings = [];
      for (let r = rowStart; r <= rowEnd; r++) {
        const g = rowGeo(r - 1), dr = base;
        rings.push({ S: g.S, y: g.y }, { S: g.S + dr * 0.995, y: g.y });
        if (r < rowEnd) rings.push({ S: g.S + dr * 0.995, y: g.y + (rowGeo(r).y - g.y) });
      }
      return new THREE.Mesh(strip(rings), terraceMat);
    }
    scene.add(buildTierRows(1, 13, TIER.lower.dr));
    scene.add(buildTierRows(14, 15, TIER.prom.dr));
    scene.add(buildTierRows(16, 39, TIER.upper.dr));

    scene.add(new THREE.Mesh(strip([{ S: WALK.S0, y: WALK.y }, { S: WALK.S1, y: WALK.y }]),
      new THREE.MeshStandardMaterial({ color: 0x232f42, roughness: 0.9 })));
    scene.add(new THREE.Mesh(strip([{ S: 20.0, y: 0.02 }, { S: TIER.lower.r0 + 0.05, y: 0.02 }]), terraceMat));

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x11161f, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0; scene.add(floor);
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-20, 0.04, -20), new THREE.Vector3(20, 0.04, -20),
      new THREE.Vector3(20, 0.04, 20), new THREE.Vector3(-20, 0.04, 20)]),
      new THREE.LineBasicMaterial({ color: 0x3a4a66 })));

    const topRow = rowGeo(38);
    scene.add(new THREE.Mesh(strip([{ S: topRow.S + TIER.upper.dr, y: topRow.y + TIER.upper.dy },
      { S: topRow.S + TIER.upper.dr + 2.6, y: 0 }]),
      new THREE.MeshStandardMaterial({ color: 0x151b26, roughness: 1, side: THREE.DoubleSide })));
    const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 64),
      new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);

    /* stage — 四面台: centred box; 三面台: box against the Green Gate end
       (+Z).  正面 (front) faces +Z in the 四面台 layout and -Z in the
       三面台 layout; `front` is the sign of the facing direction. */
    const STAGE = endStage
      ? { w: 24, d: 9, z: 14.5, title: 'END STAGE', zh: '三面台', arrow: '正面 ↑', front: -1 }
      : { w: 16, d: 12, z: 0, title: 'CENTRE STAGE', zh: '中央舞台', arrow: '正面 →', front: 1 };
    const stageGroup = new THREE.Group();
    const stage = new THREE.Mesh(new THREE.BoxGeometry(STAGE.w, 1.2, STAGE.d),
      new THREE.MeshStandardMaterial({ color: 0x2a3242, roughness: 0.6 }));
    stage.position.set(0, 0.6, STAGE.z); stage.name = 'stage';
    stage.userData.label = endStage ? 'End Stage 三面台' : 'Centre Stage 中央舞台';
    stageGroup.add(stage);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(STAGE.w + 0.3, 0.12, STAGE.d + 0.3),
      new THREE.MeshStandardMaterial({ color: 0x111622, emissive: 0xffc44d, emissiveIntensity: 0.55 }));
    trim.position.set(0, 1.22, STAGE.z); stageGroup.add(trim);
    {
      const c = document.createElement('canvas'); c.width = 1024; c.height = endStage ? 384 : 768;
      const x = c.getContext('2d');
      x.fillStyle = '#232b3a'; x.fillRect(0, 0, 1024, c.height);
      x.fillStyle = '#ffd34d'; x.font = '700 96px system-ui'; x.textAlign = 'center';
      x.fillText(STAGE.title, 512, endStage ? 150 : 340);
      x.font = '600 56px system-ui'; x.fillStyle = '#8fa3c0'; x.fillText(STAGE.zh, 512, endStage ? 246 : 436);
      x.font = '600 44px system-ui'; x.fillStyle = '#46d39a'; x.fillText(STAGE.arrow, 512, c.height - 40);
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      const top = new THREE.Mesh(new THREE.PlaneGeometry(STAGE.w - 1.5, STAGE.d - 1.2), new THREE.MeshBasicMaterial({ map: tex }));
      top.rotation.x = -Math.PI / 2; top.rotation.z = 0; top.position.set(0, 1.33, STAGE.z); stageGroup.add(top);
      const front = new THREE.Mesh(new THREE.BoxGeometry(STAGE.w + 0.3, 0.16, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x111622, emissive: 0x46d39a, emissiveIntensity: 0.7 }));
      front.position.set(0, 1.22, STAGE.z + (STAGE.d / 2 + 0.15) * STAGE.front); stageGroup.add(front);
    }
    scene.add(stageGroup);

    /* wheelchair platforms WP1–WP11 */
    const wpMeshes = [];
    function wpLabelTexture(text) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#e8edf4'; x.fillRect(0, 0, 256, 128);
      x.fillStyle = '#1c2432'; x.font = '800 78px system-ui'; x.textAlign = 'center'; x.fillText(text, 128, 92);
      return new THREE.CanvasTexture(c);
    }
    {
      const wpMat = new THREE.MeshStandardMaterial({ color: 0x6b7684, roughness: 0.85, side: THREE.DoubleSide });
      for (const wp of WHEELCHAIR_PLATFORMS) {
          const { gate: side, offset: j } = gateAndOffset(wp.aisle);
          const S = SIDES[side];
          // Platforms occupy the block between this aisle and the next one.
          const tMid = (S.center / DEG - 45 + (j + 1) * SEC_DEG) * DEG;
          const halfW = SEC_DEG * DEG * 0.44;
          const segs = 16, pos = [], idx = [];
          for (let k = 0; k <= segs; k++) {
            const t = tMid - halfW + (k / segs) * halfW * 2;
            const rOut = ringR(t, WALK.S1 - 0.12), rIn = ringR(t, WALK.S0 + 0.12);
            pos.push(rIn * Math.cos(t), 0, rIn * Math.sin(t), rOut * Math.cos(t), 0, rOut * Math.sin(t));
          }
          for (let k = 0; k < segs; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setIndex(idx); g.computeVertexNormals();
          const p = new THREE.Mesh(g, wpMat);
          p.position.y = WALK.y + 0.045; p.userData.wp = wp.id;
          scene.add(p); wpMeshes.push(p);
          const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95),
            new THREE.MeshBasicMaterial({ map: wpLabelTexture(`WP${wp.id}`) }));
          const labelS = (WALK.S0 + WALK.S1) / 2;
          const rMid = ringR(tMid, labelS);
          const tangentDelta = 0.001;
          const rBefore = ringR(tMid - tangentDelta, labelS);
          const rAfter = ringR(tMid + tangentDelta, labelS);
          const tangentX = rAfter * Math.cos(tMid + tangentDelta) - rBefore * Math.cos(tMid - tangentDelta);
          const tangentZ = rAfter * Math.sin(tMid + tangentDelta) - rBefore * Math.sin(tMid - tangentDelta);
          decal.position.set(rMid * Math.cos(tMid), WALK.y + 0.06, rMid * Math.sin(tMid));
          decal.rotation.x = -Math.PI / 2; decal.rotation.z = -Math.atan2(tangentZ, tangentX);
          scene.add(decal);
      }
    }

    /* seats (instanced) — each wedge is the block between aisles secNo-1
       (tL side) and secNo (tR side): seats 81-89 of gate secNo-1 hug the tL
       aisle starting at 89, seats 90-98 of gate secNo hug the tR aisle
       starting at 90 */
    const SLOT_HIGH_MIN = 90, SLOT_HIGH_MAX = 98, SLOT_LOW_MAX = 89, SLOT_LOW_MIN = 81;
    const aisleInset = 0.45, seatWidth = 0.56;
    const placements = [];
    for (let side = 0; side < 4; side++) {
      const S = SIDES[side];
      for (let j = 0; j < SECS_PER_SIDE; j++) {
        const secNo = S.base + j;
        const prevSec = previousAisle(secNo);
        // Gate prevSec usually belongs to the same side; at the side corner
        // (e.g. gate 79's low seats in gate 40's wedge) it is the previous one.
        const prevSide = Math.floor((prevSec - 40) / 10);
        const w0 = (S.center / DEG - 45 + j * SEC_DEG) * DEG;
        const w1 = w0 + SEC_DEG * DEG;
        for (let row = 0; row < 39; row++) {
          const rg = rowGeo(row);
          const rMid = ringR((w0 + w1) / 2, rg.S);
          const tL = w0 + aisleInset / rMid, tR = w1 - aisleInset / rMid;
          const tMid = (w0 + w1) / 2;
          const lowStep = (tMid - tL) / 9;
          const highStep = (tR - tMid) / 9;
          const put = (t, slot, angularStep, sec, seatSide) => {
            const rad = ringR(t, rg.S) + 0.16;
            const x = rad * Math.cos(t), z = rad * Math.sin(t);
            const beforeT = t - angularStep / 2, afterT = t + angularStep / 2;
            const beforeR = ringR(beforeT, rg.S) + 0.16, afterR = ringR(afterT, rg.S) + 0.16;
            const spacing = Math.hypot(
              afterR * Math.cos(afterT) - beforeR * Math.cos(beforeT),
              afterR * Math.sin(afterT) - beforeR * Math.sin(beforeT),
            );
            placements.push({
              x, y: rg.y, z, yaw: Math.atan2(-x, -z),
              sec, row: row + 1, seat: slot, tier: rg.name, side: seatSide,
              widthScale: spacing * 0.82 / seatWidth,
            });
          };
          const lowSlots = [], highSlots = [];
          for (let slot = SLOT_LOW_MIN; slot <= SLOT_LOW_MAX; slot++) {
            if (seatExistsOnPlan(prevSec, row + 1, slot)) lowSlots.push(slot);
          }
          for (let slot = SLOT_HIGH_MIN; slot <= SLOT_HIGH_MAX; slot++) {
            if (seatExistsOnPlan(secNo, row + 1, slot)) highSlots.push(slot);
          }
          // Physical order from tL to tR: 89,88…lowMin of gate prevSec,
          // then highMax…91,90 of gate secNo.
          const outward = (slots) => slots.slice().reverse();
          if (lowSlots.length && highSlots.length) {
            const slots = [
              ...outward(lowSlots).map((slot) => ({ slot, sec: prevSec, seatSide: prevSide })),
              ...outward(highSlots).map((slot) => ({ slot, sec: secNo, seatSide: side })),
            ];
            const step = (tR - tL) / slots.length;
            slots.forEach(({ slot, sec, seatSide }, i) => put(tL + (i + 0.5) * step, slot, step, sec, seatSide));
          } else {
            outward(lowSlots).forEach((slot, i) => put(tL + (i + 0.5) * lowStep, slot, lowStep, prevSec, prevSide));
            outward(highSlots).forEach((slot, i) => put(tR - (highSlots.length - i - 0.5) * highStep, slot, highStep, secNo, side));
          }
        }
      }
    }

    /* arena floor seats (end stage 三面台 only) — Brown Gate 啡閘 blocks
       standing on the flat floor and facing the stage at the +Z end, so
       each bank's rows step towards -Z */
    if (endStage) {
      const pitch = 0.55, rowPitch = 0.78;
      for (const block of END_STAGE_FLOOR_BLOCKS) {
        const seatNumbers = floorBlockSeatNumbers(block.seats);
        for (let r = 0; r < block.rows; r++) {
          for (let s = 0; s < block.seats; s++) {
            const seat = seatNumbers[s];
            placements.push({
              x: block.x + (s - (block.seats - 1) / 2) * pitch,
              y: 0,
              z: block.z - r * rowPitch,
              yaw: 0,
              sec: seat >= 90 ? block.gateHigh : block.gateLow,
              row: FLOOR_ROW_LETTERS[block.rowOffset + r], seat,
              tier: 'Arena Floor', zone: 'Brown Gate 啡閘', color: '#cf8f52', side: 0,
              alt: r % 2,
              widthScale: pitch * 0.82 / seatWidth,
            });
          }
        }
      }

      /* the two arena-floor wheelchair seating zones (WZ) flanking the
         back bank of floor blocks */
      const wzMat = new THREE.MeshStandardMaterial({ color: 0x3a4a42, roughness: 0.85 });
      for (const zone of END_STAGE_FLOOR_WZ) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 3.8), wzMat);
        slab.position.set(zone.x, 0.04, zone.z);
        slab.userData.label = 'Arena Floor Wheelchair Seating Zone 輪椅座位區';
        scene.add(slab);
        const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1),
          new THREE.MeshBasicMaterial({ map: wpLabelTexture('WZ') }));
        decal.position.set(zone.x, 0.1, zone.z);
        decal.rotation.x = -Math.PI / 2;
        scene.add(decal);
      }
    }

    const pan = new THREE.BoxGeometry(seatWidth, 0.10, 0.38); pan.translate(0, 0.24, 0.03);
    const back = new THREE.BoxGeometry(seatWidth, 0.44, 0.09); back.translate(0, 0.44, -0.17);
    const seatGeo = mergeGeometries([pan, back]);
    const seatMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 });
    const seats = new THREE.InstancedMesh(seatGeo, seatMat, placements.length);
    const baseColors = new Float32Array(placements.length * 3);
    const seatIndex = new Map();
    {
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
      const V = new THREE.Vector3(), scale = new THREE.Vector3();
      placements.forEach((p, i) => {
        E.set(0, p.yaw, 0); Q.setFromEuler(E); V.set(p.x, p.y, p.z);
        const preferredWidthScale = p.tier === 'Upper Tier' ? 1.12 : 1;
        scale.set(Math.min(preferredWidthScale, p.widthScale), 1, 1);
        M.compose(V, Q, scale); seats.setMatrixAt(i, M);
        const c = new THREE.Color(p.color || SIDES[p.side].color);
        const shade = p.tier === 'Upper Tier' ? 0.62 : p.tier === 'Promenade Level' ? 0.72 : 0.82;
        c.multiplyScalar(shade + (p.alt ?? p.row % 2) * 0.05);
        seats.setColorAt(i, c);
        baseColors.set([c.r, c.g, c.b], i * 3);
        seatIndex.set(`${p.sec}-${p.row}-${p.seat}`, i);
      });
    }
    seats.instanceMatrix.needsUpdate = true;
    if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
    scene.add(seats);

    /* inverted-pyramid roof */
    const roofGroup = new THREE.Group();
    {
      const apex = new THREE.Vector3(0, 23, 0), rimHalf = 57, rimY = 41;
      const rim = [new THREE.Vector3(-rimHalf, rimY, -rimHalf), new THREE.Vector3(rimHalf, rimY, -rimHalf),
                   new THREE.Vector3(rimHalf, rimY, rimHalf), new THREE.Vector3(-rimHalf, rimY, rimHalf)];
      const pts = [];
      for (let i = 0; i < 4; i++) { pts.push(rim[i], rim[(i + 1) % 4], apex, rim[i]); }
      roofGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x3f5a8a, transparent: true, opacity: 0.55 })));
      const facePos = [];
      for (let i = 0; i < 4; i++) { const a = apex, b = rim[i], c = rim[(i + 1) % 4]; facePos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z); }
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(facePos, 3)); fg.computeVertexNormals();
      roofGroup.add(new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: 0x27406b, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })));
      roofGroup.add(new THREE.Mesh(strip([{ S: topRow.S + 1.0, y: topRow.y + 1.0 }, { S: rimHalf * 0.78, y: rimY }]),
        new THREE.MeshBasicMaterial({ color: 0x1d2c4a, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false })));
    }
    scene.add(roofGroup);

    /* side labels */
    const labelGroup = new THREE.Group();
    function makeLabel(text, sub, color) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 200;
      const x = c.getContext('2d'); x.textAlign = 'center';
      x.fillStyle = color; x.font = '800 88px system-ui'; x.fillText(text, 256, 88);
      x.fillStyle = '#c8d4e8'; x.font = '600 42px system-ui'; x.fillText(sub, 256, 160);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
      sp.scale.set(13, 5.1, 1); return sp;
    }
    const SIDE_SUB = ['Red Gate', 'Blue Gate', 'Green Gate', 'Yellow Gate'];
    SIDES.forEach((s, i) => {
      const t = s.center, rad = ringR(t, topRow.S + 13);
      const sp = makeLabel(`${s.base}–${s.base + 9}`, SIDE_SUB[i], s.color);
      sp.position.set(rad * Math.cos(t), topRow.y + 8, rad * Math.sin(t));
      labelGroup.add(sp);
    });
    scene.add(labelGroup);

    const describe = (p) => ({ main: `Sec ${p.sec} · Row ${p.row} · Seat ${p.seat}`, sub: `${p.zone || SIDES[p.side].name} — ${p.tier}` });

    return { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe };
  },
};
