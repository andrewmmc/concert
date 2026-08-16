// Transit-style "line" code and colour for each venue, used across portal cards.
const VENUE_LINES = {
  hkc: { code: 'HKC', color: '#da2c21' },
  qes: { code: 'QES', color: '#e8830c' },
  kta: { code: 'KTA', color: '#6c4ab6' },
  kts: { code: 'KTS', color: '#0e7c66' },
  awe: { code: 'AWE', color: '#1b62b7' },
  'awe-halls': { code: 'AWE·H', color: '#b83a6e' },
};

const FALLBACK_LINE = { code: 'HK', color: '#17181c' };

export function venueLine(id) {
  return VENUE_LINES[id] || { ...FALLBACK_LINE, code: id.toUpperCase() };
}
