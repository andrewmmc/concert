import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KTA_BOWL_SECTIONS,
  KTA_FLOOR_BLOCKS,
  KTA_OMITTED_ROWS,
  kta,
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
  assert.deepEqual(ktaSeatNumbers(102, 'A'), Array.from({ length: 30 }, (_, i) => 31 + i));
  assert.deepEqual(ktaSeatNumbers(106, 'X'), Array.from({ length: 29 }, (_, i) => 151 + i));
  assert.equal(ktaSeatExists(113, 'X', 444), true);
  assert.equal(ktaSeatExists(113, 'W', 444), false);
});

test('chamfers the west blocks and keeps the upper-stand back-row strips', () => {
  // Block 108: far-side row A tops out early, row M keeps the full height.
  assert.equal(ktaSeatExists(108, 'M', 279), true);
  assert.equal(ktaSeatExists(108, 'A', 279), false);
  assert.equal(ktaSeatExists(108, 'A', 271), true);
  // Block 107: far-side row A loses its lowest seats to the cut corner.
  assert.equal(ktaSeatExists(107, 'M', 195), true);
  assert.equal(ktaSeatExists(107, 'A', 195), false);
  assert.equal(ktaSeatExists(107, 'A', 203), true);
  // Block 208: chamfered top (row HH stops at 278) plus the FF-GG-HH strip.
  assert.equal(ktaSeatExists(208, 'AA', 293), true);
  assert.equal(ktaSeatExists(208, 'HH', 293), false);
  assert.equal(ktaSeatExists(208, 'HH', 278), true);
  assert.equal(ktaSeatExists(208, 'HH', 224), true);
  assert.equal(ktaSeatExists(208, 'EE', 224), false);
  // Block 207: full main body plus the BB-through-HH strip below it.
  assert.equal(ktaSeatExists(207, 'BB', 180), true);
  assert.equal(ktaSeatExists(207, 'AA', 180), false);
  assert.equal(ktaSeatExists(207, 'BB', 193), false);
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

test('seat total is deterministic and includes both bowl and floor', () => {
  const expected = [...KTA_BOWL_SECTIONS, ...KTA_FLOOR_BLOCKS].reduce((total, section) =>
    total + section.rows.reduce((sum, row) => sum + ktaSeatNumbers(section.id, row).length, 0), 0);
  assert.equal(ktaSeatTotal(), expected);
  assert.ok(ktaSeatTotal() > 7000);
});

test('does not expose misc reference images as public links', () => {
  assert.equal(kta.planUrl, undefined);
  for (const layout of kta.layouts) assert.equal(layout.planUrl, undefined);
});
