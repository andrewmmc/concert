// AsiaWorld Expo VIVA TH8400 and TH5600 end-stage plans. The source drawings
// do not print row or seat labels, so rows are numbered from the stage and
// seats run from plan-left to plan-right within each block.
import * as THREE from 'three';
import { addGround, addOutline, createSeatInstances, labelTexture } from '../scene.js';

const FLOOR = { name: 'Hall 8 floor', color: '#55c7ef' };
const RISER = { name: 'Hall 10 riser', color: '#f0a45d' };
const ROW_PITCH = 0.72;
const CROSS_AISLE = 1.35;
const SEAT_PITCH = 0.43;
const BANK_AISLE = 1.3;

function repeat(count, banks) {
  return Array.from({ length: count }, () => banks.slice());
}

const A_ROWS = [
  [0, 0, 14, 14, 0, 0],
  ...repeat(4, [0, 12, 14, 14, 12, 0]),
  [4, 12, 14, 14, 12, 4],
  ...repeat(3, [6, 12, 14, 14, 12, 6]),
  ...repeat(20, [12, 12, 14, 14, 12, 12]),
];

const B_ROWS = repeat(20, [12, 12, 0, 0, 12, 12]);

const HALL_8_C_ROWS = [
  [6, 12, 12, 0, 0, 12, 12, 6],
  ...repeat(31, [6, 12, 12, 14, 14, 12, 12, 6]),
  ...repeat(2, [4, 12, 12, 14, 14, 12, 12, 4]),
  [0, 12, 12, 14, 14, 12, 12, 0],
];

const HALL_10_C_ROWS = [
  ...repeat(3, [4, 12, 12, 0, 12, 12, 4]),
  ...repeat(15, [4, 12, 12, 12, 12, 12, 4]),
];

const HALL_10_D_ROWS = repeat(14, [12, 12, 12, 12, 12, 12, 12]);

export const AWE_HALL_SECTIONS = [
  {
    id: '8A', hall: 8, block: 'A', tier: FLOOR, rows: A_ROWS,
    maxBanks: [12, 12, 14, 14, 12, 12], startZ: -47, breaks: [8, 18],
  },
  {
    id: '8B', hall: 8, block: 'B', tier: FLOOR, rows: B_ROWS,
    maxBanks: [12, 12, 14, 14, 12, 12], startZ: -23, breaks: [9],
  },
  {
    id: '8C', hall: 8, block: 'C', tier: FLOOR, rows: HALL_8_C_ROWS,
    maxBanks: [6, 12, 12, 14, 14, 12, 12, 6], startZ: -6, breaks: [9, 19, 29],
  },
  {
    id: '10C', hall: 10, block: 'C', tier: RISER, rows: HALL_10_C_ROWS,
    maxBanks: [4, 12, 12, 12, 12, 12, 4], startZ: 25, breaks: [2, 6, 10],
    yStart: 0.25, rise: 0.13,
  },
  {
    id: '10D', hall: 10, block: 'D', tier: RISER, rows: HALL_10_D_ROWS,
    maxBanks: [12, 12, 12, 12, 12, 12, 12], startZ: 42, breaks: [3],
    yStart: 2.75, rise: 0.13,
  },
];

const TH5600_A_ROWS = [
  [0, 0, 0, 14, 14, 0, 0, 0],
  ...repeat(2, [0, 0, 12, 14, 14, 12, 0, 0]),
  [0, 4, 12, 14, 14, 12, 4, 0],
  ...repeat(2, [0, 5, 12, 14, 14, 12, 5, 0]),
  ...repeat(3, [0, 6, 12, 14, 14, 12, 6, 0]),
  ...repeat(4, [0, 12, 12, 14, 14, 12, 12, 0]),
  [4, 12, 12, 14, 14, 12, 12, 4],
  ...repeat(15, [6, 12, 12, 14, 14, 12, 12, 6]),
];

const TH5600_B_ROWS = repeat(17, [6, 12, 12, 0, 0, 12, 12, 6]);

const TH5600_C_ROWS = [
  ...repeat(3, [4, 12, 12, 0, 12, 12, 4]),
  ...repeat(15, [4, 12, 12, 12, 12, 12, 4]),
  ...repeat(4, [12, 12, 12, 12, 12, 12, 12]),
];

const TH5600_D_ROWS = repeat(10, [12, 12, 12, 12, 12, 12, 12]);

export const AWE_HALL_5600_SECTIONS = [
  {
    id: '8A', hall: 8, block: 'A', tier: FLOOR, rows: TH5600_A_ROWS,
    maxBanks: [6, 12, 12, 14, 14, 12, 12, 6], startZ: -35, breaks: [8, 18],
  },
  {
    id: '8B', hall: 8, block: 'B', tier: FLOOR, rows: TH5600_B_ROWS,
    maxBanks: [6, 12, 12, 14, 14, 12, 12, 6], startZ: -11, breaks: [9],
  },
  {
    id: '10C', hall: 10, block: 'C', tier: RISER, rows: TH5600_C_ROWS,
    maxBanks: [12, 12, 12, 12, 12, 12, 12], startZ: 4, breaks: [2, 10, 17],
    yStart: 0.25, rise: 0.13,
  },
  {
    id: '10D', hall: 10, block: 'D', tier: RISER, rows: TH5600_D_ROWS,
    maxBanks: [12, 12, 12, 12, 12, 12, 12], startZ: 25, breaks: [],
    yStart: 3.25, rise: 0.13,
  },
];

export const AWE_HALL_LAYOUTS = {
  th8400: {
    sections: AWE_HALL_SECTIONS,
    stageHall: 6,
    stageZ: -57,
    floorCenter: -10,
    floorDepth: 88,
    riserCenter: 39,
    riserDepth: 32,
    roofCenter: 5,
    roofDepth: 106,
  },
  th5600: {
    sections: AWE_HALL_5600_SECTIONS,
    stageHall: 8,
    stageZ: -45,
    floorCenter: -13,
    floorDepth: 58,
    riserCenter: 17,
    riserDepth: 31,
    roofCenter: -4,
    roofDepth: 76,
  },
};

function layoutDefinition(layoutId = 'th8400') {
  return AWE_HALL_LAYOUTS[layoutId] || AWE_HALL_LAYOUTS.th8400;
}

function sectionById(sectionId, layoutId) {
  return layoutDefinition(layoutId).sections
    .find((section) => section.id === String(sectionId).toUpperCase());
}

export function aweHallsRowLabels(sectionId, layoutId = 'th8400') {
  const section = sectionById(sectionId, layoutId);
  return section ? section.rows.map((_, index) => String(index + 1)) : [];
}

export function aweHallsSeatNumbers(sectionId, row, layoutId = 'th8400') {
  const section = sectionById(sectionId, layoutId);
  const rowIndex = Number(row) - 1;
  const banks = Number.isInteger(rowIndex) ? section?.rows[rowIndex] : undefined;
  const count = banks?.reduce((total, bank) => total + bank, 0) || 0;
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function aweHallsSeatExists(sectionId, row, seat, layoutId = 'th8400') {
  return aweHallsSeatNumbers(sectionId, row, layoutId).includes(Number(seat));
}

export function aweHallsSectionTotal(sectionId, layoutId = 'th8400') {
  const section = sectionById(sectionId, layoutId);
  return section?.rows.reduce((total, banks) =>
    total + banks.reduce((rowTotal, bank) => rowTotal + bank, 0), 0) || 0;
}

export function aweHallsSeatTotal(layoutId = 'th8400') {
  return layoutDefinition(layoutId).sections.reduce((total, section) =>
    total + aweHallsSectionTotal(section.id, layoutId), 0);
}

function bankCenters(maxBanks) {
  const totalWidth = maxBanks.reduce((total, count) => total + count * SEAT_PITCH, 0) +
    (maxBanks.length - 1) * BANK_AISLE;
  let cursor = -totalWidth / 2;
  return maxBanks.map((count) => {
    const width = count * SEAT_PITCH;
    const center = cursor + width / 2;
    cursor += width + BANK_AISLE;
    return center;
  });
}

function rowZ(section, rowIndex) {
  const aisleCount = section.breaks.filter((after) => rowIndex > after).length;
  return section.startZ + rowIndex * ROW_PITCH + aisleCount * CROSS_AISLE;
}

export function aweHallsPlacements(layoutId = 'th8400') {
  const placements = [];
  for (const section of layoutDefinition(layoutId).sections) {
    const centers = bankCenters(section.maxBanks);
    section.rows.forEach((banks, rowIndex) => {
      let seatNumber = 1;
      banks.forEach((count, bankIndex) => {
        for (let index = 0; index < count; index++) {
          placements.push({
            x: centers[bankIndex] + (index - (count - 1) / 2) * SEAT_PITCH,
            y: section.yStart === undefined ? 0.05 : section.yStart + rowIndex * section.rise,
            z: rowZ(section, rowIndex),
            yaw: Math.PI,
            sec: section.id,
            hall: section.hall,
            block: section.block,
            row: rowIndex + 1,
            seat: seatNumber++,
            tier: section.tier.name,
            color: section.tier.color,
            alt: rowIndex % 2,
            widthScale: 0.72,
          });
        }
      });
    });
  }
  return placements;
}

function addStage(scene, hall, z) {
  const stage = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1.05, 7.5),
    new THREE.MeshStandardMaterial({ color: 0xd20b67, roughness: 0.72 }),
  );
  stage.position.set(0, 0.55, z);
  stage.userData.label = `Hall ${hall} Stage 舞台`;
  scene.add(stage);
  return stage;
}

function addHallFloor(scene, z, depth, color) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(49, 0.12, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  floor.position.set(0, -0.08, z);
  scene.add(floor);
}

function addLabels(scene, placements, sections) {
  const group = new THREE.Group();
  for (const section of sections) {
    const sectionSeats = placements.filter((placement) => placement.sec === section.id);
    const z = sectionSeats.reduce((total, seat) => total + seat.z, 0) / sectionSeats.length;
    const y = Math.max(...sectionSeats.map((seat) => seat.y)) + 3;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(`BLOCK ${section.block}`, `HALL ${section.hall}`, section.tier.color),
      transparent: true,
      depthTest: false,
    }));
    sprite.position.set(0, y, z);
    sprite.scale.set(7, 3.5, 1);
    group.add(sprite);
  }
  scene.add(group);
  return group;
}

export const aweHalls = {
  id: 'awe-halls',
  name: 'AsiaWorld Expo (Halls 6, 8 & 10)',
  zh: '亞洲國際博覽館',
  subtitle: 'VIVA TH8400 and TH5600 end-stage seating plans',
  dims: 'VIVA end-stage seating in Halls 6, 8 & 10',
  roofLabel: 'Halls 8 & 10 roof structure',
  defaultCamera: { position: [65, 105, 75], target: [0, 2, 7] },
  defaultLayout: 'th8400',
  layouts: [
    {
      id: 'th8400',
      label: 'Halls 6, 8 & 10',
      zh: '正面舞台',
      dims: `Hall 8 floor Blocks A-C and Hall 10 riser Blocks C-D · ${aweHallsSeatTotal('th8400').toLocaleString()} drawn seats`,
    },
    {
      id: 'th5600',
      label: 'Halls 8 & 10',
      zh: '正面舞台',
      dims: `Hall 8 floor Blocks A-B and Hall 10 riser Blocks C-D · ${aweHallsSeatTotal('th5600').toLocaleString()} drawn seats`,
    },
  ],
  sides: [FLOOR, RISER],

  build({ scene }, { layout = 'th8400' } = {}) {
    const definition = layoutDefinition(layout);
    addGround(scene, 115, 0x070b11, -0.16);
    addHallFloor(scene, definition.floorCenter, definition.floorDepth, 0x111923);
    addHallFloor(scene, definition.riserCenter, definition.riserDepth, 0x171822);
    addOutline(scene, 0, definition.floorCenter, 49, definition.floorDepth, 0x246079, 0.01);
    addOutline(scene, 0, definition.riserCenter, 49, definition.riserDepth, 0x80572e, 0.01);

    const placements = aweHallsPlacements(layout);
    const { seats, baseColors, seatIndex } = createSeatInstances(placements, {
      boxes: [
        { size: [0.46, 0.10, 0.32], pos: [0, 0.21, 0.03] },
        { size: [0.46, 0.38, 0.08], pos: [0, 0.40, -0.14] },
      ],
      shade: (placement) => (placement.hall === 10 ? 0.84 : 0.92),
    });
    scene.add(seats);

    const stage = addStage(scene, definition.stageHall, definition.stageZ);
    const labelGroup = addLabels(scene, placements, definition.sections);
    const roofGroup = new THREE.Group();
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(52, 0.3, definition.roofDepth),
      new THREE.MeshBasicMaterial({
        color: 0x315b73,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
      }),
    );
    roof.position.set(0, 18, definition.roofCenter);
    roofGroup.add(roof);
    scene.add(roofGroup);

    const describe = (placement) => ({
      main: `Hall ${placement.hall} · Block ${placement.block} · Row ${placement.row} · Seat ${placement.seat}`,
      sub: `${placement.tier} — AsiaWorld Expo`,
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
