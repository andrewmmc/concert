const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function concertExpiry(endsOn) {
  const match = LOCAL_DATE_PATTERN.exec(endsOn);
  if (!match) throw new TypeError(`Invalid concert end date: ${endsOn}`);

  const [, year, month, day] = match.map(Number);
  const endDate = new Date(year, month - 1, day);

  if (
    endDate.getFullYear() !== year
    || endDate.getMonth() !== month - 1
    || endDate.getDate() !== day
  ) {
    throw new TypeError(`Invalid concert end date: ${endsOn}`);
  }

  return new Date(year, month - 1, day + 1);
}

export function isConcertExpired(endsOn, now = new Date()) {
  return now >= concertExpiry(endsOn);
}

export function filterExpiredConcerts(root = document, now = new Date()) {
  for (const board of root.querySelectorAll('[data-concert-board]')) {
    for (const event of board.querySelectorAll('[data-concert-ends-on]')) {
      if (isConcertExpired(event.dataset.concertEndsOn, now)) event.remove();
    }

    const remainingEvents = board.querySelectorAll('[data-concert-ends-on]');
    remainingEvents.forEach((event, index) => {
      const number = event.querySelector('[data-concert-number]');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
    });

    if (remainingEvents.length === 0) board.remove();
  }

  const hasUpcomingEvents = root.querySelector('[data-concert-ends-on]') !== null;
  const emptyState = root.querySelector('[data-concert-empty]');
  if (emptyState) emptyState.hidden = hasUpcomingEvents;

  return hasUpcomingEvents;
}
