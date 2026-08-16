import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QES_STAND_SECTIONS,
  QES_STAND_ROWS,
  expandRows,
  layoutSeatTotal,
  parseSeatSpec,
  qes,
  qesLayout,
  standRowSeatCount,
  tierOf,
} from '../src/venues/qes.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('QES is registered as a venue with five official layouts', () => {
  assert.equal(getVenue('qes'), qes);
  assert.deepEqual(
    qes.layouts.map((layout) => layout.id),
    ['end-stage', '3-side-end-stage', 'central-stage', 'boxing-ring', 'central-court'],
  );
  assert.equal(resolveLayout(qes, 'central-stage').id, 'central-stage');
  assert.equal(resolveLayout(qes, 'unknown').id, 'end-stage');
});

test('stand sections match the fixed section totals printed on the QES plans', () => {
  assert.deepEqual(
    QES_STAND_SECTIONS.map(({ id, total }) => [id, total]),
    [[1, 413], [2, 345], [3, 337], [4, 396], [5, 389], [6, 325], [7, 274], [8, 413]],
  );
  assert.equal(QES_STAND_SECTIONS.reduce((sum, section) => sum + section.total, 0), 2892);
});

test('each stand section reconciles: drawn seats + wheelchair platform = total', () => {
  for (const section of QES_STAND_SECTIONS) {
    const drawn = Object.values(QES_STAND_ROWS[section.id])
      .reduce((sum, spec) => sum + standRowSeatCount(spec), 0);
    const platform = section.platform ? 10 : 0;
    assert.equal(drawn + platform, section.total, `section ${section.id}`);
  }
});

test('parseSeatSpec splits physical blocks and number skips', () => {
  assert.deepEqual(
    parseSeatSpec('30-32,34-35 | 48-50'),
    [[30, 31, 32, 34, 35], [48, 49, 50]],
  );
  assert.deepEqual(parseSeatSpec('1 | 4-6'), [[1], [4, 5, 6]]);
});

test('expandRows expands letter ranges and comma groups', () => {
  assert.deepEqual(expandRows('G-L'), ['G', 'H', 'I', 'J', 'K', 'L']);
  assert.deepEqual(expandRows('P,Q'), ['P', 'Q']);
  assert.deepEqual(expandRows('F'), ['F']);
});

test('per-row seat counts match the plan', () => {
  assert.equal(standRowSeatCount(QES_STAND_ROWS[3].M), 36);
  assert.equal(standRowSeatCount(QES_STAND_ROWS[8].U), 8);
  assert.equal(standRowSeatCount(QES_STAND_ROWS[1].F), 17);
});

test('tier assignment follows the three-level structure', () => {
  assert.equal(tierOf(2, 'C'), '3/F');
  assert.equal(tierOf(2, 'J'), '4/F');
  assert.equal(tierOf(3, 'P'), '5/F');
  assert.equal(tierOf(1, 'F'), '4/F');
  assert.equal(tierOf(1, 'T'), '5/F');
});

test('layout helper falls back to the default QES end-stage plan', () => {
  assert.equal(qesLayout('central-court').id, 'central-court');
  assert.equal(qesLayout('missing').id, 'end-stage');
});

test('QES layout totals include the correct arena-floor sections', () => {
  assert.equal(layoutSeatTotal('central-court'), 2892);
  assert.equal(layoutSeatTotal('boxing-ring'), 3354);
  assert.equal(layoutSeatTotal('central-stage'), 3526);
  assert.equal(layoutSeatTotal('3-side-end-stage'), 2711);
  assert.equal(layoutSeatTotal('end-stage'), 3502);
});

test('3-side end stage closes the west-stand sections behind the stage', () => {
  assert.deepEqual(qesLayout('3-side-end-stage').closedStands, [4, 5]);
  const stand = QES_STAND_SECTIONS.reduce((sum, s) => sum + s.total, 0);
  assert.equal(layoutSeatTotal('3-side-end-stage'), stand - 396 - 389 + 302 + 302);
});

test('wheelchair platforms per layout match the plan legends', () => {
  const counts = Object.fromEntries(qes.layouts.map((l) => [l.id, qesLayout(l.id).platforms.length]));
  assert.deepEqual(counts, {
    'end-stage': 4,
    '3-side-end-stage': 2,
    'central-stage': 4,
    'boxing-ring': 4,
    'central-court': 4,
  });
});

test('QES layouts do not expose misc source PDFs as public links', () => {
  assert.equal(qes.planUrl, undefined);
  for (const layout of qes.layouts) assert.equal(layout.planUrl, undefined);
});
