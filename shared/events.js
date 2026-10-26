// Community events. The API seeds these into the events table at start, and
// the app shows them as they are when the API can't be reached.
// Real events were checked on 26 Oct 2026 (see url). sample: true marks the
// made-up ones, which the app labels "Sample event".
// reward: what you get for going. points go to Your Impact, premiumDays to Premium.
// image: a key from src/assets/images.js (temporary photos for now).

export const EVENTS = [
  {
    id: 'clean-c-muizenberg-nov',
    title: 'Clean C beach clean-up: Muizenberg',
    summary: 'A free 90-minute monthly beach clean-up at Surfer’s Corner. Gloves, bags and refreshments are provided.',
    description: [
      'Clean C runs beach clean-ups on the first Saturday of every month at ten beaches around Cape Town. Muizenberg meets at the Shark Spotters hut at Surfer’s Corner.',
      'Most of what washes up is small plastic: bottle caps, sweet wrappers and straws. Picking it up before the tide takes it back stops it breaking into microplastics that fish and birds swallow.',
    ],
    bring: ['Sunscreen and a hat', 'A water bottle', 'Closed shoes'],
    startsAt: '2026-11-07T09:00:00+02:00',
    endsAt: '2026-11-07T10:30:00+02:00',
    venue: 'Shark Spotters hut, Surfer’s Corner',
    city: 'Muizenberg, Cape Town',
    organiser: 'Clean C',
    url: 'https://cleanc.co.za/',
    image: 'field',
    category: 'Clean-up',
    reward: { label: '1200 eco-points', points: 1200, premiumDays: 0 },
    fakeAttendees: 23,
  },
  {
    id: 'trash-bash-sunset-nov',
    title: 'Two Oceans Aquarium Trash Bash: Sunset Beach',
    summary: 'The Aquarium’s last Trash Bash of 2026. Two hours of beach cleaning, then log what you found in the Marine Debris Tracker app.',
    description: [
      'Trash Bash is the Two Oceans Aquarium’s beach clean-up campaign. The November clean-up is at Sunset Beach on a Saturday morning, from 09:00 to 11:00.',
      'No sign-up is needed and walk-ins are welcome. Volunteers focus on the most common litter (plastic bags, bottles, straws, wrappers) and log it in the Marine Debris Tracker app, so scientists can see what pollutes our coast.',
    ],
    bring: ['Sunscreen and a hat', 'A reusable water bottle', 'Reusable gloves'],
    startsAt: '2026-11-14T09:00:00+02:00',
    endsAt: '2026-11-14T11:00:00+02:00',
    venue: 'Sunset Beach',
    city: 'Cape Town',
    organiser: 'Two Oceans Aquarium',
    url: 'https://www.aquarium.co.za/events/trash-bash',
    image: 'valley',
    category: 'Clean-up',
    reward: { label: 'Free Premium for a week', points: 0, premiumDays: 7 },
    fakeAttendees: 41,
  },
  {
    id: 'beachwood-mangroves-nov',
    title: 'Beachwood Mangroves clean-up and birding walk',
    summary: 'WESSA’s monthly clean-up in Durban’s mangrove reserve, with a guided birding walk an hour before.',
    description: [
      'The WESSA KZN Durban Branch clears litter from the Beachwood Mangroves Nature Reserve every month. Mangroves trap a lot of plastic from the uMngeni River, and they are nurseries for fish and crabs.',
      'A guided walk and birding session starts an hour before the clean-up. All ages are welcome, and gloves are provided.',
    ],
    note: 'WESSA holds this clean-up monthly. This date follows its usual Saturday pattern, so confirm with WESSA KZN before you go.',
    bring: ['Sunscreen and a hat', 'A reusable water bottle', 'Closed shoes'],
    startsAt: '2026-11-21T08:00:00+02:00',
    endsAt: '2026-11-21T09:00:00+02:00',
    venue: 'Beachwood Mangroves Nature Reserve parking area',
    city: 'Durban',
    organiser: 'WESSA KZN Durban Branch',
    url: 'https://www.wessa.org.za/mc-events/wessa-kzn-durban-branch-beachwood-mangroves-beach-clean-up-3/',
    image: 'woodland',
    category: 'Clean-up',
    reward: { label: '800 eco-points', points: 800, premiumDays: 0 },
    fakeAttendees: 17,
  },
  {
    id: 'jukskei-cleanup',
    title: 'Jukskei River clean-up',
    summary: 'Clear plastic and rubble from the riverbank in Alexandra before the summer storms wash it downstream.',
    description: [
      'The Jukskei starts under Johannesburg’s CBD and flows through Alexandra on its way to Hartbeespoort Dam. Litter dumped near it ends up in the water after every storm.',
      'Teams clear one stretch of bank, sort what can be recycled, and record hotspots so the municipality can be asked for skips.',
    ],
    bring: ['Closed shoes', 'Gloves if you have them', 'A water bottle'],
    startsAt: '2026-11-28T08:00:00+02:00',
    endsAt: '2026-11-28T11:00:00+02:00',
    venue: 'Riverbank next to London Road bridge',
    city: 'Alexandra, Johannesburg',
    organiser: 'Eco 5.0 community',
    image: 'forest',
    category: 'Clean-up',
    reward: { label: '1200 eco-points', points: 1200, premiumDays: 0 },
    fakeAttendees: 32,
    sample: true,
  },
  {
    id: 'spekboom-planting',
    title: 'Spekboom planting day',
    summary: 'Plant 500 spekboom cuttings along a school fence. The hardy succulent grows with very little water.',
    description: [
      'Spekboom (Portulacaria afra) is a South African succulent that grows from cuttings, survives drought and makes a dense green hedge.',
      'Volunteers dig, plant and water the cuttings, and learners at the school look after them afterwards.',
    ],
    bring: ['A hat', 'Garden gloves', 'A water bottle'],
    startsAt: '2026-11-29T09:00:00+02:00',
    endsAt: '2026-11-29T12:00:00+02:00',
    venue: 'Primary school sports field',
    city: 'Soweto, Johannesburg',
    organiser: 'Eco 5.0 community',
    image: 'mistyHills',
    category: 'Planting',
    reward: { label: '600 eco-points + a week of Premium', points: 600, premiumDays: 7 },
    fakeAttendees: 19,
    sample: true,
  },
  {
    id: 'clean-c-blouberg-dec',
    title: 'Clean C beach clean-up: Blouberg',
    summary: 'December’s first-Saturday clean-up on the Blouberg beachfront, opposite the KFC.',
    description: [
      'Clean C’s monthly clean-ups are free and last about 90 minutes. The Blouberg group meets on the beachfront opposite the KFC at 10:00.',
      'December is the busiest month on Cape Town beaches, so a clean beach before the holidays makes a big difference.',
    ],
    bring: ['Sunscreen and a hat', 'A water bottle', 'Closed shoes'],
    startsAt: '2026-12-05T10:00:00+02:00',
    endsAt: '2026-12-05T11:30:00+02:00',
    venue: 'Blouberg beachfront, opposite the KFC',
    city: 'Bloubergstrand, Cape Town',
    organiser: 'Clean C',
    url: 'https://cleanc.co.za/',
    image: 'field',
    category: 'Clean-up',
    reward: { label: '1000 eco-points', points: 1000, premiumDays: 0 },
    fakeAttendees: 28,
  },
  {
    id: 'rare-plant-festival',
    title: 'Garden Route Rare Plant Festival',
    summary: 'Two days of rare succulents, cacti and bonsai at the Garden Route Botanical Garden.',
    description: [
      'Growers bring rare and unusual plants to the Garden Route Botanical Garden in George. The plant sale is free; normal garden entry fees apply.',
      'A good place to find water-wise indigenous plants for your own garden and to ask growers how to look after them.',
    ],
    bring: ['A box or bag for plants', 'Cash or card for the garden entry fee'],
    startsAt: '2026-12-12T09:00:00+02:00',
    endsAt: '2026-12-13T16:00:00+02:00',
    venue: 'Garden Route Botanical Garden',
    city: 'George',
    organiser: 'Garden Route Botanical Garden',
    url: 'https://www.joburgetc.com/things-to-do/south-african-festivals-events-december-2026-january-2027/',
    image: 'forestLight',
    category: 'Festival',
    reward: { label: '500 eco-points', points: 500, premiumDays: 0 },
    fakeAttendees: 54,
  },
  {
    id: 'repair-cafe',
    title: 'Repair café',
    summary: 'Volunteers fix toasters, kettles and clothes for free, so they stay out of landfill.',
    description: [
      'Bring something broken and sit with a volunteer fixer while they repair it. You learn how, and the item gets a second life.',
      'Repairing a kettle saves the energy and materials needed to make a new one, and keeps e-waste out of the dump.',
    ],
    bring: ['The broken item', 'Any spare parts you have'],
    startsAt: '2026-12-12T10:00:00+02:00',
    endsAt: '2026-12-12T13:00:00+02:00',
    venue: 'Arts on Main courtyard',
    city: 'Maboneng, Johannesburg',
    organiser: 'Eco 5.0 community',
    image: 'woodland',
    category: 'Repair',
    reward: { label: 'Free Premium for a week', points: 0, premiumDays: 7 },
    fakeAttendees: 12,
    sample: true,
  },
  {
    id: 'trash-bash-sunrise-sep',
    title: 'Trash Bash: International Coastal Cleanup Day',
    summary: 'The Two Oceans Aquarium’s September clean-up at Sunrise Beach, on International Coastal Cleanup Day.',
    description: [
      'Every third Saturday of September, volunteers around the world clean beaches and record what they find. The Aquarium’s Trash Bash joined in at Sunrise Beach.',
      'The data goes to the Ocean Conservancy’s global litter report, which helps countries decide which plastics to ban.',
    ],
    bring: ['Sunscreen and a hat', 'A reusable water bottle', 'Reusable gloves'],
    startsAt: '2026-09-19T09:00:00+02:00',
    endsAt: '2026-09-19T11:00:00+02:00',
    venue: 'Sunrise Beach',
    city: 'Muizenberg, Cape Town',
    organiser: 'Two Oceans Aquarium',
    url: 'https://www.aquarium.co.za/events/trash-bash',
    image: 'valley',
    category: 'Clean-up',
    reward: { label: '1200 eco-points', points: 1200, premiumDays: 0 },
    fakeAttendees: 63,
  },
];

// Made-up names for the "who's going" list.
const NAMES = [
  'Thandeka M.', 'Sipho N.', 'Aisha P.', 'Johan v.d.M.', 'Lerato K.', 'Pieter B.', 'Nomvula D.', 'Kagiso T.',
  'Fatima A.', 'Ruan S.', 'Zanele Q.', 'Bongani L.', 'Chloé R.', 'Mpho S.', 'Anele G.', 'Ayesha I.',
  'Tumelo R.', 'Karabo M.', 'Lindiwe Z.', 'Ethan C.', 'Naledi F.', 'Yusuf H.', 'Palesa W.', 'Siyabonga J.',
];

// The same names for the same event every time (offset by the event's place in the list).
// At most one of each name; the count says how many more there are.
export const fakeAttendeeNames = (count, offset = 0) =>
  Array.from({ length: Math.min(count, NAMES.length) }, (_, i) => NAMES[(i * 5 + offset * 3) % NAMES.length]);

export const isPast = (event, now = new Date()) => new Date(event.endsAt) < now;

// What the app shows when the API is down: the same events, nobody "going".
export const offlineEvents = (now = new Date()) =>
  EVENTS.map((event, i) => ({
    ...event,
    attendeeCount: event.fakeAttendees,
    attendees: fakeAttendeeNames(event.fakeAttendees, i),
    going: false,
    past: isPast(event, now),
  })).sort((a, b) => a.past - b.past || a.startsAt.localeCompare(b.startsAt));
