export function getVenueDetail(details, venueId) {
  const detail = details.find((entry) => entry.data?.venue === venueId);

  if (!detail) {
    throw new Error(`Missing Markdown details for venue "${venueId}"`);
  }

  return detail.data;
}
