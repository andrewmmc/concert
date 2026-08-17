import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldDestroyViewer } from '../src/scripts/viewer.js';

test('keeps the WebGL viewer alive while stored in the back-forward cache', () => {
  assert.equal(shouldDestroyViewer({ persisted: true }), false);
});

test('destroys the WebGL viewer when the page is actually unloaded', () => {
  assert.equal(shouldDestroyViewer({ persisted: false }), true);
  assert.equal(shouldDestroyViewer(), true);
});
