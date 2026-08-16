import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const bootstrapScript = readFileSync(
  new URL('../src/scripts/locale-bootstrap.js', import.meta.url),
  'utf8',
);

function runBootstrap({ languages, savedLocale, storageError = false }) {
  const classes = new Set();
  const scheduled = [];
  const root = {
    lang: 'en',
    dataset: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };
  const context = {
    document: { documentElement: root },
    navigator: { language: languages[0], languages },
    setTimeout: (callback) => scheduled.push(callback),
  };

  Object.defineProperty(context, 'localStorage', {
    get() {
      if (storageError) throw new Error('Storage unavailable');
      return { getItem: () => savedLocale };
    },
  });
  vm.runInNewContext(bootstrapScript, context);

  return { root, scheduled };
}

test('hides English markup before first paint for a Chinese locale', () => {
  const { root, scheduled } = runBootstrap({ languages: ['zh-HK'] });

  assert.equal(root.lang, 'zh-HK');
  assert.equal(root.dataset.initialLocale, 'zh-HK');
  assert.equal(root.classList.contains('locale-pending'), true);

  scheduled[0]();
  assert.equal(root.classList.contains('locale-pending'), false);
});

test('keeps English visible when a saved preference overrides browser language', () => {
  const { root, scheduled } = runBootstrap({
    languages: ['zh-Hant'],
    savedLocale: 'en',
  });

  assert.equal(root.lang, 'en');
  assert.equal(root.dataset.initialLocale, 'en');
  assert.equal(root.classList.contains('locale-pending'), false);
  assert.equal(scheduled.length, 0);
});

test('falls back to browser language when storage is unavailable', () => {
  const { root } = runBootstrap({
    languages: ['zh-TW'],
    storageError: true,
  });

  assert.equal(root.dataset.initialLocale, 'zh-HK');
  assert.equal(root.classList.contains('locale-pending'), true);
});
