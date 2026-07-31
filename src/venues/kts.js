// Kai Tak Stadium (啟德主場館) — fixed stadium seating bowl modelled from
// misc/kts/stadium_seating_plan.pdf. The drawing identifies lower-level
// sections 101-110 and 201-240 (204-211 are replaced by the inset 100-level
// blocks), upper-level sections 501-540, wheelchair seating, hospitality
// areas, upper-level gates A-H/J/K, and ground-level gate X.
import * as THREE from 'three';
import { addGround, createSeatInstances, labelTexture } from '../scene.js';
import { KTS_ROW_COUNTS, KTS_ROW_ENDS } from './kts-seat-data.js';

// Upper-gate labels use the large variant of the shared label texture.
const GATE_LABEL = { font: '900 112px system-ui', subFont: '600 34px system-ui', subColor: '#d3dcec', textY: 126 };

const DEG = Math.PI / 180;
export const KTS_ROW_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T',
  'V', 'W', 'X', 'Y', 'Z', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH',
  'JJ', 'KK', 'LL', 'MM', 'NN', 'PP', 'QQ',
];

// Totals printed in the BOWL SEAT / COMPANION / WHEELCHAIR tables beside
// every L1/L2/L5 gate in the source drawing. Hospitality loge and corporate
// suite seats are separate from these fixed-bowl figures.
export const KTS_PDF_TOTALS = {
  bowl: 47459,
  companion: 512,
  wheelchair: 512,
  fixed: 48483,
};

export const KTS_GATES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];

const MAIN_SECTION_IDS = Array.from({ length: 40 }, (_, i) => 201 + i)
  .filter((id) => id < 204 || id > 211);
const INNER_SECTION_IDS = Array.from({ length: 10 }, (_, i) => 101 + i);
const UPPER_SECTION_IDS = Array.from({ length: 40 }, (_, i) => 501 + i);

export const KTS_SECTION_IDS = [
  ...INNER_SECTION_IDS,
  ...MAIN_SECTION_IDS,
  ...UPPER_SECTION_IDS,
];

// Green accessible-seating bands are called out around the L2/L5 concourses
// on the source drawing. These anchors keep them distributed at the same
// north, east, south, and west stand portals.
export const KTS_ACCESSIBLE_SECTIONS = [
  201, 203, 212, 214, 216, 218, 220, 222,
  224, 226, 228, 230, 232, 234, 236, 238, 240,
];

function normaliseDegrees(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function mainSectionAngle(id) {
  return (144 - (id - 201) * 9) * DEG;
}

function innerSectionAngle(id) {
  return (117 - (id - 101) * 7) * DEG;
}

function upperSectionAngle(id) {
  return (144 - (id - 501) * 9) * DEG;
}

// L1/L2 gate tables map one-to-one to the 42 lower-bowl seating blocks.
// These are the exact BOWL SEAT values printed beneath those gates.
export const KTS_LOWER_BOWL_TOTALS = {
  101: 374, 102: 374, 103: 103, 104: 150, 105: 65,
  106: 150, 107: 103, 108: 374, 109: 374, 110: 329,
  201: 425, 202: 661, 203: 329,
  212: 649, 213: 343, 214: 371, 215: 509,
  216: 810, 217: 810, 218: 810, 219: 810, 220: 510,
  221: 371, 222: 343, 223: 717,
  224: 783, 225: 783, 226: 783, 227: 783, 228: 783,
  229: 783, 230: 783, 231: 728, 232: 400, 233: 428,
  234: 726, 235: 1101, 236: 1095, 237: 1095,
  238: 1101, 239: 726, 240: 453,
};

export const KTS_UPPER_GATE_TOTALS = [
  461, 574, 574, 633, 600, 692, 449, 363, 363, 363,
  449, 692, 600, 634, 575, 575, 641, 772, 692, 615,
  692, 772, 641, 575, 575, 634, 600, 692, 615, 692,
  615, 692, 615, 692, 600, 633, 574, 574, 461,
];

function makeSection(id, tier, angle, span, color, officialTotal = null) {
  const rowEnd = KTS_ROW_ENDS[id];
  const rowCounts = KTS_ROW_COUNTS[id];
  return {
    id,
    tier,
    angle,
    span,
    rows: KTS_ROW_LABELS.indexOf(rowEnd) + 1,
    rowEnd,
    color,
    rowCounts: [...rowCounts],
    officialTotal,
  };
}

export const KTS_SECTIONS = [
  ...INNER_SECTION_IDS.map((id) => makeSection(
    id, 'Inner Bowl', innerSectionAngle(id), 6.4 * DEG, '#d92b9b', KTS_LOWER_BOWL_TOTALS[id],
  )),
  ...MAIN_SECTION_IDS.map((id) => {
    return makeSection(
      id, 'Lower Level', mainSectionAngle(id), 8.2 * DEG, '#a93694', KTS_LOWER_BOWL_TOTALS[id],
    );
  }),
  ...UPPER_SECTION_IDS.map((id) => makeSection(
    id, 'Upper Level', upperSectionAngle(id), 8.2 * DEG, '#a88bc8', null,
  )),
];

const SECTION_BY_ID = new Map(KTS_SECTIONS.map((section) => [section.id, section]));

function sectionGroup(section) {
  const angle = normaliseDegrees(section.angle / DEG);
  if (angle >= 45 && angle <= 135) return 'north';
  if (angle > -45 && angle < 45) return 'east';
  if (angle >= -135 && angle <= -45) return 'south';
  return 'west';
}

function groupSections(section) {
  return KTS_SECTIONS
    .filter((candidate) => candidate.tier === section.tier && sectionGroup(candidate) === sectionGroup(section))
    .sort((a, b) => b.angle - a.angle);
}

export function ktsSection(id) {
  return SECTION_BY_ID.get(Number(id)) || null;
}

export function ktsRowLabels(sectionId) {
  const section = ktsSection(sectionId);
  return section ? KTS_ROW_LABELS.slice(0, section.rows) : [];
}

export function ktsSeatCount(sectionId, row) {
  const section = ktsSection(sectionId);
  const rowIndex = section ? ktsRowLabels(sectionId).indexOf(String(row).toUpperCase()) : -1;
  if (!section || rowIndex < 0) return 0;
  return section.rowCounts[rowIndex];
}

export function ktsSeatNumbers(sectionId, row) {
  const section = ktsSection(sectionId);
  const count = ktsSeatCount(sectionId, row);
  if (!section || !count) return [];
  let first = 1;
  for (const candidate of groupSections(section)) {
    if (candidate.id === section.id) break;
    first += ktsSeatCount(candidate.id, row);
  }
  return Array.from({ length: count }, (_, i) => first + i);
}

export function ktsSeatExists(sectionId, row, seat) {
  if (!Number.isInteger(Number(sectionId)) || !Number.isInteger(Number(seat))) return false;
  return ktsSeatNumbers(Number(sectionId), row).includes(Number(seat));
}

export function ktsSeatTotal() {
  return KTS_SECTIONS.reduce((total, section) => total +
    ktsRowLabels(section.id).reduce((sum, row) => sum + ktsSeatCount(section.id, row), 0), 0);
}

function stadiumRadius(theta, a, b, power = 3.6) {
  const c = Math.abs(Math.cos(theta)) / a;
  const s = Math.abs(Math.sin(theta)) / b;
  return Math.pow(Math.pow(c, power) + Math.pow(s, power), -1 / power);
}

function stadiumPoint(theta, a, b, y) {
  const radius = stadiumRadius(theta, a, b);
  return new THREE.Vector3(radius * Math.cos(theta), y, radius * Math.sin(theta));
}

function stadiumStripGeometry(rings, segments = 240) {
  const positions = [];
  const indices = [];
  rings.forEach((ring) => {
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const point = stadiumPoint(theta, ring.a, ring.b, ring.y);
      positions.push(point.x, point.y, point.z);
    }
  });
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * (segments + 1) + i;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function rowGeometry(section, rowIndex) {
  const progress = rowIndex / Math.max(1, section.rows - 1);
  if (section.tier === 'Inner Bowl') {
    return { a: 29 + progress * 12, b: 21 + progress * 9, y: 0.7 + progress * 6.3 };
  }
  if (section.tier === 'Lower Level') {
    return { a: 31 + progress * 16, b: 23 + progress * 11, y: 0.8 + progress * 9.0 };
  }
  return { a: 47.5 + progress * 14.7, b: 35 + progress * 12.2, y: 12.0 + progress * 12.4 };
}

function addField(scene) {
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(51, 34),
    new THREE.MeshStandardMaterial({ color: 0x153b2d, roughness: 0.92 }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.y = 0.025;
  field.userData.label = 'Playing Field 球場';
  scene.add(field);

  const points = [
    new THREE.Vector3(-25.5, 0.06, -17), new THREE.Vector3(25.5, 0.06, -17),
    new THREE.Vector3(25.5, 0.06, 17), new THREE.Vector3(-25.5, 0.06, 17),
  ];
  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x8fc9a7 }),
  ));
  scene.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.06, -17), new THREE.Vector3(0, 0.06, 17),
      new THREE.Vector3(-25.5, 0.06, 0), new THREE.Vector3(25.5, 0.06, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0x5e9978, transparent: true, opacity: 0.65 }),
  ));
  return field;
}

function addAccessiblePlatforms(scene) {
  const meshes = [];
  const material = new THREE.MeshStandardMaterial({
    color: 0x31b85b,
    emissive: 0x12642f,
    emissiveIntensity: 0.35,
    roughness: 0.78,
  });
  for (const sectionId of KTS_ACCESSIBLE_SECTIONS) {
    const section = ktsSection(sectionId);
    const point = stadiumPoint(section.angle, 47.2, 34.5, 10.9);
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.75), material);
    platform.position.copy(point);
    platform.rotation.y = -section.angle;
    platform.userData.wp = `KTS-${sectionId}`;
    platform.userData.main = `Accessible seating · Section ${sectionId}`;
    platform.userData.sub = 'Wheelchair / accessible seating at the stadium concourse';
    scene.add(platform);
    meshes.push(platform);
  }
  return meshes;
}

export const kts = {
  id: 'kts',
  name: 'Kai Tak Stadium',
  zh: '啟德主場館',
  subtitle: 'Fixed stadium seating plan',
  dims: '47,459 bowl seats · 512 companion + 512 wheelchair positions · sections 101-110, 201-240 and 501-540',
  roofLabel: 'Retractable roof structure',
  defaultLayout: 'stadium',
  layouts: [{ id: 'stadium', label: 'Stadium', zh: '主場館' }],
  sides: [
    { color: '#d92b9b', name: 'Inner Bowl 101-110' },
    { color: '#a93694', name: 'Lower Level 201-240' },
    { color: '#a88bc8', name: 'Upper Level 501-540' },
    { color: '#31b85b', name: 'Accessible seating' },
    { color: '#ec3978', name: 'Hospitality' },
  ],

  build(ctx) {
    const { scene } = ctx;

    addGround(scene, 190, 0x070c10, -0.04);

    const terraceMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.96 });
    scene.add(new THREE.Mesh(stadiumStripGeometry([
      { a: 28.4, b: 20.4, y: 0.2 },
      { a: 47.0, b: 34.1, y: 9.3 },
    ]), terraceMaterial));
    scene.add(new THREE.Mesh(stadiumStripGeometry([
      { a: 47.2, b: 34.4, y: 11.0 },
      { a: 62.2, b: 47.2, y: 24.4 },
    ]), terraceMaterial));

    const concourseMaterial = new THREE.MeshStandardMaterial({ color: 0x263548, roughness: 0.9 });
    scene.add(new THREE.Mesh(stadiumStripGeometry([
      { a: 46.5, b: 33.8, y: 10.2 },
      { a: 48.2, b: 35.5, y: 10.2 },
    ]), concourseMaterial));

    // The plan's north hospitality stack: L2 loge boxes and L3 corporate
    // suites sit between the inset 100-level blocks and upper stand.
    const hospitality = new THREE.Group();
    const suiteMaterial = new THREE.MeshStandardMaterial({ color: 0x6f245f, roughness: 0.72 });
    for (let i = 0; i < 9; i++) {
      const suite = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 2.2), suiteMaterial);
      suite.position.set((i - 4) * 4.8, 9.0, 34.0);
      hospitality.add(suite);
    }
    scene.add(hospitality);

    const stage = addField(scene);
    const wpMeshes = addAccessiblePlatforms(scene);
    const placements = [];

    for (const section of KTS_SECTIONS) {
      for (const row of ktsRowLabels(section.id)) {
        const rowIndex = ktsRowLabels(section.id).indexOf(row);
        const numbers = ktsSeatNumbers(section.id, row);
        const geo = rowGeometry(section, rowIndex);
        const usableSpan = section.span * 0.82;
        numbers.forEach((seat, seatIndex) => {
          const fraction = (seatIndex + 0.5) / numbers.length;
          const theta = section.angle + usableSpan / 2 - fraction * usableSpan;
          const point = stadiumPoint(theta, geo.a, geo.b, geo.y);
          const localSpan = usableSpan / numbers.length;
          const adjacent = stadiumPoint(theta + localSpan, geo.a, geo.b, geo.y);
          const spacing = adjacent.distanceTo(point);
          placements.push({
            x: point.x,
            y: point.y,
            z: point.z,
            yaw: Math.atan2(-point.x, -point.z),
            sec: section.id,
            row,
            seat,
            tier: section.tier,
            zone: `${section.tier} · ${section.id}`,
            color: section.color,
            alt: rowIndex % 2,
            widthScale: Math.min(1.04, Math.max(0.62, spacing * 1.35)),
          });
        });
      }
    }

    const { seats, baseColors, seatIndex } = createSeatInstances(placements, {
      boxes: [
        { size: [0.48, 0.10, 0.34], pos: [0, 0.22, 0.03] },
        { size: [0.48, 0.40, 0.08], pos: [0, 0.41, -0.15] },
      ],
      shade: (p) => (p.tier === 'Upper Level' ? 0.72 : p.tier === 'Inner Bowl' ? 0.9 : 0.82),
    });
    scene.add(seats);

    const roofGroup = new THREE.Group();
    const canopy = new THREE.Mesh(stadiumStripGeometry([
      { a: 65.5, b: 50.5, y: 29.0 },
      { a: 50.5, b: 36.5, y: 30.5 },
    ]), new THREE.MeshBasicMaterial({
      color: 0x315b73,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    roofGroup.add(canopy);
    const ribs = [];
    for (let i = 0; i < 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      ribs.push(stadiumPoint(theta, 65.5, 50.5, 29.0));
      ribs.push(stadiumPoint(theta, 50.5, 36.5, 30.5));
    }
    roofGroup.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(ribs),
      new THREE.LineBasicMaterial({ color: 0x4d86a0, transparent: true, opacity: 0.45 }),
    ));
    scene.add(roofGroup);

    const labelGroup = new THREE.Group();
    const gateAngles = [
      ['A', -145], ['B', 180], ['C', 145], ['D', 108], ['E', 72],
      ['F', 35], ['G', 0], ['H', -35], ['J', -72], ['K', -108],
    ];
    for (const [gate, degrees] of gateAngles) {
      const theta = degrees * DEG;
      const point = stadiumPoint(theta, 69, 54, 29.5);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTexture(gate, 'UPPER GATE', '#f0334f', GATE_LABEL),
        transparent: true,
        depthTest: false,
      }));
      sprite.position.copy(point);
      sprite.scale.set(9, 4.5, 1);
      labelGroup.add(sprite);
    }
    const xPoint = stadiumPoint(126 * DEG, 69, 54, 32.0);
    const xGate = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture('X', 'GROUND GATE', '#3f57bc', GATE_LABEL),
      transparent: true,
      depthTest: false,
    }));
    xGate.position.copy(xPoint);
    xGate.scale.set(8.5, 4.25, 1);
    labelGroup.add(xGate);
    scene.add(labelGroup);

    const describe = (placement) => ({
      main: `Sec ${placement.sec} · Row ${placement.row} · Seat ${placement.seat}`,
      sub: `${placement.tier} — Kai Tak Stadium`,
    });

    return { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe };
  },
};
