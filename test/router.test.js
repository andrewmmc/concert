import assert from 'node:assert/strict';
import test from 'node:test';

import { goTo, onRoute, parseHash } from '../src/lib/router.js';

function installBrowserGlobals(hash = '') {
  const previous = new Map();
  const events = new EventTarget();
  const globals = {
    location: { hash },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };

  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  return {
    dispatchHashChange: () => events.dispatchEvent(new Event('hashchange')),
    restore() {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

test('parses canonical and slashless hash routes', () => {
  const browser = installBrowserGlobals('#/hkc/end-stage');
  try {
    assert.equal(parseHash().venue.id, 'hkc');
    assert.equal(parseHash().layout.id, 'end-stage');

    location.hash = '#hkc/center-stage';
    assert.equal(parseHash().layout.id, 'center-stage');
  } finally {
    browser.restore();
  }
});

test('falls back to venue and layout defaults for empty or unknown routes', () => {
  const browser = installBrowserGlobals('');
  try {
    assert.equal(parseHash().venue.id, 'hkc');
    assert.equal(parseHash().layout.id, 'center-stage');

    location.hash = '#/unknown/unknown';
    assert.equal(parseHash().venue.id, 'hkc');
    assert.equal(parseHash().layout.id, 'center-stage');
  } finally {
    browser.restore();
  }
});

test('writes canonical hashes when navigating', () => {
  const browser = installBrowserGlobals();
  try {
    goTo('hkc', 'center-stage');
    assert.equal(location.hash, '#/hkc/center-stage');
  } finally {
    browser.restore();
  }
});

test('notifies subscribers on hash changes and supports unsubscribe', () => {
  const browser = installBrowserGlobals('#/hkc/center-stage');
  try {
    const routes = [];
    const off = onRoute((route) => routes.push([route.venue.id, route.layout.id]));

    location.hash = '#/hkc/end-stage';
    browser.dispatchHashChange();
    assert.deepEqual(routes, [['hkc', 'end-stage']]);

    off();
    location.hash = '#/hkc/center-stage';
    browser.dispatchHashChange();
    assert.equal(routes.length, 1);
  } finally {
    browser.restore();
  }
});
