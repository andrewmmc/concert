import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AWE_HALL_5600_SECTIONS,
  AWE_HALL_LAYOUTS,
  AWE_HALL_SECTIONS,
  aweHalls,
  aweHallsPlacements,
  aweHallsRowLabels,
  aweHallsSeatExists,
  aweHallsSeatNumbers,
  aweHallsSeatTotal,
  aweHallsSectionTotal,
} from '../src/venues/awe-halls.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('AWE VIVA is registered with TH8400 and TH5600 routes', () => {
  assert.equal(getVenue('awe-halls'), aweHalls);
  assert.equal(resolveLayout(aweHalls, 'th8400').id, 'th8400');
  assert.equal(resolveLayout(aweHalls, 'th5600').id, 'th5600');
  assert.equal(resolveLayout(aweHalls, 'unknown').id, 'th8400');
});

test('models every hall and block printed on AWE-VIVA-H8-TH8400', () => {
  assert.deepEqual(
    AWE_HALL_SECTIONS.map(({ id, hall, block }) => [id, hall, block]),
    [['8A', 8, 'A'], ['8B', 8, 'B'], ['8C', 8, 'C'], ['10C', 10, 'C'], ['10D', 10, 'D']],
  );
});

test('numbers the drawing rows from the stage within each hall block', () => {
  assert.equal(aweHallsRowLabels('8A').length, 29);
  assert.equal(aweHallsRowLabels('8B').length, 20);
  assert.equal(aweHallsRowLabels('8C').length, 35);
  assert.equal(aweHallsRowLabels('10C').length, 18);
  assert.equal(aweHallsRowLabels('10D').length, 14);
  assert.deepEqual(aweHallsRowLabels('8A').slice(0, 3), ['1', '2', '3']);
  assert.equal(aweHallsRowLabels('missing').length, 0);
});

test('preserves the tapered front of Hall 8 Block A', () => {
  assert.equal(aweHallsSeatNumbers('8A', 1).length, 28);
  assert.equal(aweHallsSeatNumbers('8A', 2).length, 52);
  assert.equal(aweHallsSeatNumbers('8A', 6).length, 60);
  assert.equal(aweHallsSeatNumbers('8A', 7).length, 64);
  assert.equal(aweHallsSeatNumbers('8A', 10).length, 76);
  assert.equal(aweHallsSeatExists('8A', 1, 28), true);
  assert.equal(aweHallsSeatExists('8A', 1, 29), false);
});

test('keeps the central production gaps drawn in Blocks B and C', () => {
  assert.equal(aweHallsSeatNumbers('8B', 1).length, 48);
  assert.equal(aweHallsSeatNumbers('8C', 1).length, 60);
  assert.equal(aweHallsSeatNumbers('8C', 2).length, 88);
  assert.equal(aweHallsSeatNumbers('10C', 1).length, 56);
  assert.equal(aweHallsSeatNumbers('10C', 4).length, 68);
});

test('matches every block total and all 8,364 individual seats in the PDF', () => {
  assert.deepEqual(
    Object.fromEntries(AWE_HALL_SECTIONS.map((section) =>
      [section.id, aweHallsSectionTotal(section.id)])),
    { '8A': 2008, '8B': 960, '8C': 3032, '10C': 1188, '10D': 1176 },
  );
  assert.equal(aweHallsSeatTotal(), 8364);
  assert.equal(aweHallsPlacements().length, 8364);
});

test('orders blocks from the Hall 6 stage through Hall 10', () => {
  const placements = aweHallsPlacements();
  const meanZ = (section) => {
    const seats = placements.filter((placement) => placement.sec === section);
    return seats.reduce((total, seat) => total + seat.z, 0) / seats.length;
  };
  assert.ok(meanZ('8A') < meanZ('8B'));
  assert.ok(meanZ('8B') < meanZ('8C'));
  assert.ok(meanZ('8C') < meanZ('10C'));
  assert.ok(meanZ('10C') < meanZ('10D'));
});

test('raises Hall 10 on the seat riser while Hall 8 remains flat', () => {
  const placements = aweHallsPlacements();
  const at = (section, row) =>
    placements.find((placement) => placement.sec === section && placement.row === row);
  assert.equal(at('8A', 1).y, at('8A', 29).y);
  assert.ok(at('10C', 18).y > at('10C', 1).y);
  assert.ok(at('10D', 1).y > at('10C', 18).y);
  assert.ok(at('10D', 14).y > at('10D', 1).y);
});

test('does not expose the source PDF as a public link', () => {
  assert.equal(aweHalls.planUrl, undefined);
  for (const layout of aweHalls.layouts) assert.equal(layout.planUrl, undefined);
});

test('TH5600 models Hall 8 Blocks A-B and Hall 10 Blocks C-D', () => {
  assert.equal(AWE_HALL_LAYOUTS.th5600.sections, AWE_HALL_5600_SECTIONS);
  assert.deepEqual(
    AWE_HALL_5600_SECTIONS.map(({ id, hall, block }) => [id, hall, block]),
    [['8A', 8, 'A'], ['8B', 8, 'B'], ['10C', 10, 'C'], ['10D', 10, 'D']],
  );
  assert.equal(AWE_HALL_LAYOUTS.th5600.stageHall, 8);
});

test('TH5600 uses the exact PDF row domains', () => {
  assert.equal(aweHallsRowLabels('8A', 'th5600').length, 29);
  assert.equal(aweHallsRowLabels('8B', 'th5600').length, 17);
  assert.equal(aweHallsRowLabels('10C', 'th5600').length, 22);
  assert.equal(aweHallsRowLabels('10D', 'th5600').length, 10);
  assert.deepEqual(aweHallsRowLabels('8A', 'th5600').slice(-3), ['27', '28', '29']);
  assert.deepEqual(aweHallsRowLabels('8C', 'th5600'), []);
});

test('TH5600 preserves the tapered stage end of Hall 8 Block A', () => {
  const seats = (row) => aweHallsSeatNumbers('8A', row, 'th5600').length;
  assert.equal(seats(1), 28);
  assert.equal(seats(2), 52);
  assert.equal(seats(4), 60);
  assert.equal(seats(5), 62);
  assert.equal(seats(7), 64);
  assert.equal(seats(10), 76);
  assert.equal(seats(14), 84);
  assert.equal(seats(15), 88);
  assert.equal(aweHallsSeatExists('8A', 1, 28, 'th5600'), true);
  assert.equal(aweHallsSeatExists('8A', 1, 29, 'th5600'), false);
});

test('TH5600 preserves the central gaps and Hall 10 riser widths', () => {
  assert.equal(aweHallsSeatNumbers('8B', 1, 'th5600').length, 60);
  assert.equal(aweHallsSeatNumbers('10C', 1, 'th5600').length, 56);
  assert.equal(aweHallsSeatNumbers('10C', 4, 'th5600').length, 68);
  assert.equal(aweHallsSeatNumbers('10C', 19, 'th5600').length, 84);
  assert.equal(aweHallsSeatNumbers('10D', 1, 'th5600').length, 84);
});

test('TH5600 matches all 5,600 individually drawn seats', () => {
  assert.deepEqual(
    Object.fromEntries(AWE_HALL_5600_SECTIONS.map((section) =>
      [section.id, aweHallsSectionTotal(section.id, 'th5600')])),
    { '8A': 2216, '8B': 1020, '10C': 1524, '10D': 840 },
  );
  assert.equal(aweHallsSeatTotal('th5600'), 5600);
  assert.equal(aweHallsPlacements('th5600').length, 5600);
});

test('TH5600 runs from its Hall 8 stage toward the Hall 10 riser', () => {
  const placements = aweHallsPlacements('th5600');
  const meanZ = (section) => {
    const seats = placements.filter((placement) => placement.sec === section);
    return seats.reduce((total, seat) => total + seat.z, 0) / seats.length;
  };
  assert.ok(meanZ('8A') < meanZ('8B'));
  assert.ok(meanZ('8B') < meanZ('10C'));
  assert.ok(meanZ('10C') < meanZ('10D'));

  const first = (section) => placements.find((placement) => placement.sec === section);
  const last = (section) => placements.findLast((placement) => placement.sec === section);
  assert.equal(first('8A').y, last('8A').y);
  assert.ok(last('10C').y > first('10C').y);
  assert.ok(first('10D').y > last('10C').y);
});
