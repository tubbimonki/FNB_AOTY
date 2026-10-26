import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { mockApi } from '../../test/mockApi';

// jsdom can't draw a real Leaflet map, so a stand-in shows the pins it gets.
vi.mock('./LeafletMap', () => ({
  default: ({ pins }) => <div role="region" aria-label="Map">{pins.length} pins</div>,
}));

const pins = [
  { id: 'a', type: 'hazard', title: 'Flooded road', detail: '', lat: -26.2, lon: 28.05 },
  { id: 'b', type: 'facility', title: 'Clinic', detail: '', lat: -26.21, lon: 28.06 },
  { id: 'c', type: 'report', title: 'Burst pipe', detail: '', lat: -26.3, lon: 28.1 },
];
const list = () => within(screen.getByRole('region', { name: /^Near / }));

describe('Community Map (/map)', () => {
  it('lists the pins nearest first, with a legend', async () => {
    mockApi({ 'GET /api/community/pins': [200, { pins, sample: true }] });
    renderWithProviders(<App />, { route: '/map' });
    expect(await screen.findByText('3 pins')).toBeInTheDocument();
    expect(list().getAllByRole('listitem').map((li) => within(li).getByText(/./, { selector: 'p.font-semibold' }).textContent)).toEqual(['Flooded road', 'Clinic', 'Burst pipe']);
    // Legend lists the kinds on the map; OpenStreetMap is "down" here, so demo facilities stay.
    expect(within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Within 1.5 km of you', 'Hazard (unverified)', 'Community report (unverified)', 'Safe facility']);
    expect(await screen.findByText(/Demo facilities: OpenStreetMap could not be reached/)).toBeInTheDocument();
  });

  it('swaps the demo facilities for real ones from OpenStreetMap', async () => {
    mockApi({
      'GET /api/community/pins': [200, { pins, sample: true }],
      'GET /api/services/facilities?lat=-26.2&lon=28.05': [200, {
        facilities: [],
        places: [
          { id: 'node/1', type: 'hospital', name: 'Charlotte Maxeke Hospital', detail: 'Hospital', lat: -26.18, lon: 28.04, url: 'https://www.openstreetmap.org/node/1' },
          { id: 'node/2', type: 'police', name: 'Hillbrow Police Station', detail: 'Police station', lat: -26.19, lon: 28.05, url: 'https://www.openstreetmap.org/node/2' },
        ],
      }],
    });
    renderWithProviders(<App />, { route: '/map' });
    expect(await screen.findByText('4 pins')).toBeInTheDocument(); // 2 real + hazard + report, the demo clinic is gone
    expect(list().getByRole('link', { name: 'Charlotte Maxeke Hospital' })).toHaveAttribute('href', 'https://www.openstreetmap.org/node/1');
    expect(list().queryByText('Clinic')).not.toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Legend' })).getByText('Police')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument();
  });

  it('marks facilities within 1.5 km as nearby, but not hazards or far ones', async () => {
    mockApi({
      'GET /api/community/pins': [200, { pins, sample: true }],
      'GET /api/services/facilities?lat=-26.2&lon=28.05': [200, {
        facilities: [],
        places: [
          { id: 'node/1', type: 'clinic', name: 'Close Clinic', detail: 'Clinic', lat: -26.205, lon: 28.05 },
          { id: 'node/2', type: 'library', name: 'Far Library', detail: 'Library', lat: -26.24, lon: 28.05 },
        ],
      }],
    });
    renderWithProviders(<App />, { route: '/map' });
    const row = async (name) => (await list().findByText(name)).closest('li');
    expect(within(await row('Close Clinic')).getByText('Nearby')).toBeInTheDocument();
    expect(within(await row('Far Library')).queryByText('Nearby')).not.toBeInTheDocument();
    expect(within(await row('Flooded road')).queryByText('Nearby')).not.toBeInTheDocument();
  });

  it('filters by type and keeps the filter in the address', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/community/pins': [200, { pins, sample: true }] });
    renderWithProviders(<App />, { route: '/map' });
    await screen.findByText('3 pins');
    await user.click(screen.getByRole('button', { name: 'Hazards' }));
    expect(screen.getByText('1 pins')).toBeInTheDocument();
    expect(list().getByText('Flooded road')).toBeInTheDocument();
    expect(list().queryByText('Clinic')).not.toBeInTheDocument();
  });

  it('opens with a filter from a link', async () => {
    mockApi({ 'GET /api/community/pins': [200, { pins, sample: true }] });
    renderWithProviders(<App />, { route: '/map?filter=facilities' });
    expect(await screen.findByText('1 pins')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Facilities' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers a retry when the API is down', async () => {
    mockApi({}); // every request fails
    renderWithProviders(<App />, { route: '/map' });
    expect(await screen.findByText(/Couldn't load map pins/)).toBeInTheDocument();
  });
});
