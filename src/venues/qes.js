// Queen Elizabeth Stadium (伊利沙伯體育館) — multiple arena layouts modelled
// from the official LCSD seating-plan PDFs in misc/qes.  The drawings use
// stand sections 1-8 around the arena and event-floor sections 9-10 for the
// concert/ring layouts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEG = Math.PI / 180;

export const QES_STAND_SECTIONS = [
  { id: 1, label: 'Section 1', total: 395, rows: 22, side: 'east', center: -9, color: '#52b7ff' },
  { id: 2, label: 'Section 2', total: 645, rows: 30, side: 'south', center: 8.5, color: '#41d37d' },
  { id: 3, label: 'Section 3', total: 337, rows: 20, side: 'south', center: -8.5, color: '#8fdc63' },
  { id: 4, label: 'Section 4', total: 395, rows: 22, side: 'west', center: -9, color: '#f1c84c' },
  { id: 5, label: 'Section 5', total: 398, rows: 22, side: 'west', center: 9, color: '#f59b5f' },
  { id: 6, label: 'Section 6', total: 325, rows: 18, side: 'north', center: -8.5, color: '#ee6a78' },
  { id: 7, label: 'Section 7', total: 274, rows: 17, side: 'north', center: 8.5, color: '#b789ff' },
  { id: 8, label: 'Section 8', total: 413, rows: 22, side: 'east', center: 9, color: '#22c7c9' },
];

export const QES_LAYOUTS = [
  {
    id: 'end-stage',
    label: 'End Stage',
    zh: '正面舞台',
    stage: { kind: 'end', label: 'End Stage 正面舞台', x: -12.8, z: 0, w: 8.3, d: 20.2, rotation: 90 * DEG, arrow: '正面 →' },
    floorSections: [
      { id: 9, label: 'Section 9', total: 800, rows: 20, side: 'floor', x: 4.8, z: -5.6, w: 16.2, d: 11.1, color: '#cf8f52' },
      { id: 10, label: 'Section 10', total: 690, rows: 18, side: 'floor', x: 4.8, z: 6.6, w: 16.2, d: 9.3, color: '#d9a45f' },
    ],
  },
  {
    id: '3-side-end-stage',
    label: '3-side End Stage',
    zh: '三面台',
    stage: { kind: 'end', label: '3-side End Stage 三面台', x: -12.8, z: 0, w: 8.3, d: 20.2, rotation: 90 * DEG, arrow: '正面 →' },
    floorSections: [
      { id: 9, label: 'Section 9', total: 800, rows: 20, side: 'floor', x: 4.8, z: -5.6, w: 16.2, d: 11.1, color: '#cf8f52' },
      { id: 10, label: 'Section 10', total: 595, rows: 17, side: 'floor', x: 4.8, z: 6.5, w: 16.2, d: 9.0, color: '#d9a45f' },
    ],
  },
  {
    id: 'central-stage',
    label: 'Central Stage',
    zh: '中央舞台',
    stage: { kind: 'central', label: 'Central Stage 中央舞台', x: 0, z: 0, w: 7.4, d: 7.4, rotation: 0, arrow: '360°' },
    floorSections: [
      { id: 9, label: 'Section 9', total: 320, rows: 12, side: 'floor', x: 0, z: -10.6, w: 16.2, d: 4.0, color: '#cf8f52' },
      { id: 10, label: 'Section 10', total: 320, rows: 12, side: 'floor', x: 0, z: 10.6, w: 16.2, d: 4.0, color: '#d9a45f', yaw: Math.PI },
    ],
  },
  {
    id: 'boxing-ring',
    label: 'Boxing Ring',
    zh: '擂台',
    stage: { kind: 'ring', label: 'Boxing Ring 擂台', x: 0, z: 0, w: 7.4, d: 7.4, rotation: 0, arrow: 'RING' },
    floorSections: [
      { id: 9, label: 'Section 9', total: 240, rows: 10, side: 'floor', x: 0, z: -10.2, w: 15.8, d: 3.8, color: '#cf8f52' },
      { id: 10, label: 'Section 10', total: 222, rows: 9, side: 'floor', x: 0, z: 10.2, w: 15.8, d: 3.8, color: '#d9a45f', yaw: Math.PI },
    ],
  },
  {
    id: 'central-court',
    label: 'Central Court',
    zh: '中央場地',
    stage: { kind: 'court', label: 'Central Court 中央場地', x: 0, z: 0, w: 28.2, d: 19.7, rotation: 0, arrow: 'COURT' },
    floorSections: [],
  },
];

export function qesLayout(id) {
  return QES_LAYOUTS.find((layout) => layout.id === id) || QES_LAYOUTS[0];
}

export function rowSeatCounts(total, rows) {
  const base = Math.floor(total / rows);
  const extra = total % rows;
  return Array.from({ length: rows }, (_, i) => base + (i >= rows - extra ? 1 : 0));
}

export function layoutSeatTotal(layoutId) {
  const layout = qesLayout(layoutId);
  const stands = QES_STAND_SECTIONS.reduce((sum, section) => sum + section.total, 0);
  const floor = layout.floorSections.reduce((sum, section) => sum + section.total, 0);
  return stands + floor;
}

const SIDES = [
  { base: 1, color: '#52b7ff', name: 'Sections 1 and 8' },
  { base: 2, color: '#41d37d', name: 'Sections 2 and 3' },
  { base: 4, color: '#f1c84c', name: 'Sections 4 and 5' },
  { base: 6, color: '#ee6a78', name: 'Sections 6 and 7' },
  { base: 9, color: '#cf8f52', name: 'Arena Floor Sections 9 and 10' },
];

function sectionYaw(side, fallback = 0) {
  if (side === 'north') return Math.PI;
  if (side === 'south') return 0;
  if (side === 'east') return Math.PI / 2;
  if (side === 'west') return -Math.PI / 2;
  return fallback;
}

function sectionPosition(section, rowIndex, seatIndex, seatsInRow) {
  const rowPitch = 0.74;
  const seatPitch = 0.50;
  const standY = 1.0 + rowIndex * 0.38;
  const lateral = (seatIndex - (seatsInRow - 1) / 2) * seatPitch;

  if (section.side === 'north') {
    return { x: section.center + lateral, y: standY, z: 16.3 + rowIndex * rowPitch, yaw: Math.PI };
  }
  if (section.side === 'south') {
    return { x: section.center - lateral, y: standY, z: -16.3 - rowIndex * rowPitch, yaw: 0 };
  }
  if (section.side === 'east') {
    return { x: 20.5 + rowIndex * rowPitch, y: standY, z: section.center + lateral, yaw: Math.PI / 2 };
  }
  return { x: -20.5 - rowIndex * rowPitch, y: standY, z: section.center - lateral, yaw: -Math.PI / 2 };
}

function addBlockOutline(scene, x, z, w, d, color = 0x284466, y = 0.045) {
  const points = [
    new THREE.Vector3(x - w / 2, y, z - d / 2),
    new THREE.Vector3(x + w / 2, y, z - d / 2),
    new THREE.Vector3(x + w / 2, y, z + d / 2),
    new THREE.Vector3(x - w / 2, y, z + d / 2),
  ];
  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color }),
  ));
}

function labelTexture(text, sub, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d'); x.textAlign = 'center';
  x.fillStyle = color; x.font = '800 70px system-ui'; x.fillText(text, 256, 104);
  x.fillStyle = '#c8d4e8'; x.font = '600 36px system-ui'; x.fillText(sub, 256, 170);
  return new THREE.CanvasTexture(c);
}

function addFloorSectionPlacements(placements, section) {
  const counts = rowSeatCounts(section.total, section.rows);
  const rowPitch = section.d / Math.max(1, section.rows - 1);
  counts.forEach((count, rowIndex) => {
    const seatPitch = section.w / Math.max(1, count);
    for (let seatIndex = 0; seatIndex < count; seatIndex++) {
      placements.push({
        x: section.x - section.w / 2 + seatPitch * (seatIndex + 0.5),
        y: 0,
        z: section.z + section.d / 2 - rowPitch * rowIndex,
        yaw: section.yaw || 0,
        sec: section.id,
        row: String.fromCharCode(65 + rowIndex),
        seat: seatIndex + 1,
        tier: 'Arena Floor',
        zone: section.label,
        color: section.color,
        alt: rowIndex % 2,
        widthScale: Math.min(1.05, seatPitch * 1.42),
      });
    }
  });
}

function addStandPlacements(placements) {
  for (const section of QES_STAND_SECTIONS) {
    const counts = rowSeatCounts(section.total, section.rows);
    counts.forEach((count, rowIndex) => {
      for (let seatIndex = 0; seatIndex < count; seatIndex++) {
        const p = sectionPosition(section, rowIndex, seatIndex, count);
        placements.push({
          ...p,
          sec: section.id,
          row: rowIndex + 1,
          seat: seatIndex + 1,
          tier: rowIndex < 10 ? 'Lower Stand' : rowIndex < 18 ? 'Upper Stand' : 'Gallery',
          zone: section.label,
          color: section.color,
          alt: rowIndex % 2,
          widthScale: 1,
        });
      }
    });
  }
}

function makeStage(scene, layout) {
  const { stage: spec } = layout;
  const group = new THREE.Group();
  const h = spec.kind === 'court' ? 0.08 : 0.9;
  const mat = new THREE.MeshStandardMaterial({
    color: spec.kind === 'court' ? 0x13261f : 0x2a3242,
    roughness: 0.72,
    metalness: 0.02,
  });
  const stage = new THREE.Mesh(new THREE.BoxGeometry(spec.w, h, spec.d), mat);
  stage.position.set(spec.x, h / 2 + 0.02, spec.z);
  stage.rotation.y = spec.rotation;
  stage.userData.label = spec.label;
  group.add(stage);

  if (spec.kind === 'ring') {
    const ropeMat = new THREE.LineBasicMaterial({ color: 0xd7e4df });
    for (const y of [1.0, 1.45, 1.9]) {
      const pts = [
        new THREE.Vector3(-spec.w / 2, y, -spec.d / 2), new THREE.Vector3(spec.w / 2, y, -spec.d / 2),
        new THREE.Vector3(spec.w / 2, y, spec.d / 2), new THREE.Vector3(-spec.w / 2, y, spec.d / 2),
      ];
      const rope = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ropeMat);
      rope.position.set(spec.x, 0, spec.z);
      group.add(rope);
    }
  } else {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(spec.w + 0.3, 0.1, spec.d + 0.3),
      new THREE.MeshStandardMaterial({ color: 0x102019, emissive: 0x00c58a, emissiveIntensity: 0.45 }));
    trim.position.set(spec.x, h + 0.08, spec.z);
    trim.rotation.y = spec.rotation;
    group.add(trim);
  }

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.max(1, spec.w - 0.9), Math.max(1, spec.d - 0.9)),
    new THREE.MeshBasicMaterial({ map: labelTexture(spec.arrow, spec.label, '#00d299') }),
  );
  top.rotation.x = -Math.PI / 2;
  top.rotation.z = -spec.rotation;
  top.position.set(spec.x, h + 0.13, spec.z);
  group.add(top);

  scene.add(group);
  return stage;
}

export const qes = {
  id: 'qes',
  name: 'Queen Elizabeth Stadium',
  zh: '伊利沙伯體育館',
  subtitle: 'Multi-layout arena configuration',
  dims: 'Arena seating sections 1-8 · event-floor sections 9-10',
  defaultLayout: 'end-stage',
  layouts: QES_LAYOUTS.map(({ id, label, zh }) => ({ id, label, zh })),
  sides: SIDES,

  build(ctx, opts = {}) {
    const { scene } = ctx;
    const layout = qesLayout(opts.layout);
    const placements = [];

    const ground = new THREE.Mesh(new THREE.CircleGeometry(180, 64),
      new THREE.MeshStandardMaterial({ color: 0x070c10, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(37, 25),
      new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0; scene.add(floor);
    addBlockOutline(scene, 0, 0, 37, 25, 0x24644f);

    const terraceMat = new THREE.MeshStandardMaterial({ color: 0x182534, roughness: 0.95 });
    for (const section of QES_STAND_SECTIONS) {
      const counts = rowSeatCounts(section.total, section.rows);
      const maxSeats = Math.max(...counts);
      const w = section.side === 'north' || section.side === 'south' ? maxSeats * 0.54 : section.rows * 0.78;
      const d = section.side === 'north' || section.side === 'south' ? section.rows * 0.78 : maxSeats * 0.54;
      const centerRow = sectionPosition(section, (section.rows - 1) / 2, (maxSeats - 1) / 2, maxSeats);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), terraceMat);
      slab.position.set(centerRow.x, 0.12, centerRow.z);
      scene.add(slab);
    }

    addStandPlacements(placements);
    for (const floorSection of layout.floorSections) {
      addBlockOutline(scene, floorSection.x, floorSection.z, floorSection.w, floorSection.d, 0x806132, 0.075);
      addFloorSectionPlacements(placements, floorSection);
    }

    const stage = makeStage(scene, layout);

    const pan = new THREE.BoxGeometry(0.44, 0.10, 0.34); pan.translate(0, 0.22, 0.03);
    const back = new THREE.BoxGeometry(0.44, 0.38, 0.08); back.translate(0, 0.40, -0.15);
    const seatGeo = mergeGeometries([pan, back]);
    const seatMat = new THREE.MeshStandardMaterial({ roughness: 0.76, metalness: 0.04 });
    const seats = new THREE.InstancedMesh(seatGeo, seatMat, placements.length);
    const baseColors = new Float32Array(placements.length * 3);
    const seatIndex = new Map();
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    const V = new THREE.Vector3(), scale = new THREE.Vector3();
    placements.forEach((p, i) => {
      E.set(0, p.yaw, 0); Q.setFromEuler(E); V.set(p.x, p.y, p.z);
      scale.set(p.widthScale || 1, 1, 1);
      M.compose(V, Q, scale); seats.setMatrixAt(i, M);
      const c = new THREE.Color(p.color);
      c.multiplyScalar((p.tier === 'Arena Floor' ? 0.86 : 0.70) + (p.alt ?? 0) * 0.06);
      seats.setColorAt(i, c);
      baseColors.set([c.r, c.g, c.b], i * 3);
      seatIndex.set(`${p.sec}-${p.row}-${p.seat}`, i);
    });
    seats.instanceMatrix.needsUpdate = true;
    if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
    scene.add(seats);

    const roofGroup = new THREE.Group();
    {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(33, 0.08, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0x2a6573, transparent: true, opacity: 0.38 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 23; ring.scale.z = 0.68;
      roofGroup.add(ring);
      const ribs = [];
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2;
        ribs.push(new THREE.Vector3(Math.cos(t) * 28, 17, Math.sin(t) * 19));
        ribs.push(new THREE.Vector3(Math.cos(t) * 35, 24, Math.sin(t) * 24));
      }
      roofGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ribs),
        new THREE.LineBasicMaterial({ color: 0x315a86, transparent: true, opacity: 0.45 })));
    }
    scene.add(roofGroup);

    const labelGroup = new THREE.Group();
    for (const section of QES_STAND_SECTIONS) {
      const yaw = sectionYaw(section.side);
      const pos = sectionPosition(section, section.rows + 2, 0, 1);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTexture(String(section.id), section.label, section.color),
        transparent: true,
        depthTest: false,
      }));
      sprite.position.set(pos.x, 10.5, pos.z);
      sprite.scale.set(6.5, 3.25, 1);
      sprite.material.rotation = yaw;
      labelGroup.add(sprite);
    }
    scene.add(labelGroup);

    const wpMeshes = [];
    const describe = (p) => ({
      main: `Sec ${p.sec} · Row ${p.row} · Seat ${p.seat}`,
      sub: `${p.zone} — ${p.tier}`,
    });

    return { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe };
  },
};
