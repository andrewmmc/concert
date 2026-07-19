// Registry of available venues. Add new venue modules here.
import { hkc } from './hkc.js';

export const venues = [hkc];
export const defaultVenue = hkc;

export function getVenue(id) {
  return venues.find((v) => v.id === id) || defaultVenue;
}

/* Resolve a layout id for a venue: exact match, else the venue default. */
export function resolveLayout(venue, layoutId) {
  if (!venue.layouts || !venue.layouts.length) return null;
  return venue.layouts.find((l) => l.id === layoutId) ||
         venue.layouts.find((l) => l.id === venue.defaultLayout) ||
         venue.layouts[0];
}
