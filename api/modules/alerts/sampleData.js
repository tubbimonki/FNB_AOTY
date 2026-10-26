// SAMPLE alerts, only shown when none of the live sources can be reached
// (the page then says "Sample data"). severity: 'severe', 'warning' or 'info'.
export const SAMPLE_ALERTS = [
  {
    id: 'sample-power',
    severity: 'warning',
    icon: '⚡',
    title: 'Planned power outage tonight',
    body: 'Power may be off from 18:00 to 20:30. Charge phones now and switch the geyser off at peak time.',
    where: 'Gauteng',
    source: 'Sample data',
  },
  {
    id: 'sample-water',
    severity: 'info',
    icon: '🚰',
    title: 'Water restrictions in place',
    body: 'Water gardens only before 06:00 or after 18:00, and no hosing down paving.',
    where: 'Johannesburg',
    source: 'Sample data',
  },
  {
    id: 'sample-air',
    severity: 'info',
    icon: '🌫️',
    title: 'Air quality: moderate',
    body: 'Sensitive groups should keep outdoor exercise short today. Skip burning garden waste.',
    where: 'Pretoria',
    source: 'Sample data',
  },
].map((alert) => ({ ...alert, kind: 'alert', sample: true }));
