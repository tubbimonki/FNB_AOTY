// Real climate stories bundled with the app (see shared/newsSnapshot.js). The
// live list comes from GET /api/news; this is what shows when the API is down.
// Shape: { id, title, summary, source, date: 'YYYY-MM-DD', topic, url, region, top? }
export { newsSnapshot as newsItems } from '../../../shared/newsSnapshot.js';

// Stories flagged top, else the first few (live lists flag their own).
export const topNews = (items, limit = 3) => {
  const flagged = items.filter((item) => item.top);
  return (flagged.length ? flagged : items).slice(0, limit);
};
