// Hash routes for portal pages and the legacy-compatible 3D viewer route:
// #/guide, #/concerts, #/venues, #/terms, #/privacy, #/venue/<venue>, #/<venue>/<layout>
import { getVenue, resolveLayout } from '../venues/index.js';

export function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [first, second] = h.split('/').filter(Boolean);
  const portalPages = new Set(['guide', 'concerts', 'venues', 'terms', 'privacy']);

  if (!first) {
    const venue = getVenue();
    return { venue, layout: resolveLayout(venue), page: 'home' };
  }

  if (portalPages.has(first)) {
    const venue = getVenue();
    return { venue, layout: resolveLayout(venue), page: first };
  }

  if (first === 'venue') {
    const venue = getVenue(second);
    const page = second && venue.id === second ? 'venue' : 'venues';
    return { venue, layout: resolveLayout(venue), page };
  }

  const venueId = first;
  const layoutId = second;
  const venue = getVenue(venueId);
  const layout = resolveLayout(venue, layoutId);
  const page = venue.id === venueId ? 'viewer' : 'home';
  return { venue, layout, page };
}

export function goTo(venueId, layoutId) {
  location.hash = `#/${venueId}/${layoutId}`;
}

export function goToPage(page) {
  location.hash = page === 'home' ? '' : `#/${page}`;
}

export function goToVenue(venueId) {
  location.hash = `#/venue/${venueId}`;
}

export function goHome() {
  goToPage('home');
}

export function onRoute(cb) {
  const h = () => cb(parseHash());
  addEventListener('hashchange', h);
  return () => removeEventListener('hashchange', h);
}
