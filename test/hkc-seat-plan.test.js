import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROW_LIMITS_BY_GATE,
  WHEELCHAIR_PLATFORMS,
  seatExistsOnPlan,
  standSeatPositionInBlock,
} from '../src/venues/hkc.js';

test('uses the PDF row limits for each gate', () => {
  assert.deepEqual(ROW_LIMITS_BY_GATE[0], [39, 36, 36, 36, 36, 36, 36, 36, 39, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[1], [39, 36, 36, 36, 36, 36, 36, 36, 39, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[2], [39, 36, 33, 34, 34, 34, 33, 36, 39, 39]);
  assert.deepEqual(ROW_LIMITS_BY_GATE[3], [39, 36, 36, 36, 36, 36, 36, 36, 39, 39]);
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

test('WP6 keeps rows 1-8 on the adjacent 90-series half', () => {
  // WP6 occupies the block between aisles 41 and 42, which holds the high
  // seats of gate 42 and the low seats of gate 41.  Only the low half starts
  // at row 9.
  assert.equal(seatExistsOnPlan(42, 1, 90), true);
  assert.equal(seatExistsOnPlan(42, 8, 90), true);
  assert.equal(seatExistsOnPlan(42, 9, 90), true);
  assert.equal(seatExistsOnPlan(42, 13, 90), true);
  assert.equal(seatExistsOnPlan(42, 14, 90), false);
  assert.equal(seatExistsOnPlan(41, 1, 89), false);
  assert.equal(seatExistsOnPlan(41, 8, 89), false);
  assert.equal(seatExistsOnPlan(41, 9, 89), true);
});

test('applies a wheelchair platform to both halves of its physical block', () => {
  assert.equal(seatExistsOnPlan(41, 14, 89), false);
  assert.equal(seatExistsOnPlan(42, 14, 90), false);
  assert.equal(seatExistsOnPlan(41, 14, 90), true);
  assert.equal(seatExistsOnPlan(42, 14, 89), true);
});

test('attributes the two halves of a block to the correct gates', () => {
  // WP1 occupies the block between aisles 61 and 62.  Gate 62's high seats
  // retain rows 1-8 while gate 61's low seats start at row 9.
  assert.equal(seatExistsOnPlan(62, 8, 90), true);
  assert.equal(seatExistsOnPlan(61, 8, 89), false);
  assert.equal(seatExistsOnPlan(62, 9, 90), true);
  assert.equal(seatExistsOnPlan(61, 9, 89), true);
  // Gate 61's high seats live in the previous block (aisles 60-61) and
  // gate 62's low seats in the next one (aisles 62-63), both unaffected.
  assert.equal(seatExistsOnPlan(61, 1, 90), true);
  assert.equal(seatExistsOnPlan(62, 1, 89), true);
});

test('includes section 76 row 6 seat 93 shown on the centre-stage plan', () => {
  assert.equal(seatExistsOnPlan(76, 6, 93), true);
});

test('packs shortened 8X and 9X ranges together in their area halves', () => {
  const lowCount = 6;
  const highCount = 7;

  assert.equal(standSeatPositionInBlock(89, lowCount, highCount), 0.5 / (lowCount * 2));
  assert.equal(standSeatPositionInBlock(84, lowCount, highCount), 0.5 - 0.5 / (lowCount * 2));
  assert.equal(standSeatPositionInBlock(96, lowCount, highCount), 0.5 + 0.5 / (highCount * 2));
  assert.equal(standSeatPositionInBlock(90, lowCount, highCount), 1 - 0.5 / (highCount * 2));

  for (let seat = 84; seat <= 89; seat++) {
    assert.ok(
      standSeatPositionInBlock(seat, lowCount, highCount) < 0.5,
      `seat ${seat} remains in the lower area's half`,
    );
  }
  for (let seat = 90; seat <= 96; seat++) {
    assert.ok(
      standSeatPositionInBlock(seat, lowCount, highCount) > 0.5,
      `seat ${seat} remains in the higher area's half`,
    );
  }

  const centreSpacing = standSeatPositionInBlock(96, lowCount, highCount) -
    standSeatPositionInBlock(84, lowCount, highCount);
  assert.ok(Math.abs(
    centreSpacing - (0.25 / lowCount + 0.25 / highCount),
  ) < Number.EPSILON);
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
  assert.equal(seatExistsOnPlan(44, 36, 89), true);
  assert.equal(seatExistsOnPlan(45, 36, 90), false);
  assert.equal(seatExistsOnPlan(44, 37, 89), false);
  assert.equal(seatExistsOnPlan(40, 39, 90), true);
  assert.equal(seatExistsOnPlan(40, 39, 98), false);
});

test('matches all forty upper-block totals printed in the PDF', () => {
  const nextAisle = (aisle) => aisle === 79 ? 40 : aisle + 1;
  const outerBlockTotal = (aisle) => {
    let total = 0;
    for (let row = 21; row <= 39; row++) {
      // The block between `aisle` and the next one holds the low seats of
      // gate `aisle` and the high seats of the next gate.
      for (let seat = 81; seat <= 89; seat++) total += Number(seatExistsOnPlan(aisle, row, seat));
      for (let seat = 90; seat <= 98; seat++) total += Number(seatExistsOnPlan(nextAisle(aisle), row, seat));
    }
    return total;
  };

  const expected = [
    [188, 154, 214, 224, 203, 224, 214, 154, 188, 205],
    [188, 154, 214, 224, 204, 224, 214, 154, 188, 205],
    [186, 152, 169, 182, 182, 182, 169, 152, 186, 199],
    [186, 154, 214, 224, 204, 224, 214, 154, 187, 205],
  ];

  for (let gate = 0; gate < expected.length; gate++) {
    for (let offset = 0; offset < expected[gate].length; offset++) {
      const aisle = 40 + gate * 10 + offset;
      assert.equal(outerBlockTotal(aisle), expected[gate][offset], `block after aisle ${aisle}`);
    }
  }
});

test('produces the expected total number of modelled seats', () => {
  const byTier = [0, 0, 0];
  for (let aisle = 40; aisle <= 79; aisle++) {
    for (let row = 1; row <= 39; row++) {
      for (let seat = 81; seat <= 98; seat++) {
        const tier = row <= 15 ? 0 : row <= 20 ? 1 : 2;
        byTier[tier] += Number(seatExistsOnPlan(aisle, row, seat));
      }
    }
  }

  assert.deepEqual(byTier, [7030, 1720, 7662]);
  assert.equal(byTier.reduce((total, seats) => total + seats, 0), 16412);
});
