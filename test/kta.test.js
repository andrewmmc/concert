import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KTA_BOWL_SECTIONS,
  KTA_FLOOR_BLOCKS,
  KTA_OMITTED_ROWS,
  kta,
  ktaBowlPlacement,
  ktaRowLabels,
  ktaSeatExists,
  ktaSeatNumbers,
  ktaSeatTotal,
} from '../src/venues/kta.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('KTA is registered at the end-stage route', () => {
  assert.equal(getVenue('kta'), kta);
  assert.equal(resolveLayout(kta, 'end-stage').id, 'end-stage');
  assert.equal(resolveLayout(kta, 'unknown').id, 'end-stage');
});

test('matches the bowl and floor blocks shown by the reference plans', () => {
  assert.deepEqual(
    KTA_BOWL_SECTIONS.map((section) => section.id),
    [102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 207, 208],
  );
  assert.deepEqual(KTA_FLOOR_BLOCKS.map((block) => block.id), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J']);
});

test('places the 102 and 109 section runs on opposite arena sides', () => {
  const side = (id) => KTA_BOWL_SECTIONS.find((section) => section.id === id).side;
  for (const id of [102, 103, 104, 105, 106]) assert.equal(side(id), 'north');
  for (const id of [109, 110, 111, 112, 113]) assert.equal(side(id), 'south');
});

test('orders the west sections from 106 through 109 and aligns their upper tiers', () => {
  const section = (id) => KTA_BOWL_SECTIONS.find((candidate) => candidate.id === id);
  assert.ok(section(107).center > section(108).center, '107 is on the 106 side of 108');
  assert.ok(section(207).center > section(208).center, '207 is on the 106 side of 208');
  assert.ok(section(207).center > 0, '207 aligns above 107');
  assert.ok(section(208).center < 0, '208 aligns above 108');
});

test('runs west-section seat numbers from the 106 side toward the 109 side', () => {
  const section = (id) => KTA_BOWL_SECTIONS.find((candidate) => candidate.id === id);
  const endpoints = [
    [107, 195, 221],
    [108, 224, 279],
    [207, 180, 221],
    [208, 224, 293],
  ];
  for (const [id, lowSeat, highSeat] of endpoints) {
    const midpoint = (lowSeat + highSeat) / 2;
    const low = ktaBowlPlacement(section(id), 0, (lowSeat - midpoint) * 0.38);
    const high = ktaBowlPlacement(section(id), 0, (highSeat - midpoint) * 0.38);
    assert.ok(low.z > high.z, `${id} low seats are on the 106 side`);
  }
});

test('raises and sets back the upper-west sections clear of 107 and 108', () => {
  const section = (id) => KTA_BOWL_SECTIONS.find((candidate) => candidate.id === id);
  for (const [lowerId, upperId] of [[107, 207], [108, 208]]) {
    const lower = section(lowerId);
    const upper = section(upperId);
    const lowerBack = ktaBowlPlacement(lower, lower.rows.length - 1, 0);
    const upperFront = ktaBowlPlacement(upper, 0, 0);
    assert.ok(upperFront.y > lowerBack.y, `${upperId} is higher than ${lowerId}`);
    assert.ok(upperFront.x < lowerBack.x, `${upperId} is set back behind ${lowerId}`);
  }
});

test('runs floor Blocks A-J from the 102 side to the 113 side', () => {
  const z = (id) => KTA_FLOOR_BLOCKS.find((block) => block.id === id).z;
  for (const id of ['A', 'B', 'C']) assert.ok(z(id) > 0, `Block ${id} is on the 102 side`);
  assert.ok(z('D') > z('E'));
  assert.ok(z('E') > z('F'));
  for (const id of ['G', 'H', 'J']) assert.ok(z(id) < 0, `Block ${id} is on the 113 side`);
});

test('omits rows I, O, U and W from every single-letter row domain', () => {
  assert.deepEqual(KTA_OMITTED_ROWS, ['I', 'O', 'U', 'W']);
  for (const section of [...KTA_BOWL_SECTIONS, ...KTA_FLOOR_BLOCKS]) {
    for (const omitted of KTA_OMITTED_ROWS) {
      assert.equal(section.rows.includes(omitted), false, `${section.id} omits row ${omitted}`);
    }
  }
  assert.deepEqual(ktaRowLabels(102).slice(-4), ['S', 'T', 'V', 'X']);
  assert.deepEqual(ktaRowLabels('A'), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J']);
});

test('uses global bowl seat-number bands printed around the arena', () => {
  assert.deepEqual(ktaSeatNumbers(102, 'A'), [
    ...Array.from({ length: 14 }, (_, i) => 31 + i),
    ...Array.from({ length: 14 }, (_, i) => 47 + i),
  ]);
  assert.deepEqual(ktaSeatNumbers(106, 'X'), [
    ...Array.from({ length: 14 }, (_, i) => 151 + i),
    ...Array.from({ length: 13 }, (_, i) => 167 + i),
  ]);
  assert.equal(ktaSeatExists(113, 'X', 444), true);
  assert.equal(ktaSeatExists(113, 'W', 444), false);
});

test('keeps the two-seat aisles printed between every straight-block seat band', () => {
  const aisleGaps = [
    [102, 45, 46], [103, 75, 76], [104, 105, 106], [105, 135, 136], [106, 165, 166],
    [109, 309, 310], [110, 339, 340], [111, 369, 370], [112, 399, 400], [113, 429, 430],
  ];
  for (const [section, first, last] of aisleGaps) {
    for (const row of ktaRowLabels(section)) {
      assert.equal(ktaSeatExists(section, row, first), false, `${section}-${row}-${first}`);
      assert.equal(ktaSeatExists(section, row, last), false, `${section}-${row}-${last}`);
    }
  }
});

test('chamfers Blocks 107 and 108 through row F and keeps 108\'s lower band', () => {
  assert.deepEqual(ktaSeatNumbers(107, 'A'), Array.from({ length: 19 }, (_, i) => 203 + i));
  assert.deepEqual(ktaSeatNumbers(107, 'F'), Array.from({ length: 27 }, (_, i) => 195 + i));
  assert.deepEqual(ktaSeatNumbers(107, 'M'), Array.from({ length: 27 }, (_, i) => 195 + i));
  assert.equal(ktaSeatExists(107, 'M', 222), false);

  assert.equal(ktaSeatExists(108, 'A', 224), true);
  assert.equal(ktaSeatExists(108, 'A', 250), true);
  assert.equal(ktaSeatExists(108, 'A', 251), false);
  assert.equal(ktaSeatExists(108, 'A', 252), false);
  assert.equal(ktaSeatExists(108, 'A', 253), true);
  assert.equal(ktaSeatExists(108, 'A', 271), true);
  assert.equal(ktaSeatExists(108, 'M', 279), true);
  assert.equal(ktaSeatExists(108, 'A', 279), false);
});

test('keeps the disjoint upper-west bands and their printed row boundaries', () => {
  // Block 207: 180-192 begins at BB; 193-194 is always an aisle.
  assert.equal(ktaSeatExists(207, 'AA', 180), false);
  assert.equal(ktaSeatExists(207, 'BB', 180), true);
  assert.equal(ktaSeatExists(207, 'HH', 192), true);
  assert.equal(ktaSeatExists(207, 'BB', 193), false);
  assert.equal(ktaSeatExists(207, 'AA', 195), true);
  assert.equal(ktaSeatExists(207, 'HH', 221), true);

  // Block 208: 224-249 is FF-HH, 252-278 is AA-HH, and the stepped
  // 281-293 cap is BB-GG. Seats 250-251 and 279-280 remain aisles.
  assert.equal(ktaSeatExists(208, 'EE', 224), false);
  assert.equal(ktaSeatExists(208, 'FF', 224), true);
  assert.equal(ktaSeatExists(208, 'HH', 249), true);
  assert.equal(ktaSeatExists(208, 'HH', 250), false);
  assert.equal(ktaSeatExists(208, 'HH', 278), true);
  assert.equal(ktaSeatExists(208, 'BB', 279), false);
  assert.equal(ktaSeatExists(208, 'AA', 281), false);
  assert.equal(ktaSeatExists(208, 'BB', 293), true);
  assert.equal(ktaSeatExists(208, 'GG', 284), true);
  assert.equal(ktaSeatExists(208, 'GG', 285), false);
  assert.equal(ktaSeatExists(208, 'HH', 281), false);
});

test('uses floor row and central-aisle seat hints from the concert plan', () => {
  const seats26 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
  const seats12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const block of ['A', 'B', 'D', 'F', 'H', 'J']) assert.deepEqual(ktaSeatNumbers(block, 'A'), seats26);
  for (const block of ['C', 'E', 'G']) assert.deepEqual(ktaSeatNumbers(block, 'A'), seats12);
  for (const block of ['A', 'B', 'C', 'G', 'H', 'J']) assert.equal(ktaRowLabels(block).at(-1), 'J');
  for (const block of ['D', 'E', 'F']) assert.equal(ktaRowLabels(block).at(-1), 'K');
  assert.equal(ktaSeatExists('D', 'K', 26), true);
  assert.equal(ktaSeatExists('A', 'K', 1), false);
  assert.equal(ktaSeatExists('A', 'A', 13), false);
});

test('matches the seat total reconstructed from the two reference drawings', () => {
  const bowl = KTA_BOWL_SECTIONS.reduce((total, section) =>
    total + section.rows.reduce((sum, row) => sum + ktaSeatNumbers(section.id, row).length, 0), 0);
  const floor = KTA_FLOOR_BLOCKS.reduce((total, section) =>
    total + section.rows.reduce((sum, row) => sum + ktaSeatNumbers(section.id, row).length, 0), 0);
  assert.equal(bowl, 6659);
  assert.equal(floor, 1680);
  assert.equal(ktaSeatTotal(), 8339);
});

test('does not expose misc reference images as public links', () => {
  assert.equal(kta.planUrl, undefined);
  for (const layout of kta.layouts) assert.equal(layout.planUrl, undefined);
});
