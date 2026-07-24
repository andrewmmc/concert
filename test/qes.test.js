import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QES_STAND_SECTIONS,
  layoutSeatTotal,
  qes,
  qesLayout,
  rowSeatCounts,
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
    [[1, 395], [2, 345], [3, 337], [4, 396], [5, 398], [6, 325], [7, 274], [8, 413]],
  );
  assert.equal(QES_STAND_SECTIONS.reduce((sum, section) => sum + section.total, 0), 2883);
});

test('row seat distribution is deterministic and preserves totals', () => {
  assert.deepEqual(rowSeatCounts(10, 3), [3, 3, 4]);
  assert.equal(rowSeatCounts(345, 18).reduce((sum, count) => sum + count, 0), 345);
  assert.equal(Math.max(...rowSeatCounts(345, 18)) - Math.min(...rowSeatCounts(345, 18)), 1);
});

test('layout helper falls back to the default QES end-stage plan', () => {
  assert.equal(qesLayout('central-court').id, 'central-court');
  assert.equal(qesLayout('missing').id, 'end-stage');
});

test('QES layout totals include the correct event-floor sections', () => {
  assert.equal(layoutSeatTotal('central-court'), 2883);
  assert.equal(layoutSeatTotal('boxing-ring'), 3345);
  assert.equal(layoutSeatTotal('central-stage'), 3517);
  assert.equal(layoutSeatTotal('3-side-end-stage'), 2693);
  assert.equal(layoutSeatTotal('end-stage'), 3493);
});

test('3-side end stage closes the west-stand sections behind the stage', () => {
  assert.deepEqual(qesLayout('3-side-end-stage').closedStands, [4, 5]);
  const open = layoutSeatTotal('3-side-end-stage');
  const all = QES_STAND_SECTIONS.reduce((sum, section) => sum + section.total, 0) + 604;
  assert.equal(open, all - 396 - 398);
});

test('end-stage floor sections run rows along x facing the west stage', () => {
  for (const layout of ['end-stage', '3-side-end-stage']) {
    for (const section of qesLayout(layout).floorSections) {
      assert.equal(section.axis, 'x');
      assert.equal(section.yaw, -Math.PI / 2);
    }
  }
});

test('QES layouts do not expose misc source PDFs as public links', () => {
  assert.equal(qes.planUrl, undefined);
  for (const layout of qes.layouts) assert.equal(layout.planUrl, undefined);
});
