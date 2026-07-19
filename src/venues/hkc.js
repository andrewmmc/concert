// Hong Kong Coliseum (香港體育館) — centre-stage 360° configuration.
// Modelled from the official LCSD arena plan (hkc_center_stage.pdf, "HKC_NCS_AW_July2024")
// and LCSD technical data:
//   · arena floor 40 m × 40 m · indoor ceiling 23 m · inverted-pyramid roof 41 m
//   · 40 sections: Red 40-49, Blue 50-59, Green 60-69, Yellow 70-79
//   · rows 1-13 lower tier · 14-15 promenade level (11 wheelchair platforms)
//   · rows 16-33 upper tier (corner sections deeper, to row 39)
//   · seat numbers are fixed "column" slots 81-98 repeated in every row:
//     one half of each section runs 90,91…98, the other half …81,82…89
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRingR, ringStripGeo } from '../scene.js';

const DEG = Math.PI / 180;

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
    const MAX_ROWS = 39;
    const ROWS_UPPER_TOTAL = 33;   // straights stop at 33
    const isCornerSec = (sec) => [40, 49, 50, 59, 60, 69, 70, 79].includes(sec);

    const WP_SECTIONS = [41, 44, 47, 51, 54, 56, 61, 64, 67, 72, 75];
    const WP_SET = new Set(WP_SECTIONS);
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

    // arena-floor wheelchair zones
    {
      const m = new THREE.MeshStandardMaterial({ color: 0x2b6ea8, roughness: 0.8 });
      const edge = new THREE.LineBasicMaterial({ color: 0x9fd4ff });
      [[16.2, -16.2], [-16.2, 16.2]].forEach(([x, z]) => {
        const g = new THREE.BoxGeometry(4.4, 0.06, 2.2);
        const p = new THREE.Mesh(g, m); p.position.set(x, 0.05, z); p.rotation.y = 45 * DEG; scene.add(p);
        const line = new THREE.LineSegments(new THREE.EdgesGeometry(g), edge);
        line.position.set(x, 0.085, z); line.rotation.y = 45 * DEG; scene.add(line);
      });
    }

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
      let n = 0;
      for (let side = 0; side < 4; side++) {
        const S = SIDES[side];
        for (let j = 0; j < SECS_PER_SIDE; j++) {
          const sec = S.base + j;
          if (!WP_SET.has(sec)) continue;
          const id = ++n;
          const tMid = (S.center / DEG - 45 + (j + 0.5) * SEC_DEG) * DEG;
          const halfW = SEC_DEG * DEG * 0.35;
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
          p.position.y = WALK.y + 0.045; p.userData.wp = id;
          scene.add(p); wpMeshes.push(p);
          const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95),
            new THREE.MeshBasicMaterial({ map: wpLabelTexture(`WP${id}`) }));
          const rMid = ringR(tMid, (WALK.S0 + WALK.S1) / 2);
          decal.position.set(rMid * Math.cos(tMid), WALK.y + 0.06, rMid * Math.sin(tMid));
          decal.rotation.x = -Math.PI / 2; decal.rotation.z = -tMid - Math.PI / 2;
          scene.add(decal);
        }
      }
    }

    /* seats (instanced) */
    const SLOT_LEFT_START = 90, SLOT_LEFT_MAX = 98, SLOT_RIGHT_START = 89, SLOT_RIGHT_MIN = 81;
    const seatStep = 0.50, aisleInset = 0.45, seatWidth = 0.44;
    const placements = [];
    for (let side = 0; side < 4; side++) {
      const S = SIDES[side];
      for (let j = 0; j < SECS_PER_SIDE; j++) {
        const secNo = S.base + j;
        const corner = isCornerSec(secNo);
        const lastRow = corner ? MAX_ROWS : ROWS_UPPER_TOTAL;
        const w0 = (S.center / DEG - 45 + j * SEC_DEG) * DEG;
        const w1 = w0 + SEC_DEG * DEG;
        const wpSec = WP_SET.has(secNo);
        for (let row = 0; row < lastRow; row++) {
          const rg = rowGeo(row);
          const rMid = ringR((w0 + w1) / 2, rg.S);
          const tL = w0 + aisleInset / rMid, tR = w1 - aisleInset / rMid;
          if (wpSec && (row === 13 || row === 14)) continue;
          const put = (t, slot) => {
            const rad = ringR(t, rg.S) + 0.16;
            const x = rad * Math.cos(t), z = rad * Math.sin(t);
            placements.push({ x, y: rg.y, z, yaw: Math.atan2(-x, -z), sec: secNo, row: row + 1, seat: slot, tier: rg.name, side });
          };
          for (let i = 0; ; i++) {
            const slot = SLOT_LEFT_START + i; if (slot > SLOT_LEFT_MAX) break;
            const t = tL + (i + 0.5) * seatStep / rMid; if (t > (w0 + w1) / 2) break; put(t, slot);
          }
          for (let i = 0; ; i++) {
            const slot = SLOT_RIGHT_START - i; if (slot < SLOT_RIGHT_MIN) break;
            const t = tR - (i + 0.5) * seatStep / rMid; if (t < (w0 + w1) / 2) break; put(t, slot);
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
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
      placements.forEach((p, i) => {
        E.set(0, p.yaw, 0); Q.setFromEuler(E); V.set(p.x, p.y, p.z);
        M.compose(V, Q, one); seats.setMatrixAt(i, M);
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
