import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AWE_FLOOR_BLOCKS,
  AWE_STAND_BLOCKS,
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
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  );
  assert.deepEqual(AWE_FLOOR_BLOCKS.map((block) => block.id), ['A', 'B', 'C', 'D']);
});

test('row labels skip I and O and match the block depth', () => {
  const rows = aweRowLabels(4);
  assert.equal(rows.length, 18);
  assert.equal(rows[0], 'A');
  assert.ok(!rows.includes('I'));
  assert.ok(!rows.includes('O'));
  assert.equal(aweRowLabels('A').length, 12);
});

test('seat numbers are contiguous per block row', () => {
  assert.deepEqual(aweSeatNumbers(16, 'A'), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(aweSeatNumbers('A', 'A').length, 26);
  assert.deepEqual(aweSeatNumbers(4, 'nope'), []);
  assert.deepEqual(aweSeatNumbers(999, 'A'), []);
});

test('seat existence checks respect block bounds', () => {
  assert.ok(aweSeatExists(16, 'A', 12));
  assert.ok(!aweSeatExists(16, 'A', 13));
  assert.ok(aweSeatExists('D', 'A', 20));
  assert.ok(!aweSeatExists('D', 'A', 21));
});

test('seat total is the sum of every modelled block grid', () => {
  const expected = [...AWE_STAND_BLOCKS, ...AWE_FLOOR_BLOCKS]
    .reduce((sum, block) => sum + block.rows * block.seats, 0);
  assert.equal(aweSeatTotal(), expected);
  assert.equal(awePlacements().length, expected);
});

test('places sections on the correct side of the bowl', () => {
  const placements = awePlacements();
  const bySec = (id) => placements.filter((p) => p.sec === id);

  // North stands sit at positive z, south stands at negative z.
  assert.ok(bySec(2).every((p) => p.z > 0));
  assert.ok(bySec(16).every((p) => p.z < 0));
  // West corner stands sit well to the west (negative x).
  assert.ok(bySec(9).every((p) => p.x < -20));
  // Floor blocks stay within the central event floor.
  assert.ok(bySec('A').every((p) => Math.abs(p.z) < 10 && p.x > 0));
  // Block A is nearer the stage (larger x) than Block D.
  const meanX = (id) => bySec(id).reduce((s, p) => s + p.x, 0) / bySec(id).length;
  assert.ok(meanX('A') > meanX('D'));
});

test('stand seats rise row by row while floor stays flat', () => {
  const placements = awePlacements();
  const block4 = placements.filter((p) => p.sec === 4);
  const rowA = block4.find((p) => p.row === 'A');
  const rowB = block4.find((p) => p.row === 'B');
  assert.ok(rowB.y > rowA.y);
  assert.ok(placements.filter((p) => p.sec === 'A').every((p) => p.y < 0.2));
});
