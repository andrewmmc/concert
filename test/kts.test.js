import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KTS_ACCESSIBLE_SECTIONS,
  KTS_GATES,
  KTS_SECTION_IDS,
  kts,
  ktsRowLabels,
  ktsSeatCount,
  ktsSeatExists,
  ktsSeatNumbers,
  ktsSeatTotal,
  ktsSection,
} from '../src/venues/kts.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('KTS is registered at the stadium layout route', () => {
  assert.equal(getVenue('kts'), kts);
  assert.equal(resolveLayout(kts, 'stadium').id, 'stadium');
  assert.equal(resolveLayout(kts, 'unknown').id, 'stadium');
});

test('matches the section ranges printed on the KTS plan', () => {
  assert.equal(KTS_SECTION_IDS.length, 82);
  assert.deepEqual(KTS_SECTION_IDS.slice(0, 10), [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
  assert.deepEqual(KTS_SECTION_IDS.slice(10, 13), [201, 202, 203]);
  assert.deepEqual(KTS_SECTION_IDS.slice(13, 16), [212, 213, 214]);
  assert.deepEqual(KTS_SECTION_IDS.slice(-3), [538, 539, 540]);
  for (let id = 204; id <= 211; id++) assert.equal(ktsSection(id), null);
});

test('uses the plan row domains for each seating level', () => {
  assert.deepEqual(ktsRowLabels(101).slice(-3), ['S', 'T', 'V']);
  assert.deepEqual(ktsRowLabels(201).slice(-3), ['V', 'W', 'X']);
  assert.deepEqual(ktsRowLabels(501).slice(-4), ['DD', 'EE', 'FF', 'GG']);
  assert.equal(ktsRowLabels(204).length, 0);
  assert.equal(ktsRowLabels(501).includes('I'), false);
  assert.equal(ktsRowLabels(501).includes('O'), false);
  assert.equal(ktsRowLabels(501).includes('U'), false);
});

test('seat-number ranges are deterministic and contiguous across each stand side', () => {
  const row = 'A';
  const northUpper = [502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512];
  let previousLast = 0;
  for (const section of northUpper) {
    const seats = ktsSeatNumbers(section, row);
    assert.equal(seats.length, ktsSeatCount(section, row));
    assert.equal(seats[0], previousLast + 1);
    previousLast = seats.at(-1);
  }
});

test('validates section, row and seat boundaries', () => {
  assert.equal(ktsSeatExists(101, 'A', 1), true);
  assert.equal(ktsSeatExists(101, 'V', 14), true);
  assert.equal(ktsSeatExists(101, 'V', 15), false);
  assert.equal(ktsSeatExists(201, 'X', 1), true);
  assert.equal(ktsSeatExists(201, 'Y', 1), false);
  assert.equal(ktsSeatExists(501, 'GG', 22), true);
  assert.equal(ktsSeatExists(501, 'HH', 1), false);
  assert.equal(ktsSeatExists(204, 'A', 1), false);
});

test('preserves the deterministic aggregate model total', () => {
  assert.equal(ktsSeatTotal(), 44144);
});

test('includes the gates and accessible seating called out by the plan', () => {
  assert.deepEqual(KTS_GATES, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
  assert.ok(KTS_ACCESSIBLE_SECTIONS.length > 0);
  for (const section of KTS_ACCESSIBLE_SECTIONS) assert.ok(ktsSection(section));
  assert.equal(kts.roofLabel, 'Retractable roof structure');
});

test('does not expose the misc source drawing as a public URL', () => {
  assert.equal(kts.planUrl, undefined);
  for (const layout of kts.layouts) assert.equal(layout.planUrl, undefined);
});
