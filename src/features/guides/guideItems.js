// Guides, each pointing to real how-to pages from government, the UN and NGOs.
// Shape: { id, title, summary, topic, date: 'YYYY-MM-DD', minutes, links: [{ title, publisher, url }] }
// date = when we last checked the links.
export const guideItems = [
  {
    id: 'g1',
    title: 'Water purification techniques for rural communities',
    summary: 'Boil water at a rolling boil for 1 minute, or disinfect it with household bleach or tablets. With no fuel, clear water in PET bottles left in full sun for 6 hours (SODIS) is a tested backup.',
    topic: 'Water',
    date: '2026-10-26',
    minutes: 6,
    links: [
      { title: 'How to Make Water Safe in an Emergency', publisher: 'CDC', url: 'https://www.cdc.gov/water-emergency/about/' },
      { title: 'SODIS manual: solar water disinfection (PDF)', publisher: 'Eawag', url: 'https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/publikationen/SWP/SODIS_manual_2016.pdf' },
    ],
  },
  {
    id: 'g2',
    title: 'Harnessing renewable energy at the household level',
    summary: 'Cut waste first (geyser timer, LED bulbs), then size solar for what you really use. Use a registered installer and register the system with your municipality.',
    topic: 'Energy',
    date: '2026-10-26',
    minutes: 8,
    links: [
      { title: 'Going solar safely: installer checklist for customers', publisher: 'City of Cape Town', url: 'https://www.capetown.gov.za/Media-and-news/Going%20solar%20safely%20installer%20checklist%20for%20customers' },
      { title: 'Tips to save electricity', publisher: 'Vuk’uzenzele (with Eskom)', url: 'https://www.vukuzenzele.gov.za/tips-save-electricity' },
    ],
  },
  {
    id: 'g3',
    title: 'Community recycling initiatives: a step-by-step guide',
    summary: 'Separate at source, agree on one drop-off point, and link up with a buy-back centre or a PETCO collector so collectors earn from what you gather.',
    topic: 'Community',
    date: '2026-10-26',
    minutes: 5,
    links: [
      { title: 'PETCO helps turn plastic waste into profit', publisher: 'Vuk’uzenzele', url: 'https://www.vukuzenzele.gov.za/petco-helps-turn-plastic-waste-profit' },
      { title: 'SA’s circular economy is no longer optional', publisher: 'SAnews', url: 'https://www.sanews.gov.za/south-africa/sas-circular-economy-no-longer-optional-it-our-next-economic-frontier' },
    ],
  },
  {
    id: 'g4',
    title: 'Sustainable agriculture practices to boost soil health',
    summary: 'The three conservation agriculture rules: disturb the soil as little as possible, keep it covered with mulch or cover crops, and rotate or mix what you plant.',
    topic: 'Food',
    date: '2026-10-26',
    minutes: 7,
    links: [
      { title: 'Conservation Agriculture principles', publisher: 'FAO', url: 'https://www.fao.org/conservation-agriculture/overview/conservation-agriculture-principles/en' },
      { title: 'Minimum mechanical soil disturbance', publisher: 'FAO', url: 'https://www.fao.org/conservation-agriculture/in-practice/minimum-mechanical-soil-disturbance/en' },
    ],
  },
  {
    id: 'g5',
    title: 'Reducing metal pollution in local waterways',
    summary: 'Never dump batteries, paint or e-waste near drains or rivers. Join or start an Adopt-a-River group to monitor and clean your river, and know why lead is so harmful to children.',
    topic: 'Water',
    date: '2026-10-26',
    minutes: 6,
    links: [
      { title: 'Adopt-a-River Programme', publisher: 'Department of Water and Sanitation', url: 'https://www.dws.gov.za/iwqs/rhp/adoptariv.aspx' },
      { title: 'Lead poisoning fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health' },
    ],
  },
];

// Newest first. ISO dates ('2026-10-23') sort correctly as plain strings.
// Same date: list order wins (sort is stable).
export const latestGuides = (items, limit = items.length) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
