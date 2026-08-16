import assert from 'node:assert/strict';
import test from 'node:test';

import * as THREE from 'three';

import {
  createSeatInstances,
  getSeatSurroundingsView,
  getSeatView,
  makeRingR,
  ringStripGeo,
} from '../src/scene.js';

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

test('createSeatInstances builds the seat index and shaded base colours', () => {
  const placements = [
    { x: 0, y: 1, z: 0, yaw: 0, sec: 1, row: 'A', seat: 1, color: '#ff0000', widthScale: 1, alt: 0 },
    { x: 1, y: 1, z: 0, yaw: 0, sec: 1, row: 'A', seat: 2, color: '#00ff00', widthScale: 1, alt: 1 },
  ];
  const { seats, baseColors, seatIndex } = createSeatInstances(placements, {
    boxes: [{ size: [0.5, 0.1, 0.3], pos: [0, 0.2, 0.03] }],
    shade: (p) => (p.seat === 1 ? 0.8 : 0.5),
    altShade: 0.05,
  });

  assert.equal(seats.count, 2);
  assert.equal(seatIndex.get('1-A-1'), 0);
  assert.equal(seatIndex.get('1-A-2'), 1);
  assert.equal(seatIndex.get('1-A-3'), undefined);
  // base color = placement color × (shade + alt × altShade)
  const [r1, g1, b1] = baseColors.slice(0, 3);
  closeTo(r1, 0.8); closeTo(g1, 0); closeTo(b1, 0);
  const [, g2] = baseColors.slice(3, 6);
  closeTo(g2, 0.55);

  seats.geometry.dispose();
});

test('createSeatInstances falls back to numeric-row alternation', () => {
  const { baseColors } = createSeatInstances(
    [{ x: 0, y: 0, z: 0, yaw: 0, sec: 2, row: 5, seat: 3, color: '#ffffff' }],
    { boxes: [{ size: [0.5, 0.1, 0.3] }], shade: () => 1, altShade: 0.1 },
  );
  // row 5 is odd → alt 1 → white × (1 + 0.1)
  const [r, g, b] = baseColors.slice(0, 3);
  closeTo(r, 1.1); closeTo(g, 1.1); closeTo(b, 1.1);
});

test('getSeatView places the camera at seated eye height facing the stage', () => {
  const stage = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 6));
  stage.position.set(0, 0.6, 0);
  const placement = { x: 10, y: 2, z: 20 };

  const { target, cameraPosition } = getSeatView(placement, stage);

  closeTo(target.x, 0);
  closeTo(target.y, 1.2);
  closeTo(target.z, 0);
  closeTo(cameraPosition.y, 3.28);
  closeTo(Math.hypot(cameraPosition.x - placement.x, cameraPosition.z - placement.z), 0.14);

  const stageDirection = new THREE.Vector2(target.x - placement.x, target.z - placement.z).normalize();
  const cameraOffset = new THREE.Vector2(
    cameraPosition.x - placement.x,
    cameraPosition.z - placement.z,
  ).normalize();
  closeTo(cameraOffset.dot(stageDirection), 1);

  stage.geometry.dispose();
});

test('getSeatSurroundingsView restores the elevated seat-area overview', () => {
  const placement = { x: 10, y: 2, z: 20, yaw: 0 };

  const { target, cameraPosition } = getSeatSurroundingsView(placement);

  closeTo(target.x, placement.x);
  closeTo(target.y, 2.5);
  closeTo(target.z, placement.z);
  closeTo(cameraPosition.x, 4.5);
  closeTo(cameraPosition.y, 17);
  closeTo(cameraPosition.z, 9);
});

test('getSeatView rejects incomplete inputs', () => {
  assert.throws(() => getSeatView(null, new THREE.Group()), TypeError);
  assert.throws(() => getSeatView({ x: 0, y: 0, z: 0 }, null), TypeError);
  assert.throws(() => getSeatView({ x: 0, y: 0, z: 0 }, new THREE.Group()), TypeError);
  assert.throws(() => getSeatView({ x: 0, y: NaN, z: 0 }, new THREE.Mesh()), TypeError);
  assert.throws(() => getSeatSurroundingsView({ x: 0, y: NaN, z: 0 }), TypeError);
});
