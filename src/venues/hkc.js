// Hong Kong Coliseum (香港體育館) — centre-stage 360° configuration.
// Modelled from the official LCSD arena plan (hkc_center_stage.pdf, "HKC_NCS_AW_July2024")
// and LCSD technical data:
//   · arena floor 40 m × 40 m · indoor ceiling 23 m · inverted-pyramid roof 41 m
//   · 40 sections: Red 40-49, Blue 50-59, Green 60-69, Yellow 70-79
//   · rows 1-13 lower tier · 14-15 promenade level (11 wheelchair platforms)
//   · rows 16-39 upper tier; row limits differ by gate and by the two seat
//     blocks adjoining each numbered aisle
//   · seat numbers are fixed "column" slots 81-98 repeated in every row:
//     one half of each section runs 90,91…98, the other half …81,82…89
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRingR, ringStripGeo } from '../scene.js';

const DEG = Math.PI / 180;

// The PDF numbers aisles, not self-contained rectangular sections.  A seat
// numbered 90-98 is in the block clockwise from its aisle; a seat numbered
// 81-89 is in the block counter-clockwise from it.  Row depth therefore has
// to be stored per block and applied independently to each half of an aisle.
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

const previousAisle = (aisle) => aisle === 40 ? 79 : aisle - 1;
const gateAndOffset = (aisle) => {
  const normalized = aisle - 40;
  return { gate: Math.floor(normalized / 10), offset: normalized % 10 };
};
const blockAfterAisleForSeat = (aisle, seat) => seat >= 90 ? aisle : previousAisle(aisle);
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
      comingSoon: true,
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
    // opts.layout reserved for future layouts (e.g. end stage 三面台);
    // the centre-stage 四面台 bowl is the same for all 360° layouts.
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

    /* centre stage — 正面 (front) faces the Green Gate side (+Z) */
    const stageGroup = new THREE.Group();
    const stage = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a3242, roughness: 0.6 }));
    stage.position.y = 0.6; stage.name = 'stage'; stageGroup.add(stage);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(16.3, 0.12, 12.3),
      new THREE.MeshStandardMaterial({ color: 0x111622, emissive: 0xffc44d, emissiveIntensity: 0.55 }));
    trim.position.y = 1.22; stageGroup.add(trim);
    {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 768;
      const x = c.getContext('2d');
      x.fillStyle = '#232b3a'; x.fillRect(0, 0, 1024, 768);
      x.fillStyle = '#ffd34d'; x.font = '700 96px system-ui'; x.textAlign = 'center';
      x.fillText('CENTRE STAGE', 512, 340);
      x.font = '600 56px system-ui'; x.fillStyle = '#8fa3c0'; x.fillText('中央舞台', 512, 436);
      x.font = '600 44px system-ui'; x.fillStyle = '#46d39a'; x.fillText('正面 →', 512, 700);
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      const top = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 10.8), new THREE.MeshBasicMaterial({ map: tex }));
      top.rotation.x = -Math.PI / 2; top.rotation.z = 0; top.position.y = 1.33; stageGroup.add(top);
      const front = new THREE.Mesh(new THREE.BoxGeometry(16.3, 0.16, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x111622, emissive: 0x46d39a, emissiveIntensity: 0.7 }));
      front.position.set(0, 1.22, 6.15); stageGroup.add(front);
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

    /* seats (instanced) */
    const SLOT_LEFT_START = 90, SLOT_LEFT_MAX = 98, SLOT_RIGHT_START = 89, SLOT_RIGHT_MIN = 81;
    const aisleInset = 0.45, seatWidth = 0.44;
    const placements = [];
    for (let side = 0; side < 4; side++) {
      const S = SIDES[side];
      for (let j = 0; j < SECS_PER_SIDE; j++) {
        const secNo = S.base + j;
        const w0 = (S.center / DEG - 45 + j * SEC_DEG) * DEG;
        const w1 = w0 + SEC_DEG * DEG;
        for (let row = 0; row < 39; row++) {
          const rg = rowGeo(row);
          const rMid = ringR((w0 + w1) / 2, rg.S);
          const tL = w0 + aisleInset / rMid, tR = w1 - aisleInset / rMid;
          const tMid = (w0 + w1) / 2;
          const leftStep = (tMid - tL) / 9;
          const rightStep = (tR - tMid) / 9;
          const put = (t, slot) => {
            const rad = ringR(t, rg.S) + 0.16;
            const x = rad * Math.cos(t), z = rad * Math.sin(t);
            placements.push({ x, y: rg.y, z, yaw: Math.atan2(-x, -z), sec: secNo, row: row + 1, seat: slot, tier: rg.name, side });
          };
          const leftSlots = [], rightSlots = [];
          for (let slot = SLOT_LEFT_START; slot <= SLOT_LEFT_MAX; slot++) {
            if (seatExistsOnPlan(secNo, row + 1, slot)) leftSlots.push(slot);
          }
          for (let slot = SLOT_RIGHT_MIN; slot <= SLOT_RIGHT_START; slot++) {
            if (seatExistsOnPlan(secNo, row + 1, slot)) rightSlots.push(slot);
          }
          if (leftSlots.length && rightSlots.length) {
            const slots = [...leftSlots, ...rightSlots];
            const step = (tR - tL) / 18;
            slots.forEach((slot, i) => put(tMid + (i - (slots.length - 1) / 2) * step, slot));
          } else {
            leftSlots.forEach((slot, i) => put(tL + (i + 0.5) * leftStep, slot));
            rightSlots.forEach((slot, i) => put(tR - (rightSlots.length - i - 0.5) * rightStep, slot));
          }
        }
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
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3();
      const regularScale = new THREE.Vector3(1, 1, 1), upperScale = new THREE.Vector3(1.12, 1, 1);
      placements.forEach((p, i) => {
        E.set(0, p.yaw, 0); Q.setFromEuler(E); V.set(p.x, p.y, p.z);
        M.compose(V, Q, p.tier === 'Upper Tier' ? upperScale : regularScale); seats.setMatrixAt(i, M);
        const c = new THREE.Color(SIDES[p.side].color);
        const shade = p.tier === 'Upper Tier' ? 0.62 : p.tier === 'Promenade Level' ? 0.72 : 0.82;
        c.multiplyScalar(shade + (p.row % 2) * 0.05);
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

    const describe = (p) => ({ main: `Sec ${p.sec} · Row ${p.row} · Seat ${p.seat}`, sub: `${SIDES[p.side].name} — ${p.tier}` });

    return { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe };
  },
};
