// AsiaWorld-Arena (亞洲國際博覽館 Arena Hall 1) — end-stage concert plan
// reconstructed from the two reference drawings in misc/awe_hall1
// (AWA-ES-16 official floor plan and the EDAN LUI concert seating map).
//
// The elongated-octagon bowl surrounds a central event floor with the stage on
// the east side. Riser-seating stands are numbered 1-16 clockwise around the
// bowl; the chamfered west corner carries Blocks 8-10. The event floor is split
// into Blocks A-D, with Block A nearest the stage.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Row letters skip I and O (never used on the printed plan) so the modelled
// labels line up with the reference drawing.
function genRows(count) {
  const rows = [];
  let code = 65;
  while (rows.length < count) {
    const letter = String.fromCharCode(code);
    if (letter !== 'I' && letter !== 'O') rows.push(letter);
    code += 1;
  }
  return rows;
}

// Tier colours taken from the concert map's price bands.
const TIER = {
  standard: { name: 'Standard 標準', color: '#ef9a9a' },
  side: { name: 'Side Stand 側看台', color: '#9a9ae8' },
  corner: { name: 'Corner Stand 角落看台', color: '#efc45a' },
  floor: { name: 'Floor 內場', color: '#f4a0a0' },
};

// Perimeter riser stands. `side` places the block on the bowl wall, `slot` is
// its position along that wall (0 = nearest the stage), `rows`/`seats` are the
// modelled grid dimensions read from the reference plan.
export const AWE_STAND_BLOCKS = [
  // North wall (blocks 2-7), block 2 nearest the stage.
  { id: 2, side: 'north', slot: 0, rows: 18, seats: 21, tier: 'standard' },
  { id: 3, side: 'north', slot: 1, rows: 18, seats: 21, tier: 'standard' },
  { id: 4, side: 'north', slot: 2, rows: 18, seats: 26, tier: 'standard' },
  { id: 5, side: 'north', slot: 3, rows: 18, seats: 25, tier: 'standard' },
  { id: 6, side: 'north', slot: 4, rows: 18, seats: 23, tier: 'side' },
  { id: 7, side: 'north', slot: 5, rows: 16, seats: 30, tier: 'side' },
  // Chamfered west wall (blocks 8-10), block 8 nearest the north wall.
  { id: 8, side: 'west', slot: 0, rows: 14, seats: 24, tier: 'corner' },
  { id: 9, side: 'west', slot: 1, rows: 14, seats: 24, tier: 'corner' },
  { id: 10, side: 'west', slot: 2, rows: 16, seats: 24, tier: 'corner' },
  // South wall (blocks 11-16), block 16 nearest the stage.
  { id: 11, side: 'south', slot: 5, rows: 16, seats: 30, tier: 'side' },
  { id: 12, side: 'south', slot: 4, rows: 18, seats: 23, tier: 'side' },
  { id: 13, side: 'south', slot: 3, rows: 18, seats: 25, tier: 'standard' },
  { id: 14, side: 'south', slot: 2, rows: 18, seats: 26, tier: 'standard' },
  { id: 15, side: 'south', slot: 1, rows: 18, seats: 21, tier: 'standard' },
  { id: 16, side: 'south', slot: 0, rows: 18, seats: 12, tier: 'standard' },
];

// Event-floor blocks, Block A nearest the stage stepping away to Block D.
export const AWE_FLOOR_BLOCKS = [
  { id: 'A', slot: 0, rows: 12, seats: 26, tier: 'floor' },
  { id: 'B', slot: 1, rows: 12, seats: 26, tier: 'floor' },
  { id: 'C', slot: 2, rows: 12, seats: 26, tier: 'floor' },
  { id: 'D', slot: 3, rows: 12, seats: 20, tier: 'floor' },
];

const STAND_BY_ID = new Map(AWE_STAND_BLOCKS.map((b) => [String(b.id), b]));
const FLOOR_BY_ID = new Map(AWE_FLOOR_BLOCKS.map((b) => [b.id, b]));

// Geometry constants (metres) that lay the bowl and floor out on the page.
const NORTH_Z = 10;
const SOUTH_Z = -10;
const WEST_X = -24;
const STAGE_X = 26;
const SLOT_PITCH = 6.4;
const SLOT_CENTER_X = -2;
const WEST_SLOT_PITCH = 7;
const FLOOR_FRONT_X = 15;
const FLOOR_DEPTH = 7;
const FLOOR_GAP = 2;
const FLOOR_HALF_Z = 8.5;
const ROW_PITCH = 0.75;
const ROW_RISE = 0.42;
const SEAT_SLOT_W = 5.4;

export function aweRowLabels(id) {
  const block = STAND_BY_ID.get(String(id)) || FLOOR_BY_ID.get(String(id).toUpperCase());
  return block ? genRows(block.rows) : [];
}

export function aweSeatNumbers(id, row) {
  const block = STAND_BY_ID.get(String(id)) || FLOOR_BY_ID.get(String(id).toUpperCase());
  if (!block) return [];
  if (!aweRowLabels(id).includes(String(row).toUpperCase())) return [];
  return Array.from({ length: block.seats }, (_, i) => i + 1);
}

export function aweSeatExists(id, row, seat) {
  return aweSeatNumbers(id, row).includes(Number(seat));
}

export function aweSeatTotal() {
  return [...AWE_STAND_BLOCKS, ...AWE_FLOOR_BLOCKS]
    .reduce((total, block) => total + block.rows * block.seats, 0);
}

// Pure placement so the geometry can be unit-tested without WebGL. Returns one
// entry per modelled seat with its world position, facing and tier metadata.
export function awePlacements() {
  const placements = [];

  for (const block of AWE_STAND_BLOCKS) {
    const rows = genRows(block.rows);
    const seatPitch = SEAT_SLOT_W / Math.max(1, block.seats - 1);
    const tier = TIER[block.tier];
    rows.forEach((row, rowIndex) => {
      const y = 0.6 + rowIndex * ROW_RISE;
      const depth = rowIndex * ROW_PITCH;
      for (let seat = 1; seat <= block.seats; seat += 1) {
        const lateral = (seat - (block.seats + 1) / 2) * seatPitch;
        let x;
        let z;
        let yaw;
        if (block.side === 'north') {
          x = SLOT_CENTER_X + (2.5 - block.slot) * SLOT_PITCH - lateral;
          z = NORTH_Z + depth;
          yaw = Math.PI;
        } else if (block.side === 'south') {
          x = SLOT_CENTER_X + (2.5 - block.slot) * SLOT_PITCH + lateral;
          z = SOUTH_Z - depth;
          yaw = 0;
        } else {
          x = WEST_X - depth;
          z = (1 - block.slot) * WEST_SLOT_PITCH - lateral;
          yaw = Math.PI / 2;
        }
        placements.push({
          x, y, z, yaw,
          sec: block.id,
          row,
          seat,
          tier: tier.name,
          color: tier.color,
          alt: rowIndex % 2,
          widthScale: 0.84,
        });
      }
    });
  }

  for (const block of AWE_FLOOR_BLOCKS) {
    const rows = genRows(block.rows);
    const rowPitch = FLOOR_DEPTH / Math.max(1, block.rows - 1);
    const seatPitch = (FLOOR_HALF_Z * 2) / Math.max(1, block.seats - 1);
    const frontX = FLOOR_FRONT_X - block.slot * (FLOOR_DEPTH + FLOOR_GAP);
    const tier = TIER[block.tier];
    rows.forEach((row, rowIndex) => {
      const x = frontX - rowIndex * rowPitch;
      for (let seat = 1; seat <= block.seats; seat += 1) {
        const z = -FLOOR_HALF_Z + (seat - 1) * seatPitch;
        placements.push({
          x,
          y: 0.05,
          z,
          yaw: Math.PI / 2,
          sec: block.id,
          row,
          seat,
          tier: tier.name,
          color: tier.color,
          alt: rowIndex % 2,
          widthScale: 0.78,
        });
      }
    });
  }

  return placements;
}

function addOutline(scene, x, z, w, d, color = 0x5b4a8f) {
  const points = [
    new THREE.Vector3(x - w / 2, 0.04, z - d / 2),
    new THREE.Vector3(x + w / 2, 0.04, z - d / 2),
    new THREE.Vector3(x + w / 2, 0.04, z + d / 2),
    new THREE.Vector3(x - w / 2, 0.04, z + d / 2),
  ];
  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color }),
  ));
}

function labelTexture(text, sub, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.fillStyle = color;
  context.font = '900 86px system-ui';
  context.fillText(text, 256, 112);
  context.fillStyle = '#d7deee';
  context.font = '600 32px system-ui';
  context.fillText(sub, 256, 174);
  return new THREE.CanvasTexture(canvas);
}

function addStage(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0xc9005c, roughness: 0.72 });
  const stage = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 22), material);
  stage.position.set(STAGE_X, 0.47, 0);
  stage.userData.label = 'End Stage 舞台';
  scene.add(stage);
  const substage = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 3.2), material);
  substage.position.set(STAGE_X - 6.5, 0.2, 0);
  scene.add(substage);
  return stage;
}

function addLabels(scene) {
  const group = new THREE.Group();
  const specs = [];
  for (const block of AWE_STAND_BLOCKS) {
    const rows = block.rows;
    let x;
    let z;
    if (block.side === 'north') {
      x = SLOT_CENTER_X + (2.5 - block.slot) * SLOT_PITCH;
      z = NORTH_Z + rows * ROW_PITCH + 1.5;
    } else if (block.side === 'south') {
      x = SLOT_CENTER_X + (2.5 - block.slot) * SLOT_PITCH;
      z = SOUTH_Z - rows * ROW_PITCH - 1.5;
    } else {
      x = WEST_X - rows * ROW_PITCH - 1.5;
      z = (1 - block.slot) * WEST_SLOT_PITCH;
    }
    specs.push([`BLOCK ${block.id}`, 'STAND', TIER[block.tier].color, x, 3.4 + rows * ROW_RISE, z]);
  }
  for (const block of AWE_FLOOR_BLOCKS) {
    const x = FLOOR_FRONT_X - block.slot * (FLOOR_DEPTH + FLOOR_GAP) - FLOOR_DEPTH / 2;
    specs.push([`BLOCK ${block.id}`, 'FLOOR', TIER.floor.color, x, 3.2, 0]);
  }
  for (const [text, sub, color, x, y, z] of specs) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(text, sub, color),
      transparent: true,
      depthTest: false,
    }));
    sprite.position.set(x, y, z);
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
  subtitle: 'Hall 1 end-stage concert seating plan',
  dims: `Stands 2-16 and floor Blocks A-D · ${aweSeatTotal().toLocaleString()} modelled seats`,
  roofLabel: 'Arena roof structure',
  defaultLayout: 'end-stage',
  layouts: [{ id: 'end-stage', label: 'End Stage', zh: '正面舞台' }],
  sides: [
    { color: TIER.floor.color, name: 'Floor 內場' },
    { color: TIER.standard.color, name: 'Standard 標準看台' },
    { color: TIER.side.color, name: 'Side Stand 側看台' },
    { color: TIER.corner.color, name: 'Corner Stand 角落看台' },
  ],

  build({ scene }) {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(150, 64),
      new THREE.MeshStandardMaterial({ color: 0x070b11, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    scene.add(ground);

    const arenaFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(58, 26),
      new THREE.MeshStandardMaterial({ color: 0x111823, roughness: 0.94 }),
    );
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.set(-2, 0, 0);
    scene.add(arenaFloor);

    const terraceMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.96 });
    const northSouth = new THREE.BoxGeometry(44, 0.18, 16);
    const north = new THREE.Mesh(northSouth, terraceMaterial);
    north.position.set(-2, 0.05, NORTH_Z + 6);
    scene.add(north);
    const south = new THREE.Mesh(northSouth, terraceMaterial);
    south.position.set(-2, 0.05, SOUTH_Z - 6);
    scene.add(south);
    const west = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 26), terraceMaterial);
    west.position.set(WEST_X - 5, 0.05, 0);
    scene.add(west);

    for (const block of AWE_FLOOR_BLOCKS) {
      const x = FLOOR_FRONT_X - block.slot * (FLOOR_DEPTH + FLOOR_GAP) - FLOOR_DEPTH / 2;
      addOutline(scene, x, 0, FLOOR_DEPTH, FLOOR_HALF_Z * 2 + 1);
    }

    const placements = awePlacements();

    const pan = new THREE.BoxGeometry(0.45, 0.10, 0.32);
    pan.translate(0, 0.21, 0.03);
    const back = new THREE.BoxGeometry(0.45, 0.37, 0.08);
    back.translate(0, 0.39, -0.14);
    const seatGeometry = mergeGeometries([pan, back]);
    const seats = new THREE.InstancedMesh(
      seatGeometry,
      new THREE.MeshStandardMaterial({ roughness: 0.76, metalness: 0.04 }),
      placements.length,
    );
    const baseColors = new Float32Array(placements.length * 3);
    const seatIndex = new Map();
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    placements.forEach((placement, index) => {
      euler.set(0, placement.yaw, 0);
      quaternion.setFromEuler(euler);
      position.set(placement.x, placement.y, placement.z);
      scale.set(placement.widthScale, 1, 1);
      matrix.compose(position, quaternion, scale);
      seats.setMatrixAt(index, matrix);
      const color = new THREE.Color(placement.color);
      color.multiplyScalar((placement.tier === TIER.floor.name ? 0.92 : 0.8) + placement.alt * 0.035);
      seats.setColorAt(index, color);
      baseColors.set([color.r, color.g, color.b], index * 3);
      seatIndex.set(`${placement.sec}-${placement.row}-${placement.seat}`, index);
    });
    seats.instanceMatrix.needsUpdate = true;
    if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
    scene.add(seats);

    const stage = addStage(scene);
    const labelGroup = addLabels(scene);
    const roofGroup = new THREE.Group();
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(70, 0.3, 50),
      new THREE.MeshBasicMaterial({ color: 0x315b73, transparent: true, opacity: 0.055, depthWrite: false }),
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
