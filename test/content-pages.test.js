import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  { id: 'guide', type: 'guide', fields: ['eyebrow', 'title', 'description', 'sections'] },
  { id: 'concerts', type: 'concerts', fields: ['eyebrow', 'title', 'description'] },
  { id: 'home', type: 'home', fields: ['hero', 'board', 'paths', 'venueDirectory'] },
  { id: 'venue-directory', type: 'venue-directory', fields: ['eyebrow', 'title', 'description'] },
  { id: 'terms', type: 'legal', fields: ['eyebrow', 'title', 'description', 'updated', 'updatedZh', 'sections'] },
  { id: 'privacy', type: 'legal', fields: ['eyebrow', 'title', 'description', 'updated', 'updatedZh', 'sections'] },
];

test('editorial pages have structured Markdown content', async () => {
  for (const page of pages) {
    const source = await readFile(
      new URL(`../src/content/pages/${page.id}.md`, import.meta.url),
      'utf8',
    );

    assert.match(source, new RegExp(`^type: ${page.type}$`, 'm'));
    for (const field of page.fields) {
      assert.match(source, new RegExp(`^${field}:`, 'm'), `${page.id} is missing ${field}`);
    }
  }
});

test('legal document titles use the eyebrow rather than the headline', async () => {
  const source = await readFile(
    new URL('../src/components/LegalDocument.astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /title=\{`\$\{content\.eyebrow\}/);
  assert.match(source, /titleZh=\{`\$\{content\.eyebrowZh\}/);
  assert.doesNotMatch(source, /title=\{`\$\{content\.title\}/);
});

test('legal pages describe unofficial use and current data practices', async () => {
  const terms = await readFile(new URL('../src/content/pages/terms.md', import.meta.url), 'utf8');
  const privacy = await readFile(new URL('../src/content/pages/privacy.md', import.meta.url), 'utf8');

  assert.match(terms, /do not sell tickets/i);
  assert.match(terms, /Hong Kong Special Administrative Region/);
  assert.match(privacy, /concert-locale/);
  assert.match(privacy, /Personal Data \(Privacy\) Ordinance/);
});

test('concert listings are stored in year-specific Markdown files', async () => {
  const source = await readFile(
    new URL('../src/content/concerts/2026.md', import.meta.url),
    'utf8',
  );

  assert.match(source, /^year: 2026$/m);
  assert.match(source, /^events:$/m);
});
