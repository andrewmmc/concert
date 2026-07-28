import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KTS_ACCESSIBLE_SECTIONS,
  KTS_GATES,
  KTS_LOWER_BOWL_TOTALS,
  KTS_PDF_TOTALS,
  KTS_ROW_LABELS,
  KTS_SECTION_IDS,
  KTS_UPPER_GATE_TOTALS,
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

test('uses the different row domains printed around the KTS bowl', () => {
  assert.deepEqual(ktsRowLabels(101).slice(-3), ['S', 'T', 'V']);
  assert.deepEqual(ktsRowLabels(201).slice(-4), ['AA', 'BB', 'CC', 'DD']);
  assert.deepEqual(ktsRowLabels(215).slice(-4), ['EE', 'FF', 'GG', 'HH']);
  assert.deepEqual(ktsRowLabels(224).slice(-4), ['CC', 'DD', 'EE', 'FF']);
  assert.deepEqual(ktsRowLabels(236).slice(-4), ['EE', 'FF', 'GG', 'HH']);
  assert.deepEqual(ktsRowLabels(501).slice(-4), ['MM', 'NN', 'PP', 'QQ']);
  for (const row of ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG']) {
    assert.ok(ktsRowLabels(215).includes(row), `Level 2 side block includes row ${row}`);
  }
  assert.equal(ktsRowLabels(204).length, 0);
  for (const omitted of ['I', 'O', 'U', 'II', 'OO']) assert.equal(KTS_ROW_LABELS.includes(omitted), false);
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
  const firstInner = ktsSeatNumbers(101, 'A')[0];
  const lastNorth = ktsSeatNumbers(201, 'DD').at(-1);
  const lastUpper = ktsSeatNumbers(501, 'QQ').at(-1);
  assert.equal(ktsSeatExists(101, 'A', firstInner), true);
  assert.equal(ktsSeatExists(201, 'DD', lastNorth), true);
  assert.equal(ktsSeatExists(201, 'EE', 1), false);
  assert.equal(ktsSeatExists(215, 'GG', ktsSeatNumbers(215, 'GG')[0]), true);
  assert.equal(ktsSeatExists(501, 'QQ', lastUpper), true);
  assert.equal(ktsSeatExists(501, 'RR', 1), false);
  assert.equal(ktsSeatExists(204, 'A', 1), false);
});

test('matches every printed lower-bowl gate total', () => {
  for (const [sectionId, expected] of Object.entries(KTS_LOWER_BOWL_TOTALS)) {
    const actual = ktsRowLabels(sectionId)
      .reduce((sum, row) => sum + ktsSeatCount(sectionId, row), 0);
    assert.equal(actual, expected, `section ${sectionId}`);
  }
  assert.equal(Object.values(KTS_LOWER_BOWL_TOTALS).reduce((sum, total) => sum + total, 0), 24198);
});

test('matches the upper-gate and aggregate PDF totals', () => {
  const upperModelTotal = KTS_SECTION_IDS.filter((id) => id >= 501)
    .reduce((total, sectionId) => total + ktsRowLabels(sectionId)
      .reduce((sum, row) => sum + ktsSeatCount(sectionId, row), 0), 0);
  assert.equal(KTS_UPPER_GATE_TOTALS.length, 39);
  assert.equal(KTS_UPPER_GATE_TOTALS.reduce((sum, total) => sum + total, 0), 23261);
  assert.equal(upperModelTotal, 23261);
  assert.deepEqual(KTS_PDF_TOTALS, {
    bowl: 47459,
    companion: 512,
    wheelchair: 512,
    fixed: 48483,
  });
  assert.equal(ktsSeatTotal(), KTS_PDF_TOTALS.bowl);
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
