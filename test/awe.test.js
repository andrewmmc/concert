import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AWE_FLOOR_BLOCKS,
  AWE_FLOOR_ROWS,
  AWE_FLOOR_SEATS,
  AWE_STAND_BLOCKS,
  AWE_STAND_ROWS,
  awe,
  awePlacements,
  aweRowLabels,
  aweSeatExists,
  aweSeatNumbers,
  aweSeatTotal,
} from '../src/venues/awe.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('AWE is registered at the end-stage route', () => {
  assert.equal(getVenue('awe'), awe);
  assert.equal(resolveLayout(awe, 'end-stage').id, 'end-stage');
  assert.equal(resolveLayout(awe, 'unknown').id, 'end-stage');
});

test('models the stands and floor blocks shown by the reference plans', () => {
  assert.deepEqual(
    AWE_STAND_BLOCKS.map((block) => block.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  );
  assert.deepEqual(AWE_FLOOR_BLOCKS.map((block) => block.id), ['A', 'B', 'C']);
});

test('stand rows cover both tiers from A-Z and omit I and O', () => {
  assert.equal(AWE_STAND_ROWS.length, 24);
  assert.deepEqual(aweRowLabels(4), AWE_STAND_ROWS);
  assert.equal(AWE_STAND_ROWS[0], 'A');
  assert.equal(AWE_STAND_ROWS.at(-1), 'Z');
  assert.ok(!AWE_STAND_ROWS.includes('I'));
  assert.ok(!AWE_STAND_ROWS.includes('O'));
});

test('stand seat numbers include every seat shown by the all-seats plan', () => {
  assert.deepEqual(aweSeatNumbers(1, 'A'), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(2, 'A'), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(16, 'A'), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(16, 'N'), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(17, 'Z'), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(4, 'A'), Array.from({ length: 26 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(4, 'H'), Array.from({ length: 26 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(4, 'J'), Array.from({ length: 26 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(14, 'A'), Array.from({ length: 26 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(14, 'N'), Array.from({ length: 26 }, (_, i) => i + 1));
  assert.deepEqual(aweSeatNumbers(7, 'A'), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.ok(aweSeatNumbers(7, 'N').includes(13));
  assert.ok(aweSeatNumbers(8, 'M').includes(25));
  assert.equal(aweSeatNumbers(8, 'M').at(-1), 53);
  assert.deepEqual(aweRowLabels(9), AWE_STAND_ROWS);
  assert.ok(aweSeatNumbers(10, 'A').includes(26));
  assert.ok(aweSeatNumbers(10, 'H').includes(26));
  assert.deepEqual(aweSeatNumbers(11, 'A').slice(0, 3), [1, 2, 3]);
  assert.ok(aweSeatNumbers(11, 'A').includes(27));
  assert.deepEqual(aweSeatNumbers(4, 'nope'), []);
  assert.deepEqual(aweSeatNumbers(999, 'A'), []);
});

test('floor uses lettered rows and numbered seats from the concert map', () => {
  assert.deepEqual(aweRowLabels('A'), AWE_FLOOR_ROWS);
  assert.deepEqual(aweRowLabels('B'), AWE_STAND_ROWS.slice(0, 20));
  assert.deepEqual(aweRowLabels('C'), AWE_STAND_ROWS.slice(0, 10));
  assert.deepEqual(aweSeatNumbers('A', 'AA'), [
    ...AWE_FLOOR_SEATS.slice(0, 17),
    ...AWE_FLOOR_SEATS.slice(37),
  ]);
  assert.deepEqual(aweSeatNumbers('B', 'V'), AWE_FLOOR_SEATS);
  assert.deepEqual(aweSeatNumbers('C', 'K'), AWE_FLOOR_SEATS);
  assert.deepEqual(aweSeatNumbers('C', 'L'), []);
});

test('seat existence checks respect seat bounds', () => {
  assert.ok(aweSeatExists(1, 'A', 24));
  assert.ok(aweSeatExists(2, 'A', 1));
  assert.ok(aweSeatExists(16, 'A', 6));
  assert.ok(aweSeatExists(16, 'N', 21));
  assert.ok(aweSeatExists(17, 'Z', 24));
  assert.ok(!aweSeatExists(17, 'Z', 25));
  assert.ok(aweSeatExists('A', 'AA', 1));
  assert.ok(!aweSeatExists('A', 'AA', 18));
  assert.ok(aweSeatExists('C', 'K', 54));
  assert.ok(!aweSeatExists('C', 'L', 54));
});

test('seat total sums every valid printed row and seat', () => {
  const expected = [...AWE_STAND_BLOCKS, ...AWE_FLOOR_BLOCKS]
    .reduce((sum, block) => sum + aweRowLabels(block.id)
      .reduce((rowSum, row) => rowSum + aweSeatNumbers(block.id, row).length, 0), 0);
  assert.equal(aweSeatTotal(), expected);
  assert.equal(aweSeatTotal(), 14398);
  assert.equal(awePlacements().length, expected);
});

test('places sections on the correct side of the bowl', () => {
  const placements = awePlacements();
  const bySec = (id) => placements.filter((p) => p.sec === id);

  // North stands sit at positive z, south stands at negative z.
  assert.ok(bySec(1).every((p) => p.z > 0));
  assert.ok(bySec(17).every((p) => p.z < 0));
  // Blocks 8 and 10 follow the north-west and south-west chamfers.
  assert.ok(bySec(8).every((p) => p.x < -15 && p.z > 0));
  assert.ok(bySec(10).every((p) => p.x < -15 && p.z < 0));
  // Block 9 occupies the west wall.
  assert.ok(bySec(9).every((p) => p.x < -20));
  // Floor blocks stay within the central event floor.
  assert.ok(bySec('A').every((p) => Math.abs(p.z) < 10 && p.x > 0));
  // Floor blocks step away from the stage in A-B-C order.
  const meanX = (id) => bySec(id).reduce((s, p) => s + p.x, 0) / bySec(id).length;
  assert.ok(meanX('A') > meanX('B'));
  assert.ok(meanX('B') > meanX('C'));
});

test('orders blocks and seats clockwise from stage-right Block 1', () => {
  const placements = awePlacements();
  const bySec = (id) => placements.filter((p) => p.sec === id);
  const meanX = (id) => bySec(id).reduce((sum, p) => sum + p.x, 0) / bySec(id).length;
  const at = (id, row, seat) => bySec(id).find((p) => p.row === row && p.seat === seat);

  assert.ok(meanX(1) > meanX(2));
  assert.ok(meanX(2) > meanX(3));
  assert.ok(meanX(17) > meanX(16));
  assert.ok(meanX(16) > meanX(15));
  assert.ok(at(1, 'A', 1).x > at(1, 'A', 24).x);
  assert.ok(at(17, 'A', 1).x < at(17, 'A', 24).x);
});

test('stand seats rise through two tiers while floor stays flat', () => {
  const placements = awePlacements();
  const block4 = placements.filter((p) => p.sec === 4);
  const rowA = block4.find((p) => p.row === 'A');
  const rowM = block4.find((p) => p.row === 'M');
  const rowN = block4.find((p) => p.row === 'N');
  const rowZ = block4.find((p) => p.row === 'Z');
  assert.ok(rowM.y > rowA.y);
  assert.ok(rowN.y > rowM.y);
  assert.ok(rowN.z - rowM.z > rowM.z - block4.find((p) => p.row === 'L').z);
  assert.ok(rowZ.y > rowN.y);
  assert.ok(placements.filter((p) => p.sec === 'A').every((p) => p.y < 0.2));
});

test('all seats share one merged seating colour', () => {
  const placements = awePlacements();
  assert.ok(placements.every((placement) => placement.tier === 'Seating'));
  assert.ok(placements.every((placement) => placement.color === '#ff999a'));
  assert.deepEqual(awe.sides[0], { color: '#ff999a', name: 'Seating' });
  assert.ok(awe.sides.every((side) => !side.name.includes('$')));
});

test('floor placement follows lettered rows and numbered seat direction', () => {
  const blockA = awePlacements().filter((p) => p.sec === 'A');
  const at = (row, seat) => blockA.find((p) => p.row === row && p.seat === seat);
  assert.ok(at('AA', 1).z > at('AA', 54).z);
  assert.ok(at('AA', 1).x > at('A', 1).x);
  assert.ok(at('A', 1).x > at('Z', 1).x);
  assert.equal(at('AA', 18), undefined);
});

test('floor seats face the stage at the east end', () => {
  const floorIds = AWE_FLOOR_BLOCKS.map((block) => block.id);
  const floor = awePlacements().filter((p) => floorIds.includes(p.sec));
  assert.ok(floor.length > 0);
  assert.ok(floor.every((p) => p.yaw === Math.PI / 2));
});
