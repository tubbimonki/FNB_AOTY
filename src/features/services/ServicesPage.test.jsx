import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { mockApi } from '../../test/mockApi';
import { SAMPLE_STATUS } from '../../../api/modules/services/sampleData.js';

const FACILITIES = 'GET /api/services/facilities?lat=-26.2&lon=28.05'; // Johannesburg, the default place

describe('Essential Services (/services)', () => {
  it('shows each service with its status, and links the report form to it', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/services/status': [200, { ...SAMPLE_STATUS, sample: true, live: [] }] });
    renderWithProviders(<App />, { route: '/services' });

    const water = within(await screen.findByRole('region', { name: 'Water supply status' }));
    expect(water.getByText('Intermittent')).toBeInTheDocument();
    expect(water.getByText('Demo data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report Now' })).toHaveAttribute('href', '/community/report?category=water');

    await user.click(screen.getByRole('button', { name: 'Electricity' }));
    expect(screen.getByRole('region', { name: 'Electricity status' })).toBeInTheDocument();
    expect(screen.getByText('Today 18:00 to 20:30')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report Now' })).toHaveAttribute('href', '/community/report?category=electricity');
    // OpenStreetMap is "down" in this test, so the demo facilities show, labelled.
    expect(screen.getByText('Public library')).toBeInTheDocument();
    expect(await screen.findByText(/Demo data: OpenStreetMap could not be reached/)).toBeInTheDocument();
  });

  it('shows the live area status with its source, and no stage', async () => {
    const user = userEvent.setup();
    const electricity = {
      status: 'outage', title: 'Electricity', message: 'Power is off in your area until 20:30.',
      area: 'City of Ekurhuleni Block 14', source: 'EskomSePush', stale: false,
      updates: [{ id: 'c0', title: 'Whole street is dark', detail: 'Neighbour report, Sun 10:15' }],
      schedule: [{ id: 's0', when: 'Sun 18:00 to 20:30', what: 'Planned outage' }],
    };
    mockApi({ 'GET /api/services/status': [200, { ...SAMPLE_STATUS, sample: true, live: ['electricity'], services: { ...SAMPLE_STATUS.services, electricity } }] });
    renderWithProviders(<App />, { route: '/services' });

    await user.click(await screen.findByRole('button', { name: 'Electricity' }));
    const card = within(screen.getByRole('region', { name: 'Electricity status' }));
    expect(card.getByText('Power is off in your area until 20:30.')).toBeInTheDocument();
    expect(card.queryByText('Demo data')).not.toBeInTheDocument();
    expect(screen.getByText(/City of Ekurhuleni Block 14 · Source: EskomSePush/)).toBeInTheDocument();
    expect(screen.getByText('Whole street is dark')).toBeInTheDocument();
    expect(screen.queryByText(/stage/i)).not.toBeInTheDocument();
  });

  it('lists live facilities from OpenStreetMap with credit', async () => {
    mockApi({
      'GET /api/services/status': [200, { ...SAMPLE_STATUS, sample: true, live: [] }],
      [FACILITIES]: [200, {
        source: 'OpenStreetMap', stale: false,
        facilities: [{ id: 'node/1', type: 'clinic', name: 'Hillbrow Clinic', detail: 'Clinic', distanceKm: 0.8, url: 'https://www.openstreetmap.org/node/1' }],
      }],
    });
    renderWithProviders(<App />, { route: '/services' });

    expect(await screen.findByRole('link', { name: 'Hillbrow Clinic' })).toHaveAttribute('href', 'https://www.openstreetmap.org/node/1');
    expect(screen.queryByText('Public library')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument();
  });

  it('sorts facilities nearest first and badges the ones within 1.5 km', async () => {
    mockApi({
      'GET /api/services/status': [200, { ...SAMPLE_STATUS, sample: true, live: [] }],
      [FACILITIES]: [200, {
        source: 'OpenStreetMap', stale: false,
        facilities: [
          { id: 'node/2', type: 'library', name: 'Far Library', detail: 'Library', distanceKm: 2.4 },
          { id: 'node/1', type: 'clinic', name: 'Near Clinic', detail: 'Clinic', distanceKm: 0.6 },
        ],
      }],
    });
    renderWithProviders(<App />, { route: '/services' });
    const list = within((await screen.findByText('Near Clinic')).closest('ul'));
    const rows = list.getAllByRole('listitem');
    expect(rows.map((li) => li.textContent)).toEqual([expect.stringContaining('Near Clinic'), expect.stringContaining('Far Library')]);
    expect(within(rows[0]).getByText('Nearby')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('Nearby')).not.toBeInTheDocument();
  });

  it('shows the saved copy, labelled, when OpenStreetMap is down later', async () => {
    const clinic = { id: 'node/1', type: 'clinic', name: 'Hillbrow Clinic', detail: 'Clinic', distanceKm: 0.8 };
    const status = [200, { ...SAMPLE_STATUS, sample: true, live: [] }];
    mockApi({ 'GET /api/services/status': status, [FACILITIES]: [200, { facilities: [clinic], places: [] }] });
    const first = renderWithProviders(<App />, { route: '/services' });
    await screen.findByText('Hillbrow Clinic');
    await waitFor(() => expect(localStorage.getItem('facilities:cache')).toContain('-26.20,28.05'));
    first.unmount();

    mockApi({ 'GET /api/services/status': status }); // facilities now fail
    renderWithProviders(<App />, { route: '/services' });
    expect(await screen.findByText('Hillbrow Clinic')).toBeInTheDocument();
    expect(screen.queryByText('Public library')).not.toBeInTheDocument();
    expect(await screen.findByText(/Saved copy from .*could not be reached/)).toBeInTheDocument();
  });

  it('offers a retry when the API is down', async () => {
    mockApi({}); // every request fails
    renderWithProviders(<App />, { route: '/services' });
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
