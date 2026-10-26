// What goes in the recycling, by material. General South African guidance
// from the industry bodies (Petco, The Glass Recycling Company, Fibre Circle,
// MetPac-SA, eWASA; links in the write-up). Municipal rules differ, so check
// your own council's list before relying on it.
export const MATERIALS = [
  {
    id: 'plastic',
    label: 'Plastic',
    tone: 'blue',
    bin: 'Recycling bag or bin',
    yes: ['Water and cooldrink bottles (PET, 1)', 'Milk bottles (HDPE, 2)', 'Shampoo and detergent bottles', 'Yoghurt tubs', 'Takeaway containers (rinsed)'],
    no: ['Chip and sweet wrappers', 'Polystyrene trays', 'Cling film', 'Dirty food containers'],
  },
  {
    id: 'glass',
    label: 'Glass',
    tone: 'amber',
    bin: 'Glass bank or recycling bag',
    yes: ['Bottles of any colour', 'Food jars (lids off)'],
    no: ['Window glass', 'Mirrors', 'Drinking glasses and ovenware', 'Light bulbs'],
  },
  {
    id: 'paper',
    label: 'Paper',
    tone: 'green',
    bin: 'Recycling bag or bin',
    yes: ['Cardboard boxes (flattened)', 'Newspapers and magazines', 'Office paper', 'Cereal boxes', 'Milk and juice cartons'],
    no: ['Greasy pizza boxes', 'Tissues and paper towels', 'Wax or foil-lined paper'],
  },
  {
    id: 'metal',
    label: 'Metal',
    tone: 'gray',
    bin: 'Recycling bag or bin',
    yes: ['Cooldrink and beer cans', 'Food tins (rinsed)', 'Empty aerosol cans', 'Clean foil'],
    no: ['Paint tins with paint left', 'Gas bottles', 'Batteries'],
  },
  {
    id: 'ewaste',
    label: 'E-waste',
    tone: 'purple',
    bin: 'Drop-off point only, never the bin',
    yes: ['Old phones and chargers', 'Batteries', 'CFL and LED bulbs', 'Small appliances and cables'],
    no: ['Anything in the household bin'],
  },
];

// Every item with its material, for the search box.
export const ALL_ITEMS = MATERIALS.flatMap((m) => [
  ...m.yes.map((item) => ({ item, material: m.label, accepted: true })),
  ...m.no.map((item) => ({ item, material: m.label, accepted: false })),
]);

// Where to take things. SAMPLE places: replace with real ones near you.
export const DROP_OFFS = [
  { id: 'depot', title: 'Nearby Depots', detail: 'Hazardous waste & e-waste (sample: 2 within 5 km)', filter: 'facilities' },
  { id: 'donate', title: 'Donation Centres', detail: 'Clothing, furniture & more (sample: 3 within 5 km)', filter: 'facilities' },
];
