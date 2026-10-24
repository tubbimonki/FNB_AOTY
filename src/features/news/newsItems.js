// PLACEHOLDER news until a real climate news API is wired in.
// Keep this shape when you swap it for API data, and NewsFeed and the
// dashboard sidebar keep working unchanged:
//   { id, title, summary, source, date: 'YYYY-MM-DD', topic, top? }
// `top: true` marks the stories the sidebar shows under "Top news".
export const newsItems = [
  {
    id: 'n1',
    title: 'Cape Town dam levels hold steady after winter rains',
    summary: 'Placeholder story. Dam levels and what they mean for water restrictions this summer.',
    source: 'Placeholder News',
    date: '2026-10-24',
    topic: 'Water',
    top: true,
  },
  {
    id: 'n2',
    title: 'Rooftop solar installs keep climbing across Gauteng',
    summary: 'Placeholder story. How households are cutting load-shedding pain and their electricity bill.',
    source: 'Placeholder News',
    date: '2026-10-23',
    topic: 'Energy',
    top: true,
  },
  {
    id: 'n3',
    title: 'What the latest IPCC update means for Southern Africa',
    summary: 'Placeholder story. Hotter, drier summers in the west and heavier storms in the east.',
    source: 'Placeholder News',
    date: '2026-10-22',
    topic: 'Science',
    top: true,
  },
  {
    id: 'n4',
    title: 'Five cheap ways to cut your geyser bill',
    summary: 'Placeholder story. Timers, blankets and lower thermostat settings, with rand figures.',
    source: 'Placeholder News',
    date: '2026-10-21',
    topic: 'Money',
  },
  {
    id: 'n5',
    title: 'Durban beach clean-up collects two tonnes of plastic',
    summary: 'Placeholder story. Volunteers, what they found, and the next clean-up date.',
    source: 'Placeholder News',
    date: '2026-10-20',
    topic: 'Community',
  },
];

export const topNews = (items, limit = 3) => items.filter((item) => item.top).slice(0, limit);
