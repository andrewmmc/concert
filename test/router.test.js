import assert from 'node:assert/strict';
import test from 'node:test';

import { goHome, goTo, goToPage, goToVenue, onRoute, parseHash } from '../src/lib/router.js';

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
    assert.equal(parseHash().page, 'viewer');

    location.hash = '#hkc/center-stage';
    assert.equal(parseHash().layout.id, 'center-stage');
  } finally {
    browser.restore();
  }
});

test('parses portal and venue detail pages', () => {
  const browser = installBrowserGlobals('#/guide');
  try {
    assert.equal(parseHash().page, 'guide');

    location.hash = '#/concerts';
    assert.equal(parseHash().page, 'concerts');

    location.hash = '#/venues';
    assert.equal(parseHash().page, 'venues');

    location.hash = '#/terms';
    assert.equal(parseHash().page, 'terms');

    location.hash = '#/privacy';
    assert.equal(parseHash().page, 'privacy');

    location.hash = '#/venue/kta';
    assert.equal(parseHash().page, 'venue');
    assert.equal(parseHash().venue.id, 'kta');
  } finally {
    browser.restore();
  }
});

test('falls back to venue and layout defaults for empty or unknown routes', () => {
  const browser = installBrowserGlobals('');
  try {
    assert.equal(parseHash().venue.id, 'hkc');
    assert.equal(parseHash().layout.id, 'center-stage');
    assert.equal(parseHash().page, 'home');

    location.hash = '#/unknown/unknown';
    assert.equal(parseHash().venue.id, 'hkc');
    assert.equal(parseHash().layout.id, 'center-stage');
    assert.equal(parseHash().page, 'home');
  } finally {
    browser.restore();
  }
});

test('returns to the portal home page', () => {
  const browser = installBrowserGlobals('#/hkc/center-stage');
  try {
    goHome();
    assert.equal(location.hash, '');
  } finally {
    browser.restore();
  }
});

test('writes canonical hashes when navigating', () => {
  const browser = installBrowserGlobals();
  try {
    goTo('hkc', 'center-stage');
    assert.equal(location.hash, '#/hkc/center-stage');

    goToPage('concerts');
    assert.equal(location.hash, '#/concerts');

    goToVenue('qes');
    assert.equal(location.hash, '#/venue/qes');
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
