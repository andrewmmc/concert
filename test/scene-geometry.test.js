import assert from 'node:assert/strict';
import test from 'node:test';

import { makeRingR, ringStripGeo } from '../src/scene.js';

const closeTo = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
};

test('makeRingR produces a circle when the exponent is two', () => {
  const radius = makeRingR(2);

  for (const theta of [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI]) {
    closeTo(radius(theta, 12), 12);
  }
});

test('makeRingR preserves axes and superellipse symmetry', () => {
  const radius = makeRingR(3.2);

  closeTo(radius(0, 20), 20);
  closeTo(radius(Math.PI / 2, 20), 20);
  closeTo(radius(Math.PI / 4, 20), radius(-Math.PI / 4, 20));
  closeTo(radius(Math.PI / 4, 20), radius(3 * Math.PI / 4, 20));
  assert.ok(radius(Math.PI / 4, 20) > 20);
});

test('ringStripGeo creates the expected vertices and triangles', () => {
  const geometry = ringStripGeo(makeRingR(2), [
    { S: 10, y: 1 },
    { S: 12, y: 3 },
  ], 4);

  assert.equal(geometry.getAttribute('position').count, 10);
  assert.equal(geometry.getAttribute('normal').count, 10);
  assert.equal(geometry.index.count, 24);
  assert.deepEqual(Array.from(geometry.index.array.slice(0, 6)), [0, 5, 1, 5, 6, 1]);

  const positions = geometry.getAttribute('position');
  closeTo(positions.getX(0), 10);
  closeTo(positions.getY(0), 1);
  closeTo(positions.getZ(0), 0);
  closeTo(positions.getX(5), 12);
  closeTo(positions.getY(5), 3);

  geometry.dispose();
});

test('ringStripGeo respects a partial angular span', () => {
  const geometry = ringStripGeo(
    makeRingR(2),
    [{ S: 5, y: 0 }, { S: 6, y: 1 }],
    2,
    0,
    Math.PI / 2,
  );
  const positions = geometry.getAttribute('position');

  closeTo(positions.getX(0), 5);
  closeTo(positions.getZ(0), 0);
  closeTo(positions.getX(2), 0);
  closeTo(positions.getZ(2), 5);
  assert.equal(geometry.index.count, 12);

  geometry.dispose();
});
