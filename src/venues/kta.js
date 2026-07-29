// Kai Tak Arena (啟德體藝館) — end-stage concert plan reconstructed from the
// two reference drawings in misc/kta. The bowl uses globally numbered seats;
// the event floor uses Blocks A-J and local seat numbers.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const KTA_OMITTED_ROWS = ['I', 'O', 'U', 'W'];

const SINGLE_ROWS = Array.from({ length: 24 }, (_, i) => String.fromCharCode(65 + i))
  .filter((row) => !KTA_OMITTED_ROWS.includes(row));

function rowsBetween(first, last) {
  return SINGLE_ROWS.slice(SINGLE_ROWS.indexOf(first), SINGLE_ROWS.indexOf(last) + 1);
}

export const KTA_BOWL_SECTIONS = [
  { id: 102, side: 'north', center: 24, rows: rowsBetween('A', 'X'), firstSeat: 31, lastSeat: 60, color: '#24c4cf' },
  { id: 103, side: 'north', center: 12, rows: rowsBetween('A', 'X'), firstSeat: 61, lastSeat: 90, color: '#7310dc' },
  { id: 104, side: 'north', center: 0, rows: rowsBetween('A', 'X'), firstSeat: 91, lastSeat: 120, color: '#7310dc' },
  { id: 105, side: 'north', center: -12, rows: rowsBetween('A', 'X'), firstSeat: 121, lastSeat: 150, color: '#7310dc' },
  { id: 106, side: 'north', center: -24, rows: rowsBetween('K', 'X'), firstSeat: 151, lastSeat: 179, color: '#ed65ed' },
  { id: 107, side: 'west', center: -10, rows: rowsBetween('A', 'M'), firstSeat: 195, lastSeat: 224, color: '#ed65ed' },
  { id: 108, side: 'west', center: 10, rows: rowsBetween('A', 'M'), firstSeat: 250, lastSeat: 279, color: '#ed65ed' },
  { id: 109, side: 'south', center: -24, rows: rowsBetween('K', 'X'), firstSeat: 296, lastSeat: 324, color: '#ed65ed' },
  { id: 110, side: 'south', center: -12, rows: rowsBetween('A', 'X'), firstSeat: 325, lastSeat: 354, color: '#7310dc' },
  { id: 111, side: 'south', center: 0, rows: rowsBetween('A', 'X'), firstSeat: 355, lastSeat: 384, color: '#7310dc' },
  { id: 112, side: 'south', center: 12, rows: rowsBetween('A', 'X'), firstSeat: 385, lastSeat: 414, color: '#7310dc' },
  { id: 113, side: 'south', center: 24, rows: rowsBetween('A', 'X'), firstSeat: 415, lastSeat: 444, color: '#24c4cf' },
  { id: 207, side: 'west-upper', center: -13, rows: ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH'], firstSeat: 180, lastSeat: 221, color: '#ed65ed' },
  { id: 208, side: 'west-upper', center: 13, rows: ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH'], firstSeat: 252, lastSeat: 293, color: '#ed65ed' },
];

export const KTA_FLOOR_BLOCKS = [
  { id: 'A', rows: rowsBetween('A', 'J'), seats: [1, 12, 15, 26], x: 17, z: -9, w: 10.5, d: 5.6, reverse: true },
  { id: 'B', rows: rowsBetween('A', 'J'), seats: [1, 12, 15, 26], x: 6, z: -9, w: 10.5, d: 5.6, reverse: true },
  { id: 'C', rows: rowsBetween('A', 'J'), seats: [1, 12], x: -2.2, z: -9, w: 5.2, d: 5.6, reverse: true },
  { id: 'D', rows: rowsBetween('A', 'K'), seats: [1, 12, 15, 26], x: -9, z: -7, w: 6.0, d: 9.5, axis: 'x' },
  { id: 'E', rows: rowsBetween('A', 'K'), seats: [1, 12], x: -9, z: 0, w: 6.0, d: 4.6, axis: 'x' },
  { id: 'F', rows: rowsBetween('A', 'K'), seats: [1, 12, 15, 26], x: -9, z: 7, w: 6.0, d: 9.5, axis: 'x' },
  { id: 'G', rows: rowsBetween('A', 'J'), seats: [1, 12], x: -2.2, z: 9, w: 5.2, d: 5.6 },
  { id: 'H', rows: rowsBetween('A', 'J'), seats: [1, 12, 15, 26], x: 6, z: 9, w: 10.5, d: 5.6 },
  { id: 'J', rows: rowsBetween('A', 'J'), seats: [1, 12, 15, 26], x: 17, z: 9, w: 10.5, d: 5.6 },
];

const BOWL_BY_ID = new Map(KTA_BOWL_SECTIONS.map((section) => [section.id, section]));
const FLOOR_BY_ID = new Map(KTA_FLOOR_BLOCKS.map((block) => [block.id, block]));

function floorSeatNumbers(block) {
  const [first, leftLast, rightFirst, last] = block.seats;
  if (last === undefined) return Array.from({ length: leftLast - first + 1 }, (_, i) => first + i);
  return [
    ...Array.from({ length: leftLast - first + 1 }, (_, i) => first + i),
    ...Array.from({ length: last - rightFirst + 1 }, (_, i) => rightFirst + i),
  ];
}

export function ktaRowLabels(sectionId) {
  const key = String(sectionId).toUpperCase();
  return (BOWL_BY_ID.get(Number(key)) || FLOOR_BY_ID.get(key))?.rows.slice() || [];
}

export function ktaSeatNumbers(sectionId, row) {
  const key = String(sectionId).toUpperCase();
  const section = BOWL_BY_ID.get(Number(key));
  const block = FLOOR_BY_ID.get(key);
  const rows = section?.rows || block?.rows;
  if (!rows?.includes(String(row).toUpperCase())) return [];
  if (block) return floorSeatNumbers(block);
  return Array.from(
    { length: section.lastSeat - section.firstSeat + 1 },
    (_, i) => section.firstSeat + i,
  );
}

export function ktaSeatExists(sectionId, row, seat) {
  return ktaSeatNumbers(sectionId, row).includes(Number(seat));
}

export function ktaSeatTotal() {
  return [...KTA_BOWL_SECTIONS, ...KTA_FLOOR_BLOCKS].reduce((total, section) =>
    total + section.rows.reduce((sum, row) => sum + ktaSeatNumbers(section.id, row).length, 0), 0);
}

function bowlPlacement(section, rowIndex, seatIndex, count) {
  const rowDepth = section.side === 'west-upper' ? 0.9 : 0.72;
  const lateral = (seatIndex - (count - 1) / 2) * 0.38;
  const y = 0.65 + rowIndex * (section.side === 'west-upper' ? 0.55 : 0.38);
  if (section.side === 'north') {
    return { x: section.center - lateral, y, z: 17.5 + rowIndex * rowDepth, yaw: Math.PI };
  }
  if (section.side === 'south') {
    return { x: section.center + lateral, y, z: -17.5 - rowIndex * rowDepth, yaw: 0 };
  }
  const upperOffset = section.side === 'west-upper' ? 7 : 0;
  return {
    x: -30 - upperOffset - rowIndex * rowDepth,
    y: y + upperOffset * 0.45,
    z: section.center + lateral,
    yaw: Math.PI / 2,
  };
}

function addBowlPlacements(placements) {
  for (const section of KTA_BOWL_SECTIONS) {
    section.rows.forEach((row, rowIndex) => {
      const numbers = ktaSeatNumbers(section.id, row);
      numbers.forEach((seat, seatIndex) => {
        const point = bowlPlacement(section, rowIndex, seatIndex, numbers.length);
        placements.push({
          ...point,
          sec: section.id,
          row,
          seat,
          tier: section.id >= 200 ? 'Upper West Stand' : 'Lower Bowl',
          color: section.color,
          alt: rowIndex % 2,
          widthScale: 0.84,
        });
      });
    });
  }
}

function addFloorPlacements(placements) {
  for (const block of KTA_FLOOR_BLOCKS) {
    const numbers = floorSeatNumbers(block);
    block.rows.forEach((row, rowIndex) => {
      numbers.forEach((seat, seatIndex) => {
        const seatProgress = numbers.length === 1 ? 0.5 : seatIndex / (numbers.length - 1);
        const rowProgress = block.rows.length === 1 ? 0.5 : rowIndex / (block.rows.length - 1);
        const aisleOffset = seat >= 15 ? 0.62 : 0;
        let x;
        let z;
        if (block.axis === 'x') {
          x = block.x + block.w / 2 - rowProgress * block.w;
          z = block.z - block.d / 2 + seatProgress * block.d + aisleOffset;
        } else {
          x = block.x - block.w / 2 + seatProgress * block.w + aisleOffset;
          z = block.reverse
            ? block.z + block.d / 2 - rowProgress * block.d
            : block.z - block.d / 2 + rowProgress * block.d;
        }
        placements.push({
          x,
          y: 0.05,
          z,
          yaw: Math.PI / 2,
          sec: block.id,
          row,
          seat,
          tier: 'Arena Floor',
          color: '#7310dc',
          alt: rowIndex % 2,
          widthScale: 0.78,
        });
      });
    });
  }
}

function addOutline(scene, x, z, w, d, color = 0x58309b) {
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
  const stage = new THREE.Mesh(new THREE.BoxGeometry(31, 0.9, 6), material);
  stage.position.set(10.5, 0.47, 0);
  stage.userData.label = 'End Stage 舞台';
  scene.add(stage);
  const thrust = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 20), material);
  thrust.position.set(26.5, 0.47, 0);
  scene.add(thrust);
  return stage;
}

function addLabels(scene) {
  const group = new THREE.Group();
  const specs = [
    ...KTA_BOWL_SECTIONS.map((section) => {
      const rowIndex = section.rows.length + 1;
      const p = bowlPlacement(section, rowIndex, 0, 1);
      return [String(section.id), section.id >= 200 ? 'UPPER' : 'BOWL', section.color, p.x, Math.max(8, p.y + 2), p.z];
    }),
    ...KTA_FLOOR_BLOCKS.map((block) => [`BLOCK ${block.id}`, 'FLOOR', '#9b6cff', block.x, 3.2, block.z]),
  ];
  for (const [text, sub, color, x, y, z] of specs) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(text, sub, color),
      transparent: true,
      depthTest: false,
    }));
    sprite.position.set(x, y, z);
    sprite.scale.set(5.8, 2.9, 1);
    group.add(sprite);
  }
  scene.add(group);
  return group;
}

export const kta = {
  id: 'kta',
  name: 'Kai Tak Arena',
  zh: '啟德體藝館',
  subtitle: 'End-stage concert seating plan',
  dims: `Blocks 102-113, 207-208 and arena-floor Blocks A-J · ${ktaSeatTotal().toLocaleString()} modelled seats`,
  roofLabel: 'Arena roof structure',
  defaultLayout: 'end-stage',
  layouts: [{ id: 'end-stage', label: 'End Stage', zh: '正面舞台' }],
  sides: [
    { color: '#7310dc', name: 'Lower Bowl' },
    { color: '#ed65ed', name: 'West Bowl' },
    { color: '#24c4cf', name: 'Restricted View' },
    { color: '#9b6cff', name: 'Arena Floor' },
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
      new THREE.PlaneGeometry(62, 32),
      new THREE.MeshStandardMaterial({ color: 0x111823, roughness: 0.94 }),
    );
    arenaFloor.rotation.x = -Math.PI / 2;
    scene.add(arenaFloor);

    const terraceMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.96 });
    const northSouth = new THREE.BoxGeometry(64, 0.18, 18);
    const north = new THREE.Mesh(northSouth, terraceMaterial);
    north.position.set(0, 0.05, 26);
    scene.add(north);
    const south = new THREE.Mesh(northSouth, terraceMaterial);
    south.position.set(0, 0.05, -26);
    scene.add(south);
    const west = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 38), terraceMaterial);
    west.position.set(-36, 0.05, 0);
    scene.add(west);

    for (const block of KTA_FLOOR_BLOCKS) addOutline(scene, block.x, block.z, block.w, block.d);

    const placements = [];
    addBowlPlacements(placements);
    addFloorPlacements(placements);

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
      color.multiplyScalar((placement.tier === 'Arena Floor' ? 0.92 : 0.78) + placement.alt * 0.035);
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
      new THREE.BoxGeometry(82, 0.3, 58),
      new THREE.MeshBasicMaterial({ color: 0x315b73, transparent: true, opacity: 0.055, depthWrite: false }),
    );
    roof.position.y = 28;
    roofGroup.add(roof);
    scene.add(roofGroup);

    const describe = (placement) => ({
      main: `${typeof placement.sec === 'number' ? 'Sec' : 'Block'} ${placement.sec} · Row ${placement.row} · Seat ${placement.seat}`,
      sub: `${placement.tier} — Kai Tak Arena`,
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
