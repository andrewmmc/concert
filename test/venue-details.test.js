import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getVenueDetail } from '../src/lib/venueDetails.js';
import { venues } from '../src/venues/index.js';

test('finds venue details by frontmatter venue ID', () => {
  const expected = { venue: 'hkc', description: 'Preview' };
  const detail = getVenueDetail([
    { id: 'qes', data: { venue: 'qes' } },
    { id: 'hkc', data: expected },
  ], 'hkc');

  assert.equal(detail, expected);
});

test('throws when a venue has no Markdown details', () => {
  assert.throws(
    () => getVenueDetail([], 'missing'),
    /Missing Markdown details for venue "missing"/,
  );
});

test('every registered venue has the required Markdown detail sections', async () => {
  const requiredFields = [
    'description',
    'cardDescription',
    'cardDescriptionZh',
    'cover',
    'openingHours',
    'transport',
    'transportMethods',
    'address',
    'mapEmbedUrl',
    'venueInformationIntro',
    'venueInformation',
    'facilities',
    'gallery',
  ];

  for (const venue of venues) {
    const source = await readFile(
      new URL(`../src/content/venues/${venue.id}.md`, import.meta.url),
      'utf8',
    );

    assert.match(source, new RegExp(`^venue: ${venue.id}$`, 'm'));
    for (const field of requiredFields) {
      assert.match(source, new RegExp(`^${field}:`, 'm'), `${venue.id} is missing ${field}`);
    }
  }
});

test('venue cards source descriptions from venue Markdown', async () => {
  const source = await readFile(
    new URL('../src/components/VenueGrid.astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /detail\.cardDescription/);
  assert.match(source, /detail\.cardDescriptionZh/);
  assert.doesNotMatch(source, /english\.subtitle|chinese\.subtitle/);
});

test('venue pages render Markdown-backed official information and website links', async () => {
  const source = await readFile(
    new URL('../src/pages/venues/[venue].astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /detail\.venueInformationIntro/);
  assert.match(source, /detail\.venueInformation\.map/);
  assert.match(source, /href=\{link\.url\}/);
});
