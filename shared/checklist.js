// The emergency checklist on the alerts page (and PUT /api/alerts/checklist). Based on the preparedness
// advice from the National Disaster Management Centre and SA Weather Service
// (links in the write-up). `id` never changes, so ticks survive a reword.
export const CHECKLIST = [
  { id: 'charge', label: 'Keep your phone and a power bank charged' },
  { id: 'gutters', label: 'Clear gutters and drains' },
  { id: 'roads', label: 'Avoid flooded roads and low bridges' },
  { id: 'kit', label: 'Keep an emergency kit ready (torch, radio, first aid, meds)' },
  { id: 'water', label: 'Store 5 L of drinking water per person' },
  { id: 'contacts', label: 'Save emergency numbers (112, 10177, 10111) in your phone' },
  { id: 'docs', label: 'Put ID, documents and cash in a waterproof bag' },
];
