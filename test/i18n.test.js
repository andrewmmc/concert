import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ENGLISH,
  TRADITIONAL_CHINESE,
  describeSeat,
  detectLocale,
  getVenueText,
  initialLocale,
  translate,
} from '../src/lib/i18n.js';
import { getVenue, resolveLayout } from '../src/venues/index.js';

test('defaults Hong Kong and Traditional Chinese browser locales to Traditional Chinese', () => {
  assert.equal(detectLocale(['en-HK']), TRADITIONAL_CHINESE);
  assert.equal(detectLocale(['zh-Hant']), TRADITIONAL_CHINESE);
  assert.equal(detectLocale(['zh-TW']), TRADITIONAL_CHINESE);
  assert.equal(detectLocale(['en-GB']), ENGLISH);
  assert.equal(detectLocale(['zh-CN']), ENGLISH);
});

test('uses a saved locale before browser detection', () => {
  const storage = { getItem: () => ENGLISH };
  assert.equal(initialLocale({ storage, languages: ['zh-HK'] }), ENGLISH);
});

test('returns localized interface and venue copy', () => {
  const venue = getVenue('hkc');
  const layout = resolveLayout(venue, 'end-stage');
  const copy = getVenueText(TRADITIONAL_CHINESE, venue, layout);

  assert.equal(translate(TRADITIONAL_CHINESE, 'findSeat'), '尋找座位');
  assert.equal(translate(ENGLISH, 'viewFromSeat'), 'Stage view');
  assert.equal(translate(TRADITIONAL_CHINESE, 'seatSurroundings'), '座位周邊');
  assert.equal(translate(ENGLISH, 'noSeatSelected'), 'No seat selected');
  assert.equal(translate(TRADITIONAL_CHINESE, 'noSeatSelected'), '尚未選擇座位');
  assert.equal(translate(ENGLISH, 'siteName'), 'Hong Kong Concert Guide');
  assert.equal(translate(TRADITIONAL_CHINESE, 'siteName'), '香港演唱會指南');
  assert.equal(translate(TRADITIONAL_CHINESE, 'navConcerts'), '演出日程');
  assert.equal(translate(ENGLISH, 'arenaTransportTitle'), 'Transport');
  assert.equal(translate(TRADITIONAL_CHINESE, 'exploreOtherArenas'), '探索其他場館');
  assert.equal(translate(ENGLISH, 'navGuide'), 'Before You Go');
  assert.equal(translate(ENGLISH, 'navTerms'), 'Terms');
  assert.equal(translate(TRADITIONAL_CHINESE, 'navPrivacy'), '私隱');
  assert.equal(translate(ENGLISH, 'lastUpdated'), 'Last updated');
  assert.equal(translate(TRADITIONAL_CHINESE, 'openDedicatedViewer'), '開啟獨立 3D 座位視圖');
  assert.equal(translate(ENGLISH, 'venueDetails'), 'Venue details');
  assert.equal(translate(TRADITIONAL_CHINESE, 'venueDetails'), '場館詳情');
  assert.equal(translate(TRADITIONAL_CHINESE, 'venueInformation'), '聯絡及官方資料');
  assert.equal(copy.name, '香港體育館');
  assert.equal(copy.layoutName, '三面台');
  assert.equal(copy.sides[0], '紅閘 40 段');
});

test('localizes seat references while preserving their identifiers', () => {
  const venue = getVenue('kta');
  const placement = { sec: 'A', row: 'C', seat: 12, tier: 'Arena Floor' };
  const localized = describeSeat(TRADITIONAL_CHINESE, venue, placement, {
    main: 'Block A · Row C · Seat 12',
    sub: 'Arena Floor — Kai Tak Arena',
  });

  assert.equal(localized.main, 'A 區 · C 行 · 12 號座位');
  assert.equal(localized.sub, '場地座位');
});

test('uses the printed block rather than the internal section ID for multi-hall seats', () => {
  const venue = getVenue('awe-halls');
  const placement = { sec: '8A', hall: 8, block: 'A', row: 1, seat: 20, tier: 'Hall 8 floor' };
  const localized = describeSeat(TRADITIONAL_CHINESE, venue, placement, {
    main: 'Hall 8 · Block A · Row 1 · Seat 20',
    sub: 'Hall 8 floor — AsiaWorld Expo',
  });

  assert.equal(localized.main, '8 號館 · A 區 · 1 行 · 20 號座位');
  assert.equal(localized.sub, '8 號展館地面座位');
});
