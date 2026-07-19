// Tiny hash router: #/<venue>/<layout>  e.g. #/hkc/center-stage
import { getVenue, resolveLayout } from '../venues/index.js';

export function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [venueId, layoutId] = h.split('/').filter(Boolean);
  const venue = getVenue(venueId);
  const layout = resolveLayout(venue, layoutId);
  return { venue, layout };
}

export function goTo(venueId, layoutId) {
  location.hash = `#/${venueId}/${layoutId}`;
}

export function onRoute(cb) {
  const h = () => cb(parseHash());
  addEventListener('hashchange', h);
  return () => removeEventListener('hashchange', h);
}
