// PLACEHOLDER guides until they come from a CMS or the API.
// Same idea as news/newsItems.js: keep this shape and the dashboard keeps working.
//   { id, title, summary, topic, date: 'YYYY-MM-DD' (published), minutes (reading time) }
export const guideItems = [
  {
    id: 'g1',
    title: 'Water purification techniques for rural communities',
    summary: 'Placeholder guide. Boiling, solar disinfection and simple sand filters, step by step.',
    topic: 'Water',
    date: '2026-10-23',
    minutes: 6,
  },
  {
    id: 'g2',
    title: 'Harnessing renewable energy at the household level',
    summary: 'Placeholder guide. What a small solar setup costs and what it can run during load-shedding.',
    topic: 'Energy',
    date: '2026-10-21',
    minutes: 8,
  },
  {
    id: 'g3',
    title: 'Community recycling initiatives: a step-by-step guide',
    summary: 'Placeholder guide. Starting a drop-off point, finding buy-back centres and keeping it going.',
    topic: 'Community',
    date: '2026-10-18',
    minutes: 5,
  },
  {
    id: 'g4',
    title: 'Sustainable agriculture practices to boost soil health',
    summary: 'Placeholder guide. Composting, cover crops and rotating what you plant.',
    topic: 'Food',
    date: '2026-10-12',
    minutes: 7,
  },
  {
    id: 'g5',
    title: 'Reducing metal pollution in local waterways',
    summary: 'Placeholder guide. Where it comes from, how to report it and what households can change.',
    topic: 'Water',
    date: '2026-10-05',
    minutes: 6,
  },
];

// Newest first. ISO dates ('2026-10-23') sort correctly as plain strings.
export const latestGuides = (items, limit = items.length) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
