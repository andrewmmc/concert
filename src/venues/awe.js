// AsiaWorld-Arena (亞洲國際博覽館 Arena Hall 1) — AWA-ES-16 Draft 02.
import * as THREE from 'three';
import { addGround, createSeatInstances, labelTexture } from '../scene.js';
import { AWE_PDF_ROWS, AWE_PDF_SEAT_TOTAL } from './awe-seat-data.js';

export const AWE_STAND_ROWS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];
export const AWE_FLOOR_ROWS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
];

const SEATING = { name: 'Seating', color: '#ff999a' };

// Facing directions follow the PDF clockwise from stage-right Block 1.
export const AWE_STAND_BLOCKS = [
  { id: 1, yaw: 0 },
  { id: 2, yaw: 0 },
  { id: 3, yaw: 0 },
  { id: 4, yaw: 0 },
  { id: 5, yaw: 0 },
  { id: 6, yaw: 0 },
  { id: 7, yaw: 0 },
  { id: 8, yaw: Math.PI / 4 },
  { id: 9, yaw: Math.PI / 2 },
  { id: 10, yaw: Math.PI * 0.75 },
  { id: 11, yaw: Math.PI },
  { id: 12, yaw: Math.PI },
  { id: 13, yaw: Math.PI },
  { id: 14, yaw: Math.PI },
  { id: 15, yaw: Math.PI },
  { id: 16, yaw: Math.PI },
  { id: 17, yaw: Math.PI },
];

export const AWE_FLOOR_BLOCKS = [
  { id: 'A', rows: AWE_FLOOR_ROWS },
  { id: 'B', rows: AWE_FLOOR_ROWS },
  { id: 'C', rows: AWE_FLOOR_ROWS },
  { id: 'D', rows: AWE_STAND_ROWS.slice(0, 12) },
];

const STAND_BY_ID = new Map(AWE_STAND_BLOCKS.map((block) => [String(block.id), block]));
const FLOOR_BY_ID = new Map(AWE_FLOOR_BLOCKS.map((block) => [block.id, block]));

// Page-space transform measured from the PDF. Stage is +x; PDF page-right is
// the north stand (-z). The two axes use their printed seat pitches.
const PDF_CENTER_X = 1192;
const PDF_CENTER_Y = 1700;
const PDF_X_SCALE = 0.0286;
const PDF_Y_SCALE = 0.0242;
const STAGE_X = 35;

function pdfPoint([pdfX, pdfY]) {
  return {
    x: (pdfY - PDF_CENTER_Y) * PDF_Y_SCALE,
    z: (PDF_CENTER_X - pdfX) * PDF_X_SCALE,
  };
}

function blockRows(id) {
  return AWE_PDF_ROWS[String(id)] || [];
}

export function aweRowLabels(id) {
  const key = String(id).toUpperCase();
  if (STAND_BY_ID.has(key)) return AWE_STAND_ROWS.slice();
  return FLOOR_BY_ID.get(key)?.rows.slice() || [];
}

export function aweSeatNumbers(id, row) {
  const key = String(id).toUpperCase();
  const rowIndex = aweRowLabels(key).indexOf(String(row).toUpperCase());
  const count = rowIndex < 0 ? 0 : blockRows(key)[rowIndex]?.length || 0;
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function aweSeatExists(id, row, seat) {
  return aweSeatNumbers(id, row).includes(Number(seat));
}

export function aweSeatTotal() {
  return Object.values(AWE_PDF_ROWS)
    .reduce((total, rows) => total +
      rows.reduce((rowTotal, seats) => rowTotal + seats.length, 0), 0);
}

export function awePlacements() {
  const placements = [];

  for (const block of AWE_STAND_BLOCKS) {
    blockRows(block.id).forEach((points, rowIndex) => {
      const upperTier = rowIndex >= 12;
      const y = 0.55 + rowIndex * 0.29 + (upperTier ? 0.75 : 0);
      points.forEach((point, seatIndex) => {
        placements.push({
          ...pdfPoint(point),
          y,
          yaw: block.yaw,
          sec: block.id,
          row: AWE_STAND_ROWS[rowIndex],
          seat: seatIndex + 1,
          tier: SEATING.name,
          color: SEATING.color,
          alt: rowIndex % 2,
          widthScale: 0.68,
        });
      });
    });
  }

  for (const block of AWE_FLOOR_BLOCKS) {
    blockRows(block.id).forEach((points, rowIndex) => {
      points.forEach((point, seatIndex) => {
        placements.push({
          ...pdfPoint(point),
          y: 0.05,
          yaw: Math.PI / 2,
          sec: block.id,
          row: block.rows[rowIndex],
          seat: seatIndex + 1,
          tier: SEATING.name,
          color: SEATING.color,
          alt: rowIndex % 2,
          widthScale: 0.72,
        });
      });
    });
  }

  return placements;
}

function addStage(scene) {
  const stage = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.9, 16.5),
    new THREE.MeshStandardMaterial({ color: 0xc9005c, roughness: 0.72 }),
  );
  stage.position.set(STAGE_X, 0.47, 0);
  stage.userData.label = 'End Stage 舞台';
  scene.add(stage);
  return stage;
}

function addLabels(scene, placements) {
  const group = new THREE.Group();
  for (const block of [...AWE_STAND_BLOCKS, ...AWE_FLOOR_BLOCKS]) {
    const seats = placements.filter((placement) => placement.sec === block.id);
    const x = seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length;
    const z = seats.reduce((sum, seat) => sum + seat.z, 0) / seats.length;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(
        `BLOCK ${block.id}`,
        STAND_BY_ID.has(String(block.id)) ? 'STAND' : 'FLOOR',
        SEATING.color,
      ),
      transparent: true,
      depthTest: false,
    }));
    sprite.position.set(x, STAND_BY_ID.has(String(block.id)) ? 10.2 : 2.8, z);
    sprite.scale.set(5.6, 2.8, 1);
    group.add(sprite);
  }
  scene.add(group);
  return group;
}

export const awe = {
  id: 'awe',
  name: 'AsiaWorld-Arena',
  zh: '亞洲國際博覽館',
  subtitle: 'Hall 1 AWA-ES-16 Draft 02 end-stage seating plan',
  dims: `Stands 1-17 and floor Blocks A-D · ${AWE_PDF_SEAT_TOTAL.toLocaleString()} PDF seats`,
  roofLabel: 'Arena roof structure',
  defaultCamera: { position: [0, 118, 42], target: [-2, 3, 0] },
  defaultLayout: 'end-stage',
  layouts: [{ id: 'end-stage', label: 'End Stage', zh: '正面舞台' }],
  sides: [{ color: SEATING.color, name: SEATING.name }],

  build({ scene }) {
    addGround(scene, 150, 0x070b11, -0.04);

    const arenaFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(78, 60),
      new THREE.MeshStandardMaterial({ color: 0x111823, roughness: 0.94 }),
    );
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.set(-2, 0, 0);
    scene.add(arenaFloor);

    const placements = awePlacements();
    const { seats, baseColors, seatIndex } = createSeatInstances(placements, {
      boxes: [
        { size: [0.45, 0.10, 0.32], pos: [0, 0.21, 0.03] },
        { size: [0.45, 0.37, 0.08], pos: [0, 0.39, -0.14] },
      ],
      shade: (placement) => (placement.y < 0.2 ? 0.92 : 0.8),
    });
    scene.add(seats);

    const stage = addStage(scene);
    const labelGroup = addLabels(scene, placements);
    const roofGroup = new THREE.Group();
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(82, 0.3, 66),
      new THREE.MeshBasicMaterial({
        color: 0x315b73,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
      }),
    );
    roof.position.set(-2, 26, 0);
    roofGroup.add(roof);
    scene.add(roofGroup);

    const describe = (placement) => ({
      main: `Block ${placement.sec} · Row ${placement.row} · Seat ${placement.seat}`,
      sub: `${placement.tier} — AsiaWorld-Arena`,
    });

    return {
      placements,
      seats,
      baseColors,
      seatIndex,
      wpMeshes: [],
      stage,
      roofGroup,
      labelGroup,
      describe,
    };
  },
};
