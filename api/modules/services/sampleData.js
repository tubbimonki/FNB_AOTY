// DEMO service status, shown for any service that has no live feed (see index.js).
// status: 'ok' | 'intermittent' | 'delayed' | 'outage' | 'scheduled'
export const SAMPLE_STATUS = {
  area: 'Johannesburg (sample)',
  services: {
    water: {
      status: 'intermittent',
      title: 'Water supply',
      message: 'Low pressure after a pipe repair. Tanker deliveries scheduled for your area this afternoon.',
      updates: [
        { id: 'w1', title: 'Tanker at Community Centre', detail: 'Until 16:00. Bring containers.' },
        { id: 'w2', title: 'Pipe repair on 4th Ave', detail: 'Expected back to normal by 20:00.' },
      ],
      schedule: [{ id: 'ws1', when: 'Today 13:00 to 16:00', what: 'Tanker, Community Centre' }],
    },
    electricity: {
      status: 'scheduled',
      title: 'Electricity',
      message: 'Power is on. Next planned outage Today 18:00 to 20:30.',
      updates: [{ id: 'e1', title: 'Substation maintenance', detail: 'Ward 58, Saturday 08:00 to 12:00.' }],
      schedule: [
        { id: 'es1', when: 'Today 18:00 to 20:30', what: 'Planned outage' },
        { id: 'es2', when: 'Tomorrow 02:00 to 04:30', what: 'Planned outage' },
      ],
    },
    transport: {
      status: 'ok',
      title: 'Transport',
      message: 'Buses and the Gautrain are running on time.',
      updates: [{ id: 't1', title: 'Main Rd reopened', detail: 'Traffic flowing normally.' }],
      schedule: [],
    },
    waste: {
      status: 'delayed',
      title: 'Waste collection',
      message: 'Collection is running a day late after the public holiday.',
      updates: [{ id: 'g1', title: 'Garden refuse site open', detail: 'Sat 08:00 to 16:00.' }],
      schedule: [{ id: 'gs1', when: 'Wednesday', what: 'Household bins' }],
    },
  },
  facilities: [
    { id: 'f1', type: 'library', name: 'Public library', detail: 'Free Wi-Fi and phone charging', distanceKm: 2.0 },
    { id: 'f2', type: 'water', name: 'Water point', detail: 'Borehole, open 06:00 to 18:00', distanceKm: 1.2 },
    { id: 'f3', type: 'clinic', name: 'Community clinic', detail: 'Mon to Fri 07:00 to 16:00', distanceKm: 3.4 },
    { id: 'f4', type: 'shelter', name: 'Community hall', detail: 'Safe shelter during storms', distanceKm: 2.6 },
  ],
};
