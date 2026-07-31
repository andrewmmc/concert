// AsiaWorld-Arena (亞洲國際博覽館 Arena Hall 1) — EDAN LUI 2023 end-stage plan
// reconstructed from the labelled concert map in misc/awe_hall1. The generic
// AWA-ES-16 drawing is used only to confirm the bowl and aisle geometry.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const AWE_STAND_ROWS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];
export const AWE_FLOOR_ROWS = ['AA', ...AWE_STAND_ROWS];
export const AWE_FLOOR_SEATS = Array.from({ length: 54 }, (_, i) => i + 1);

const TIER = {
  seating: { name: 'Seating', color: '#ff999a' },
  wheelchair: { name: 'Wheelchair', color: '#7fff00' },
};

// `maxSeat` is the highest printed seat number, not a rectangular seat count.
// Some blocks contain numbering gaps or lose their front rows around handrails,
// wheelchair bays and the rear control panel; standSeatNumbers preserves them.
export const AWE_STAND_BLOCKS = [
  { id: 2, side: 'north', center: [16, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 6, maxSeat: 21 },
  { id: 3, side: 'north', center: [9.5, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 6, maxSeat: 21 },
  { id: 4, side: 'north', center: [3, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 6, maxSeat: 26 },
  { id: 5, side: 'north', center: [-3.5, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 6, maxSeat: 25 },
  { id: 6, side: 'north', center: [-10, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 6, maxSeat: 23 },
  { id: 7, side: 'north', center: [-17, 10], outward: [0, 1], lateral: [-1, 0], yaw: Math.PI, width: 8.5, maxSeat: 36 },
  { id: 8, side: 'northwest', center: [-24, 10.5], outward: [-0.71, 0.71], lateral: [-0.71, -0.71], yaw: Math.PI * 0.75, width: 12, maxSeat: 53 },
  { id: 9, side: 'west', center: [-29, 0], outward: [-1, 0], lateral: [0, -1], yaw: Math.PI / 2, width: 10.5, maxSeat: 35 },
  { id: 10, side: 'southwest', center: [-24, -10.5], outward: [-0.71, -0.71], lateral: [0.71, -0.71], yaw: Math.PI / 4, width: 12, maxSeat: 52 },
  { id: 11, side: 'south', center: [-17, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 9.5, maxSeat: 41 },
  { id: 12, side: 'south', center: [-10, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 6, maxSeat: 23 },
  { id: 13, side: 'south', center: [-3.5, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 6, maxSeat: 25 },
  { id: 14, side: 'south', center: [3, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 6, maxSeat: 26 },
  { id: 15, side: 'south', center: [9.5, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 6, maxSeat: 21 },
  { id: 16, side: 'south', center: [16, -10], outward: [0, -1], lateral: [1, 0], yaw: 0, width: 6, maxSeat: 12 },
];

// The event map letters floor rows from the stage towards the panel and numbers
// seats north-to-south. Block A starts at Row AA and is split by the T-shaped
// substage, which replaces Seats 18-37. Blocks B and C retain Seats 1-54.
export const AWE_FLOOR_BLOCKS = [
  { id: 'A', eastX: 18, rows: AWE_FLOOR_ROWS, seats: [...AWE_FLOOR_SEATS.slice(0, 17), ...AWE_FLOOR_SEATS.slice(37)] },
  { id: 'B', eastX: 2, rows: AWE_STAND_ROWS.slice(0, 20), seats: AWE_FLOOR_SEATS },
  { id: 'C', eastX: -11, rows: AWE_STAND_ROWS.slice(0, 10), seats: AWE_FLOOR_SEATS },
];

const STAND_BY_ID = new Map(AWE_STAND_BLOCKS.map((b) => [String(b.id), b]));
const FLOOR_BY_ID = new Map(AWE_FLOOR_BLOCKS.map((b) => [b.id, b]));

// Geometry constants (metres) that lay the bowl and floor out on the page.
const NORTH_Z = 10;
const SOUTH_Z = -10;
const WEST_X = -24;
const STAGE_X = 26;
const FLOOR_HALF_Z = 8.5;
const STAND_ROW_PITCH = 0.58;
const STAND_ROW_RISE = 0.31;
const TIER_AISLE = 1.15;
const FLOOR_SEAT_PITCH = 0.48;
const FLOOR_ROW_PITCH = 0.58;

export function aweRowLabels(id) {
  const block = STAND_BY_ID.get(String(id)) || FLOOR_BY_ID.get(String(id).toUpperCase());
  if (!block) return [];
  return STAND_BY_ID.has(String(id))
    ? AWE_STAND_ROWS.filter((row) => standSeatNumbers(block, row).length)
    : block.rows.slice();
}

function rangeInclusive(first, last) {
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

function standSeatNumbers(block, row) {
  const rowIndex = AWE_STAND_ROWS.indexOf(row);
  if (rowIndex < 0) return [];
  const rowAtoG = rowIndex <= AWE_STAND_ROWS.indexOf('G');
  const rowAtoH = rowIndex <= AWE_STAND_ROWS.indexOf('H');
  const rowNtoS = rowIndex >= AWE_STAND_ROWS.indexOf('N') &&
    rowIndex <= AWE_STAND_ROWS.indexOf('S');
  if (block.id === 16) {
    return rowNtoS ? rangeInclusive(1, 5) : rangeInclusive(1, 12);
  }
  if (block.id === 4) {
    return rowAtoH ? rangeInclusive(14, 26) : rangeInclusive(1, 26);
  }
  if (block.id === 14) {
    return rowAtoH ? rangeInclusive(1, 13) : rangeInclusive(1, 26);
  }
  if (block.id === 7) {
    const lowerSeats = rowIndex <= AWE_STAND_ROWS.indexOf('C')
      ? [1, 2, ...rangeInclusive(9, 12)]
      : rangeInclusive(1, 12);
    return rowIndex < AWE_STAND_ROWS.indexOf('N')
      ? lowerSeats
      : [...rangeInclusive(1, 12), ...rangeInclusive(16, 36)];
  }
  if (block.id === 8) {
    const seats = [...rangeInclusive(1, 24), ...rangeInclusive(27, 53)];
    return rowAtoG ? seats.filter((seat) => seat <= 12 || seat >= 27) : seats;
  }
  if (block.id === 9) {
    return rowIndex < AWE_STAND_ROWS.indexOf('J') ? [] : rangeInclusive(1, 35);
  }
  if (block.id === 10) {
    const seats = rangeInclusive(1, 52);
    return rowAtoG ? seats.filter((seat) => seat <= 25 || seat >= 41) : seats;
  }
  if (block.id === 11) {
    return [...rangeInclusive(7, 26), ...rangeInclusive(30, 41)];
  }
  return rangeInclusive(1, block.maxSeat);
}

export function aweSeatNumbers(id, row) {
  const stand = STAND_BY_ID.get(String(id));
  const floor = FLOOR_BY_ID.get(String(id).toUpperCase());
  if (stand) return standSeatNumbers(stand, String(row).toUpperCase());
  if (!floor || !floor.rows.includes(String(row).toUpperCase())) return [];
  return floor.seats.slice();
}

export function aweSeatExists(id, row, seat) {
  const numbers = aweSeatNumbers(id, row);
  return numbers.includes(Number(seat));
}

export function aweSeatTotal() {
  return [...AWE_STAND_BLOCKS, ...AWE_FLOOR_BLOCKS]
    .reduce((total, block) => total +
      aweRowLabels(block.id).reduce((sum, row) => sum + aweSeatNumbers(block.id, row).length, 0), 0);
}

// Pure placement so the geometry can be unit-tested without WebGL. Returns one
// entry per modelled seat with its world position, facing and tier metadata.
export function awePlacements() {
  const placements = [];

  for (const block of AWE_STAND_BLOCKS) {
    AWE_STAND_ROWS.forEach((row, rowIndex) => {
      const upperTier = rowIndex >= 12;
      const tierOffset = upperTier ? TIER_AISLE : 0;
      const depth = rowIndex * STAND_ROW_PITCH + tierOffset;
      const y = 0.6 + rowIndex * STAND_ROW_RISE + (upperTier ? 0.65 : 0);
      const seats = standSeatNumbers(block, row);
      for (const seat of seats) {
        const tier = TIER.seating;
        const lateral = ((seat - 1) / Math.max(1, block.maxSeat - 1) - 0.5) * block.width;
        const x = block.center[0] + block.outward[0] * depth + block.lateral[0] * lateral;
        const z = block.center[1] + block.outward[1] * depth + block.lateral[1] * lateral;
        placements.push({
          x, y, z, yaw: block.yaw,
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
    const tier = TIER.seating;
    block.rows.forEach((row, rowIndex) => {
      const x = block.eastX - rowIndex * FLOOR_ROW_PITCH;
      block.seats.forEach((seat) => {
        const z = FLOOR_HALF_Z - (seat - 1) * (FLOOR_HALF_Z * 2 / 53);
        placements.push({
          x,
          y: 0.05,
          z,
          yaw: -Math.PI / 2,
          sec: block.id,
          row,
          seat,
          tier: tier.name,
          color: tier.color,
          alt: rowIndex % 2,
          widthScale: 0.78,
        });
      });
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
  const substage = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 6.2), material);
  substage.position.set(17, 0.2, 0);
  scene.add(substage);
  return stage;
}

function addLabels(scene) {
  const group = new THREE.Group();
  const specs = [];
  for (const block of AWE_STAND_BLOCKS) {
    const depth = (AWE_STAND_ROWS.length - 1) * STAND_ROW_PITCH + TIER_AISLE + 1.5;
    const x = block.center[0] + block.outward[0] * depth;
    const z = block.center[1] + block.outward[1] * depth;
    specs.push([`BLOCK ${block.id}`, 'STAND', TIER.seating.color, x, 9.2, z]);
  }
  for (const block of AWE_FLOOR_BLOCKS) {
    const westX = block.eastX - (block.rows.length - 1) * FLOOR_ROW_PITCH;
    specs.push([`BLOCK ${block.id}`, 'FLOOR', TIER.seating.color, (block.eastX + westX) / 2, 3.2, 0]);
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

function addWheelchairPlatforms(scene) {
  return AWE_STAND_BLOCKS
    .filter((block) => block.id === 4 || block.id === 5)
    .map((block, index) => {
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.16, 1.3),
        new THREE.MeshStandardMaterial({ color: TIER.wheelchair.color, roughness: 0.84 }),
      );
      platform.position.set(block.center[0], 8.6, 25.1);
      platform.userData.wp = index + 1;
      platform.userData.main = `Block ${block.id} Wheelchair Bay`;
      platform.userData.sub = `${TIER.wheelchair.name} — rear of upper tier`;
      scene.add(platform);
      return platform;
    });
}

export const awe = {
  id: 'awe',
  name: 'AsiaWorld-Arena',
  zh: '亞洲國際博覽館',
  subtitle: 'Hall 1 EDAN LUI 2023 end-stage seating plan',
  dims: `Stands 2-16 and floor Blocks A-C · ${aweSeatTotal().toLocaleString()} modelled seats`,
  roofLabel: 'Arena roof structure',
  defaultLayout: 'end-stage',
  layouts: [{ id: 'end-stage', label: 'End Stage', zh: '正面舞台' }],
  sides: [
    { color: TIER.seating.color, name: TIER.seating.name },
    { color: TIER.wheelchair.color, name: TIER.wheelchair.name },
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
    for (const z of [-14, 14]) {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(19, 0.18, 12), terraceMaterial);
      corner.rotation.y = z > 0 ? Math.PI / 4 : -Math.PI / 4;
      corner.position.set(-25, 0.05, z);
      scene.add(corner);
    }

    for (const block of AWE_FLOOR_BLOCKS) {
      const westX = block.eastX - (block.rows.length - 1) * FLOOR_ROW_PITCH;
      const x = (block.eastX + westX) / 2;
      const width = block.eastX - westX + FLOOR_ROW_PITCH;
      if (block.id === 'A') {
        addOutline(scene, x, 6, width, 5.4);
        addOutline(scene, x, -6, width, 5.4);
      } else {
        addOutline(scene, x, 0, width, FLOOR_HALF_Z * 2 + 1);
      }
    }

    const placements = awePlacements();
    const wpMeshes = addWheelchairPlatforms(scene);

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
      color.multiplyScalar((placement.y < 0.2 ? 0.92 : 0.8) + placement.alt * 0.035);
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
      wpMeshes,
      stage,
      roofGroup,
      labelGroup,
      describe,
    };
  },
};
