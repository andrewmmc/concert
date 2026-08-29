import assert from 'node:assert/strict';
import test from 'node:test';
import { concertExpiry, isConcertExpired } from '../src/lib/concerts.js';

test('concert expiry uses the computer local timezone and end of day', () => {
  const expiry = concertExpiry('2026-08-29');

  assert.deepEqual(
    [expiry.getFullYear(), expiry.getMonth(), expiry.getDate(), expiry.getHours()],
    [2026, 7, 30, 0],
  );
  assert.equal(isConcertExpired('2026-08-29', new Date(2026, 7, 29, 23, 59, 59)), false);
  assert.equal(isConcertExpired('2026-08-29', new Date(2026, 7, 30, 0, 0, 0)), true);
});

test('concert expiry rejects invalid or impossible dates', () => {
  assert.throws(() => concertExpiry('29 AUG 2026'), /Invalid concert end date/);
  assert.throws(() => concertExpiry('2026-02-30'), /Invalid concert end date/);
});
