import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROW_LIMITS_BY_GATE,
  WHEELCHAIR_PLATFORMS,
  seatExistsOnPlan,
} from '../src/venues/hkc.js';

test('uses the PDF row limits for each gate', () => {
  assert.deepEqual(ROW_LIMITS_BY_GATE[0], [39, 39, 36, 36, 36, 36, 36, 36, 39, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[1], [39, 39, 36, 36, 36, 36, 36, 36, 39, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[2], [39, 39, 36, 33, 34, 34, 34, 33, 36, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[3], [39, 39, 36, 36, 36, 36, 36, 36, 39, 39]);
});

test('maps all eleven official wheelchair platform IDs', () => {
  assert.deepEqual(
    WHEELCHAIR_PLATFORMS.map(({ id, aisle }) => [id, aisle]).sort((a, b) => a[0] - b[0]),
    [[1, 61], [2, 64], [3, 67], [4, 72], [5, 75], [6, 41], [7, 44], [8, 47], [9, 51], [10, 54], [11, 56]],
  );
});

test('rejects coordinates outside the official seat-number domain', () => {
  const invalidSeats = [
    [39, 1, 90], [80, 1, 90],
    [40, 0, 90], [40, 40, 90],
    [40, 1, 80], [40, 1, 99],
    [40.5, 1, 90], [40, 1.5, 90], [40, 1, 90.5],
  ];

  for (const coordinates of invalidSeats) {
    assert.equal(seatExistsOnPlan(...coordinates), false, coordinates.join('-'));
  }
});

test('WP6 has only rows 9-13 before the platform', () => {
  assert.equal(seatExistsOnPlan(41, 1, 90), false);
  assert.equal(seatExistsOnPlan(41, 8, 90), false);
  assert.equal(seatExistsOnPlan(41, 9, 90), true);
  assert.equal(seatExistsOnPlan(41, 13, 90), true);
  assert.equal(seatExistsOnPlan(41, 14, 90), false);
  assert.equal(seatExistsOnPlan(42, 14, 89), false);
  assert.equal(seatExistsOnPlan(41, 1, 89), true);
});

test('applies a wheelchair platform to both halves of its physical block', () => {
  assert.equal(seatExistsOnPlan(41, 14, 90), false);
  assert.equal(seatExistsOnPlan(42, 14, 89), false);
  assert.equal(seatExistsOnPlan(41, 14, 89), true);
  assert.equal(seatExistsOnPlan(42, 14, 90), true);
});

test('applies the PDF seat-number ranges by row', () => {
  assert.equal(seatExistsOnPlan(45, 1, 96), true);
  assert.equal(seatExistsOnPlan(45, 1, 97), false);
  assert.equal(seatExistsOnPlan(45, 16, 93), true);
  assert.equal(seatExistsOnPlan(45, 16, 94), false);
});

test('shortens straight and corner blocks at their actual outer rows', () => {
  assert.equal(seatExistsOnPlan(65, 34, 90), true);
  assert.equal(seatExistsOnPlan(65, 35, 90), false);
  assert.equal(seatExistsOnPlan(45, 36, 90), true);
  assert.equal(seatExistsOnPlan(45, 37, 90), false);
  assert.equal(seatExistsOnPlan(40, 39, 90), true);
  assert.equal(seatExistsOnPlan(40, 39, 98), false);
});

test('matches the PDF seat totals for representative outer blocks', () => {
  const nextAisle = (aisle) => aisle === 79 ? 40 : aisle + 1;
  const outerBlockTotal = (aisle, lastRow) => {
    let total = 0;
    for (let row = 21; row <= lastRow; row++) {
      for (let seat = 90; seat <= 98; seat++) total += Number(seatExistsOnPlan(aisle, row, seat));
      for (let seat = 81; seat <= 89; seat++) total += Number(seatExistsOnPlan(nextAisle(aisle), row, seat));
    }
    return total;
  };

  assert.equal(outerBlockTotal(40, 39), 205);
  assert.equal(outerBlockTotal(41, 39), 188);
  assert.equal(outerBlockTotal(42, 36), 154);
  assert.equal(outerBlockTotal(43, 36), 214);
  assert.equal(outerBlockTotal(44, 36), 224);
  assert.equal(outerBlockTotal(60, 39), 199);
  assert.equal(outerBlockTotal(61, 39), 186);
  assert.equal(outerBlockTotal(62, 36), 152);
  assert.equal(outerBlockTotal(63, 33), 169);
  assert.equal(outerBlockTotal(64, 34), 182);
});

test('produces the expected total number of modelled seats', () => {
  let total = 0;
  for (let aisle = 40; aisle <= 79; aisle++) {
    for (let row = 1; row <= 39; row++) {
      for (let seat = 81; seat <= 98; seat++) {
        total += Number(seatExistsOnPlan(aisle, row, seat));
      }
    }
  }

  assert.equal(total, 16106);
});
