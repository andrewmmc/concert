import assert from 'node:assert/strict';
import test from 'node:test';

import {
  END_STAGE_FLOOR_BLOCKS,
  FLOOR_ROW_LETTERS,
  hkc,
} from '../src/venues/hkc.js';

test('end-stage layout is registered and selectable', () => {
  const layout = hkc.layouts.find((l) => l.id === 'end-stage');
  assert.ok(layout);
  assert.equal(layout.zh, '三面台');
  assert.equal(layout.comingSoon, undefined);
});

test('floor blocks are numbered 61-67 like the Brown Gate plan', () => {
  assert.deepEqual(
    END_STAGE_FLOOR_BLOCKS.map((b) => b.id).sort((a, b) => a - b),
    [61, 62, 63, 64, 65, 66, 67],
  );
});

test('floor blocks fit the arena floor in front of the stage', () => {
  // Arena floor is 40 m × 40 m; the stage occupies z < -10.
  for (const block of END_STAGE_FLOOR_BLOCKS) {
    const halfWidth = (block.seats - 1) * 0.6 / 2;
    const zEnd = block.z + (block.rows - 1) * 0.95;
    assert.ok(Math.abs(block.x) + halfWidth < 20, `block ${block.id} x extent`);
    assert.ok(block.z > -10, `block ${block.id} clears the stage`);
    assert.ok(zEnd < 20, `block ${block.id} z extent`);
  }
});

test('floor row lettering follows the plan: A-H back bank, J-Q front bank', () => {
  assert.equal(FLOOR_ROW_LETTERS.includes('I'), false);
  for (const block of END_STAGE_FLOOR_BLOCKS) {
    const first = FLOOR_ROW_LETTERS[block.rowOffset];
    const last = FLOOR_ROW_LETTERS[block.rowOffset + block.rows - 1];
    if (block.id === 64 || block.id === 65) {
      assert.equal(first, 'J');
      assert.equal(last, 'Q');
    } else {
      assert.equal(first, 'A');
      assert.equal(last, 'H');
    }
  }
});

test('floor seating totals 648 seats', () => {
  const total = END_STAGE_FLOOR_BLOCKS.reduce((sum, b) => sum + b.rows * b.seats, 0);
  assert.equal(total, 648);
});
