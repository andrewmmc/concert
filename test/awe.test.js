import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import {
  AWE_FLOOR_BLOCKS,
  AWE_FLOOR_ROWS,
  AWE_STAND_BLOCKS,
  AWE_STAND_ROWS,
  awe,
  awePlacements,
  aweRowLabels,
  aweSeatExists,
  aweSeatNumbers,
  aweSeatTotal,
} from '../src/venues/awe.js';
import { AWE_PDF_ROWS, AWE_PDF_SEAT_TOTAL } from '../src/venues/awe-seat-data.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

const EXPECTED_ROW_COUNTS = {
  1: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 9, 9, 9, 9, 9, 15, 15, 15, 15, 15, 15, 15],
  2: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 11, 11, 11, 11, 11, 15, 15, 15, 15, 15, 15, 15],
  3: [24, 24, 24, 23, 24, 24, 24, 23, 23, 19, 19, 19, 17, 17, 16, 17, 18, 24, 24, 23, 24, 21, 21, 21],
  4: [15, 15, 15, 15, 15, 15, 23, 22, 21, 22, 22, 24, 15, 15, 15, 16, 16, 24, 24, 23, 22, 21, 21, 21],
  5: [24, 24, 24, 22, 24, 24, 19, 22, 23, 21, 21, 21, 15, 15, 15, 15, 17, 24, 24, 23, 24, 22, 17, 16],
  6: [24, 24, 23, 22, 24, 23, 22, 22, 21, 23, 23, 23, 17, 16, 16, 17, 16, 24, 24, 24, 23, 20, 22, 22],
  7: [11, 11, 9, 10, 10, 11, 10, 11, 11, 12, 14, 15, 9, 11, 12, 12, 11, 18, 16, 19, 20, 19, 16, 16],
  8: [5, 6, 7, 8, 7, 8, 7, 12, 12, 18, 23, 18, 18, 22, 21, 23, 25, 31, 33, 34, 35, 36, 35, 37],
  9: [34, 34, 34, 35, 36, 37, 38, 42, 43, 43, 44, 44, 33, 31, 35, 32, 36, 47, 47, 47, 47, 49, 49, 48],
  10: [6, 6, 8, 8, 7, 8, 7, 14, 12, 16, 20, 22, 20, 20, 22, 23, 21, 31, 34, 33, 32, 37, 39, 39],
  11: [11, 11, 9, 9, 10, 11, 11, 12, 13, 12, 12, 13, 10, 9, 8, 8, 12, 19, 17, 19, 19, 17, 13, 17],
  12: [24, 24, 24, 24, 24, 24, 21, 21, 23, 22, 22, 22, 14, 14, 14, 16, 17, 24, 24, 23, 24, 22, 18, 20],
  13: [24, 24, 24, 24, 24, 24, 22, 23, 23, 24, 24, 24, 15, 15, 15, 16, 17, 24, 24, 24, 23, 18, 21, 22],
  14: [15, 15, 15, 14, 15, 15, 21, 20, 20, 21, 21, 20, 15, 15, 15, 15, 16, 22, 24, 23, 23, 21, 20, 20],
  15: [24, 24, 24, 21, 24, 24, 24, 20, 22, 23, 23, 23, 12, 12, 13, 14, 16, 24, 24, 24, 23, 20, 19, 21],
  16: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 11, 11, 11, 11, 11, 15, 15, 15, 15, 15, 15, 15],
  17: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 9, 9, 9, 9, 9, 15, 15, 15, 15, 15, 15, 15],
  A: Array(20).fill(50),
  B: Array(20).fill(50),
  C: Array(20).fill(46),
  D: [46, 46, 46, 46, 46, 46, 46, 46, 42, 38, 28, 28],
};

test('AWE is registered at the end-stage route', () => {
  assert.equal(getVenue('awe'), awe);
  assert.equal(resolveLayout(awe, 'end-stage').id, 'end-stage');
  assert.equal(resolveLayout(awe, 'unknown').id, 'end-stage');
});

test('models every block printed on AWA-ES-16 Draft 02', () => {
  assert.deepEqual(
    AWE_STAND_BLOCKS.map((block) => block.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  );
  assert.deepEqual(AWE_FLOOR_BLOCKS.map((block) => block.id), ['A', 'B', 'C', 'D']);
  assert.match(awe.dims, /11,254 PDF seats/);
});

test('uses the exact PDF row domains', () => {
  assert.equal(AWE_STAND_ROWS.length, 24);
  assert.deepEqual(aweRowLabels(9), AWE_STAND_ROWS);
  assert.equal(AWE_STAND_ROWS[0], 'A');
  assert.equal(AWE_STAND_ROWS.at(-1), 'Z');
  assert.ok(!AWE_STAND_ROWS.includes('I'));
  assert.ok(!AWE_STAND_ROWS.includes('O'));

  for (const block of ['A', 'B', 'C']) {
    assert.deepEqual(aweRowLabels(block), AWE_FLOOR_ROWS);
  }
  assert.deepEqual(aweRowLabels('D'), AWE_STAND_ROWS.slice(0, 12));
  assert.deepEqual(aweRowLabels('missing'), []);
});

test('locks every block row to its manually transcribed PDF seat count', () => {
  for (const [block, expected] of Object.entries(EXPECTED_ROW_COUNTS)) {
    const actual = aweRowLabels(block).map((row) => aweSeatNumbers(block, row).length);
    assert.deepEqual(actual, expected, `Block ${block}`);
    assert.deepEqual(AWE_PDF_ROWS[block].map((row) => row.length), expected, `PDF Block ${block}`);
  }
});

test('respects tapered row ends and stair openings', () => {
  assert.equal(aweSeatNumbers(8, 'A').length, 5);
  assert.equal(aweSeatNumbers(8, 'Z').length, 37);
  assert.equal(aweSeatNumbers(9, 'M').length, 44);
  assert.equal(aweSeatNumbers(9, 'N').length, 33);
  assert.equal(aweSeatNumbers(11, 'C').length, 9);
  assert.equal(aweSeatNumbers(11, 'D').length, 9);
  assert.equal(aweSeatNumbers('D', 'J').length, 42);
  assert.equal(aweSeatNumbers('D', 'M').length, 28);
  assert.equal(aweSeatNumbers('D', 'N').length, 0);
});

test('validates exact seat boundaries', () => {
  assert.equal(aweSeatExists(1, 'A', 15), true);
  assert.equal(aweSeatExists(1, 'A', 16), false);
  assert.equal(aweSeatExists(4, 'M', 24), true);
  assert.equal(aweSeatExists(4, 'M', 25), false);
  assert.equal(aweSeatExists(8, 'A', 5), true);
  assert.equal(aweSeatExists(8, 'A', 6), false);
  assert.equal(aweSeatExists('A', 'V', 50), true);
  assert.equal(aweSeatExists('C', 'V', 47), false);
  assert.equal(aweSeatExists('D', 'M', 28), true);
  assert.equal(aweSeatExists('D', 'N', 1), false);
});

test('matches the number of individual seat symbols in the PDF', () => {
  const placements = awePlacements();
  const positions = new Set(placements.map(({ x, z }) => `${x.toFixed(5)},${z.toFixed(5)}`));
  assert.equal(AWE_PDF_SEAT_TOTAL, 11254);
  assert.equal(aweSeatTotal(), AWE_PDF_SEAT_TOTAL);
  assert.equal(placements.length, AWE_PDF_SEAT_TOTAL);
  assert.equal(positions.size, AWE_PDF_SEAT_TOTAL);
});

test('preserves the PDF block positions and clockwise seat direction', () => {
  const placements = awePlacements();
  const byBlock = (id) => placements.filter((placement) => placement.sec === id);
  const at = (id, row, seat) =>
    byBlock(id).find((placement) => placement.row === row && placement.seat === seat);

  assert.ok(byBlock(1).every((seat) => seat.z < 0));
  assert.ok(byBlock(17).every((seat) => seat.z > 0));
  assert.ok(byBlock(8).every((seat) => seat.x < 0 && seat.z < 0));
  assert.ok(byBlock(9).every((seat) => seat.x < 0));
  assert.ok(byBlock(10).every((seat) => seat.x < 0 && seat.z > 0));

  assert.ok(at(1, 'A', 1).x > at(1, 'A', 15).x);
  assert.ok(at(17, 'A', 1).x < at(17, 'A', 15).x);
  assert.ok(at(9, 'A', 1).z < at(9, 'A', 34).z);
});

test('keeps the nonuniform PDF aisle gaps instead of filling them', () => {
  const row = awePlacements()
    .filter((seat) => seat.sec === 1 && seat.row === 'A')
    .sort((a, b) => a.seat - b.seat);
  const gaps = row.slice(1).map((seat, index) => Math.abs(seat.x - row[index].x));
  assert.ok(Math.max(...gaps) > Math.min(...gaps) * 3);
});

test('places floor Blocks A-D in stage-to-rear order', () => {
  const placements = awePlacements();
  const byBlock = (id) => placements.filter((placement) => placement.sec === id);
  const meanX = (id) =>
    byBlock(id).reduce((sum, placement) => sum + placement.x, 0) / byBlock(id).length;

  assert.ok(meanX('A') > meanX('B'));
  assert.ok(meanX('B') > meanX('C'));
  assert.ok(meanX('C') > meanX('D'));
  for (const block of ['A', 'B', 'C', 'D']) {
    assert.ok(byBlock(block).every((seat) => seat.yaw === Math.PI / 2));
  }
});

test('places floor rows and seat numbers toward the printed stage', () => {
  const blockA = awePlacements().filter((placement) => placement.sec === 'A');
  const at = (row, seat) =>
    blockA.find((placement) => placement.row === row && placement.seat === seat);

  assert.ok(at('A', 1).x > at('V', 1).x);
  assert.ok(at('A', 1).z < at('A', 50).z);
});

test('uses the plan-aligned default view', () => {
  const placements = awePlacements();
  const mean = (id) => {
    const seats = placements.filter((placement) => placement.sec === id);
    return new THREE.Vector3(
      seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length,
      0,
      seats.reduce((sum, seat) => sum + seat.z, 0) / seats.length,
    );
  };
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 800);
  camera.position.set(...awe.defaultCamera.position);
  camera.lookAt(new THREE.Vector3(...awe.defaultCamera.target));
  camera.updateMatrixWorld();

  const block1 = mean(1).project(camera);
  const block2 = mean(2).project(camera);
  const block16 = mean(16).project(camera);
  const block17 = mean(17).project(camera);
  const stage = new THREE.Vector3(35, 0, 0).project(camera);

  assert.ok(block1.x > block2.x);
  assert.ok(block17.x > block16.x);
  assert.ok(block1.y > block17.y);
  assert.ok(stage.x > block1.x);
});

test('stand seats face inward and rise through both PDF tiers', () => {
  const placements = awePlacements();
  const at = (block, row) =>
    placements.find((placement) => placement.sec === block && placement.row === row);

  assert.equal(at(1, 'A').yaw, 0);
  assert.equal(at(8, 'A').yaw, Math.PI / 4);
  assert.equal(at(9, 'A').yaw, Math.PI / 2);
  assert.equal(at(10, 'A').yaw, Math.PI * 0.75);
  assert.equal(at(17, 'A').yaw, Math.PI);
  assert.ok(at(4, 'M').y > at(4, 'A').y);
  assert.ok(at(4, 'N').y > at(4, 'M').y);
  assert.ok(at(4, 'Z').y > at(4, 'N').y);
});

test('only exposes seating explicitly drawn by the PDF', () => {
  assert.deepEqual(awe.sides, [{ color: '#ff999a', name: 'Seating' }]);
  assert.ok(awePlacements().every((placement) => placement.tier === 'Seating'));
  assert.ok(awePlacements().every((placement) => placement.color === '#ff999a'));
});
