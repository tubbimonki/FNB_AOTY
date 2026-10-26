// SAMPLE DATA for the dashboard carousel until a real feed exists.
// kind 'alert' = something to act on now; kind 'community' = something to join.

export const alertItems = [
  {
    id: 'loadshedding',
    kind: 'alert',
    icon: '⚡',
    title: 'Load shedding possible tonight',
    body: 'Eskom may move to stage 2 from 18:00. Charge phones now and switch geysers off at peak time.',
    where: 'Gauteng',
  },
  {
    id: 'water',
    kind: 'alert',
    icon: '🚰',
    title: 'Water restrictions in place',
    body: 'Water gardens only before 06:00 or after 18:00, and no hosing down paving.',
    where: 'Johannesburg',
  },
  {
    id: 'air',
    kind: 'alert',
    icon: '🌫️',
    title: 'Air quality: moderate',
    body: 'Sensitive groups should keep outdoor exercise short today. Skip burning garden waste.',
    where: 'Pretoria',
  },
];

export const communityItems = [
  {
    id: 'cleanup',
    kind: 'community',
    icon: '🧤',
    title: 'Saturday clean-up at Zoo Lake',
    body: 'Bags and gloves provided. Bring a water bottle and a friend.',
    where: 'Zoo Lake, Johannesburg',
    when: 'Sat 08:00',
  },
  {
    id: 'spekboom',
    kind: 'community',
    icon: '🌱',
    title: 'Spekboom planting day',
    body: 'Help plant 500 cuttings of the hardy succulent along the school fence.',
    where: 'Soweto',
    when: 'Sun 09:00',
  },
  {
    id: 'repair',
    kind: 'community',
    icon: '🔧',
    title: 'Repair café',
    body: 'Volunteers fix toasters, kettles and clothes for free, so they stay out of landfill.',
    where: 'Maboneng',
    when: 'Sat 10:00',
  },
  {
    id: 'swap',
    kind: 'community',
    icon: '🥕',
    title: 'Garden produce swap',
    body: 'Swap extra veg, seeds and seedlings with neighbours. Nothing to swap? Come anyway.',
    where: 'Melville',
    when: 'Wed 17:30',
  },
];

// Alternates alert, community, alert, community..., then whatever is left,
// so the carousel never shows a long run of one kind.
export function mixHighlights(alerts, community) {
  const mixed = [];
  for (let i = 0; i < Math.max(alerts.length, community.length); i++) {
    if (alerts[i]) mixed.push(alerts[i]);
    if (community[i]) mixed.push(community[i]);
  }
  return mixed;
}
