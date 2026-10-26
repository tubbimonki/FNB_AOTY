// SAMPLE map pins, updates and events until real reports come in.
// type: 'hazard' | 'facility' | 'water' | 'report'

export const SAMPLE_PINS = [
  { id: 'p1', type: 'hazard', title: 'Flooded road', detail: 'Water over the road after heavy rain. Unverified.', lat: -26.171, lon: 28.031 },
  { id: 'p2', type: 'hazard', title: 'Fallen tree', detail: 'Blocking one lane. Reported 1 hour ago.', lat: -26.214, lon: 28.061 },
  { id: 'p3', type: 'water', title: 'Water tanker', detail: 'Potable water until 16:00. Bring containers.', lat: -26.192, lon: 28.072 },
  { id: 'p4', type: 'facility', title: 'Community hall (safe shelter)', detail: 'Open 24 hours during storms.', lat: -26.204, lon: 28.042 },
  { id: 'p5', type: 'facility', title: 'Clinic', detail: 'Mon to Fri 07:00 to 16:00.', lat: -26.186, lon: 28.054 },
  { id: 'p6', type: 'report', title: 'Burst pipe', detail: 'Reported by a neighbour. Municipality notified.', lat: -26.209, lon: 28.076 },
  { id: 'p7', type: 'report', title: 'Illegal dumping', detail: 'Rubble on the pavement.', lat: -26.176, lon: 28.066 },
  { id: 'p8', type: 'hazard', title: 'Flooding in low-lying area', detail: 'Avoid the river crossing.', lat: -33.931, lon: 18.433 },
  { id: 'p9', type: 'facility', title: 'Civic centre (safe shelter)', detail: 'Open during severe weather.', lat: -33.918, lon: 18.427 },
  { id: 'p10', type: 'water', title: 'Spring water point', detail: 'Free collection point.', lat: -33.926, lon: 18.412 },
];

// minutesAgo instead of a fixed time, so sample data never looks stale.
export const SAMPLE_UPDATES = [
  { id: 'u1', kind: 'road', title: 'Road reopened on Main Rd', detail: 'Traffic flowing normally', minutesAgo: 120 },
  { id: 'u2', kind: 'water', title: 'Water tanker at Community Centre', detail: 'Dispensing potable water', minutesAgo: 180 },
  { id: 'u3', kind: 'community', title: 'Community clean-up this weekend', detail: '24 volunteers registered', minutesAgo: 300 },
];

export const SAMPLE_EVENTS = [
  { id: 'cleanup', title: 'Saturday clean-up at Zoo Lake', body: 'Bags and gloves provided. Bring a water bottle and a friend.', where: 'Zoo Lake, Johannesburg', when: 'Sat 08:00' },
  { id: 'spekboom', title: 'Spekboom planting day', body: 'Help plant 500 cuttings of the hardy succulent along the school fence.', where: 'Soweto', when: 'Sun 09:00' },
  { id: 'repair', title: 'Repair café', body: 'Volunteers fix toasters, kettles and clothes for free, so they stay out of landfill.', where: 'Maboneng', when: 'Sat 10:00' },
];
