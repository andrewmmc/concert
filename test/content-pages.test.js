import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  { id: 'guide', type: 'guide', fields: ['eyebrow', 'title', 'description', 'sections'] },
  { id: 'concerts', type: 'concerts', fields: ['eyebrow', 'title', 'description', 'calendar', 'events'] },
  { id: 'home', type: 'home', fields: ['hero', 'stats', 'board', 'paths', 'venueDirectory'] },
  { id: 'venue-directory', type: 'venue-directory', fields: ['eyebrow', 'title', 'description'] },
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
