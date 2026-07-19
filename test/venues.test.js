import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultVenue, getVenue, resolveLayout, venues } from '../src/venues/index.js';

test('looks up a registered venue by ID', () => {
  assert.equal(getVenue('hkc'), venues[0]);
  assert.equal(getVenue('hkc').id, 'hkc');
});

test('falls back to the default venue for missing and unknown IDs', () => {
  assert.equal(getVenue(), defaultVenue);
  assert.equal(getVenue('unknown'), defaultVenue);
});

test('resolves an exact layout match', () => {
  assert.equal(resolveLayout(defaultVenue, 'center-stage').id, 'center-stage');
  assert.equal(resolveLayout(defaultVenue, 'end-stage').id, 'end-stage');
});

test('falls back to the configured default layout', () => {
  assert.equal(resolveLayout(defaultVenue, 'unknown').id, defaultVenue.defaultLayout);
  assert.equal(resolveLayout(defaultVenue).id, defaultVenue.defaultLayout);
});

test('uses the first layout when the configured default does not exist', () => {
  const venue = {
    defaultLayout: 'missing',
    layouts: [{ id: 'first' }, { id: 'second' }],
  };

  assert.equal(resolveLayout(venue, 'unknown'), venue.layouts[0]);
});

test('returns null for venues without layouts', () => {
  assert.equal(resolveLayout({}, 'anything'), null);
  assert.equal(resolveLayout({ layouts: [] }, 'anything'), null);
});
