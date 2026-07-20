import assert from 'node:assert/strict';
import test from 'node:test';

import {
  END_STAGE_FLOOR_BLOCKS,
  END_STAGE_FLOOR_WZ,
  FLOOR_ROW_LETTERS,
  floorBlockSeatNumbers,
  hkc,
} from '../src/venues/hkc.js';

test('end-stage layout is registered and selectable', () => {
  const layout = hkc.layouts.find((l) => l.id === 'end-stage');
  assert.ok(layout);
  assert.equal(layout.zh, '三面台');
  assert.equal(layout.comingSoon, undefined);
});

test('floor blocks cover the Red-range floor gates 42-47', () => {
  const gates = new Set();
  for (const block of END_STAGE_FLOOR_BLOCKS) {
    gates.add(block.gateHigh);
    gates.add(block.gateLow);
    assert.equal(block.gateHigh, block.gateLow + 1, 'each block straddles two aisles');
  }
  assert.deepEqual([...gates].sort((a, b) => a - b), [42, 43, 44, 45, 46, 47]);
});

test('floor banks match the plan: 3 blocks AA-AG, then 5 blocks A-J and K-S', () => {
  const byBank = (offset) => END_STAGE_FLOOR_BLOCKS.filter((b) => b.rowOffset === offset);
  assert.equal(byBank(0).length, 3);
  assert.equal(byBank(7).length, 5);
  assert.equal(byBank(17).length, 5);
  for (const block of byBank(0)) assert.equal(block.seats, 12, 'back bank blocks are 12 seats wide');
  for (const block of byBank(7).concat(byBank(17))) {
    const side = Math.abs(block.x) > 10;
    assert.equal(block.seats, side ? 10 : 12, 'outer blocks are 10 seats, centre blocks 12');
  }
});

test('floor blocks fit the arena floor in front of the stage', () => {
  // Arena floor is 40 m × 40 m; the stage occupies z > 10 and each bank's
  // rows step towards -Z.
  for (const block of END_STAGE_FLOOR_BLOCKS) {
    const halfWidth = (block.seats - 1) * 0.55 / 2;
    const zEnd = block.z - (block.rows - 1) * 0.78;
    assert.ok(Math.abs(block.x) + halfWidth < 20, `block at x ${block.x} x extent`);
    assert.ok(block.z < 10, `block at z ${block.z} clears the stage`);
    assert.ok(zEnd > -20, `block at z ${block.z} z extent`);
  }
});

test('floor row lettering follows the plan: AA-AG back bank, A-J and K-S banks', () => {
  assert.deepEqual(FLOOR_ROW_LETTERS.slice(0, 7), ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG']);
  assert.deepEqual(FLOOR_ROW_LETTERS.slice(7), [...'ABCDEFGHIJKLMNOPQRS']);
  for (const block of END_STAGE_FLOOR_BLOCKS) {
    const first = FLOOR_ROW_LETTERS[block.rowOffset];
    const last = FLOOR_ROW_LETTERS[block.rowOffset + block.rows - 1];
    if (block.rowOffset === 0) {
      assert.equal(first, 'AA');
      assert.equal(last, 'AG');
    } else if (block.rowOffset === 7) {
      assert.equal(first, 'A');
      assert.equal(last, 'J');
    } else {
      assert.equal(first, 'K');
      assert.equal(last, 'S');
    }
  }
});

test('floor seat numbers: 80s half then 90s half, 89 and 90 at the aisles', () => {
  assert.deepEqual(floorBlockSeatNumbers(12), [89, 88, 87, 86, 85, 84, 95, 94, 93, 92, 91, 90]);
  assert.deepEqual(floorBlockSeatNumbers(10), [89, 88, 87, 86, 85, 94, 93, 92, 91, 90]);
});

test('column totals match the plan totals (312) and (190)', () => {
  const columnTotal = (seats, columns) => END_STAGE_FLOOR_BLOCKS
    .filter((b) => b.seats === seats)
    .reduce((sum, b) => sum + b.rows * b.seats, 0) / columns;
  assert.equal(columnTotal(12, 3), 312); // three 12-seat columns
  assert.equal(columnTotal(10, 2), 190); // two 10-seat side columns
});

test('floor seating totals 1316 seats', () => {
  const total = END_STAGE_FLOOR_BLOCKS.reduce((sum, b) => sum + b.rows * b.seats, 0);
  assert.equal(total, 1316);
});

test('two WZ zones flank the back bank without overlapping seats', () => {
  assert.equal(END_STAGE_FLOOR_WZ.length, 2);
  for (const zone of END_STAGE_FLOOR_WZ) {
    assert.ok(Math.abs(zone.x) < 20 && Math.abs(zone.z) < 20, 'zone on the arena floor');
    assert.ok(zone.z < 10, 'zone clears the stage');
    for (const block of END_STAGE_FLOOR_BLOCKS) {
      const halfWidth = (block.seats - 1) * 0.55 / 2;
      const zEnd = block.z - (block.rows - 1) * 0.78;
      const overlapX = Math.abs(zone.x - block.x) < halfWidth + 2.1;
      const overlapZ = zone.z - 1.9 < block.z && zone.z + 1.9 > zEnd;
      assert.ok(!(overlapX && overlapZ), `zone at x ${zone.x} overlaps a seat block`);
    }
  }
});
