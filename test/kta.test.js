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
  assert.equal(ktaSeatExists(208, 'HH', 293), true);
});

test('uses floor row and central-aisle seat hints from the concert plan', () => {
  assert.deepEqual(ktaSeatNumbers('A', 'A'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]);
  assert.deepEqual(ktaSeatNumbers('C', 'J'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
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
