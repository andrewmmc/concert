import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  { id: 'guide', type: 'guide', fields: ['eyebrow', 'title', 'description'] },
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

test('editorial document titles use the eyebrow rather than the headline', async () => {
  const files = [
    '../src/components/LegalDocument.astro',
    '../src/pages/guide.astro',
    '../src/pages/concerts.astro',
    '../src/pages/venues/index.astro',
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /title=\{`\$\{content\.eyebrow\}/, `${file} should use the eyebrow for the document title`);
    assert.match(source, /titleZh=\{`\$\{content\.eyebrowZh\}/, `${file} should use the Chinese eyebrow for the document title`);
    assert.doesNotMatch(source, /title=\{`\$\{content\.title\}/, `${file} should not use the headline for the document title`);
  }
});

test('page hero description styles follow the headline, not the last paragraph', async () => {
  const css = await readFile(new URL('../src/app.css', import.meta.url), 'utf8');

  assert.match(css, /\.page-hero > h1 \+ p \{/);
  assert.match(css, /\.concerts-hero > h1 \+ p \{/);
  assert.doesNotMatch(css, /\.page-hero > p:last-child \{/);
  assert.doesNotMatch(css, /\.concerts-hero > p:last-child \{/);
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

test('guide articles are stored as localized Markdown posts', async () => {
  const english = await readFile(
    new URL('../src/content/guides/en/before-buying.md', import.meta.url),
    'utf8',
  );
  const chinese = await readFile(
    new URL('../src/content/guides/zh-HK/before-buying.md', import.meta.url),
    'utf8',
  );

  for (const source of [english, chinese]) {
    assert.match(source, /^translationKey: before-buying$/m);
    assert.match(source, /^publishedAt: "\d{4}-\d{2}-\d{2}"$/m);
    assert.match(source, /^## /m, 'guide post should contain a Markdown body');
  }
});

test('guide articles link to adjacent posts', async () => {
  const source = await readFile(
    new URL('../src/pages/guide/[slug].astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /localizedPosts\[index - 1\]/);
  assert.match(source, /localizedPosts\[index \+ 1\]/);
  assert.match(source, /class="guide-post-navigation"/);
});
