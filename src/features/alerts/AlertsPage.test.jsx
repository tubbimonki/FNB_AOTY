import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { mockApi } from '../../test/mockApi';
import { CHECKLIST } from './checklist';

const stormy = {
  current: { tempC: 18, feelsLikeC: 17, humidity: 80, windKph: 24, code: 95, isDay: true },
  days: [
    { date: '2026-10-25', code: 95, maxC: 22, minC: 14, rainChance: 90, uvMax: 3 },
    { date: '2026-10-26', code: 61, maxC: 20, minC: 13, rainChance: 70, uvMax: 4 },
    { date: '2026-10-27', code: 2, maxC: 24, minC: 12, rainChance: 10, uvMax: 8 },
    { date: '2026-10-28', code: 0, maxC: 26, minC: 13, rainChance: 0, uvMax: 9 },
  ],
  fetchedAt: Date.parse('2026-10-25T08:00:00Z'),
  stale: false,
};

const renderAlerts = () => renderWithProviders(<App />, { route: '/alerts' });
const views = () => within(screen.getByRole('group', { name: 'Show' }));

describe('Weather & Climate Alerts (/alerts)', () => {
  it('shows the current weather and the most serious alert', async () => {
    mockApi({ 'GET /api/weather?lat=-26.2&lon=28.05': [200, stormy] });
    renderAlerts();
    const weather = within(screen.getByRole('region', { name: 'Weather in Johannesburg' }));
    expect(await weather.findByText('18°C')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thunderstorms expected' })).toBeInTheDocument();
  });

  it('switches to the forecast and the alert list', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/weather?lat=-26.2&lon=28.05': [200, stormy] });
    renderAlerts();
    await screen.findByText('18°C');

    await user.click(views().getByRole('button', { name: 'Forecast' }));
    expect(within(screen.getByRole('list', { name: 'Daily forecast' })).getAllByRole('listitem')).toHaveLength(4);

    await user.click(views().getByRole('button', { name: /^Alerts/ }));
    const list = within(screen.getByRole('region', { name: 'Alerts' }));
    expect(list.getAllByRole('article').map((a) => within(a).getByRole('heading').textContent)).toEqual(['Thunderstorms expected']);
  });

  it('shows live alerts from the API with their sources', async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /api/weather?lat=-26.2&lon=28.05': [200, stormy],
      'GET /api/alerts?lat=-26.2&lon=28.05&place=Johannesburg': [200, {
        alerts: [
          { id: 'saws-0', severity: 'severe', title: 'Orange Level 6 Warning: Disruptive Rain', body: 'Flooding expected.', where: 'Gauteng', source: 'SA Weather Service', href: 'https://caps.weathersa.co.za/a1' },
          { id: 'power', severity: 'warning', title: 'Planned power outage', body: 'Mon 18:00 to 20:30.', source: 'EskomSePush', href: '/services' },
        ],
        sources: { weather: 'live', power: 'live', air: 'stale', saws: 'live' },
        sample: false,
      }],
    });
    renderAlerts();
    const sources = within(await screen.findByRole('list', { name: 'Alert sources' }));
    expect(sources.getByText('Power: live')).toBeInTheDocument();
    expect(sources.getByText('Air quality: last known')).toBeInTheDocument();

    await user.click(views().getByRole('button', { name: 'Alerts (2)' }));
    expect(screen.getByRole('link', { name: 'Official warning →' })).toHaveAttribute('href', 'https://caps.weathersa.co.za/a1');
    expect(screen.getByRole('link', { name: 'See status →' })).toHaveAttribute('href', '/services');
  });

  it('labels sample alerts so they are not taken for real ones', async () => {
    mockApi({
      'GET /api/alerts?lat=-26.2&lon=28.05&place=Johannesburg': [200, {
        alerts: [{ id: 'sample-power', severity: 'warning', title: 'Planned power outage tonight', body: '...', source: 'Sample data', sample: true }],
        sources: { weather: 'unavailable', power: 'off', air: 'unavailable', saws: 'unavailable' },
        sample: true,
      }],
    });
    renderAlerts();
    expect(await screen.findByText(/These are examples, not real alerts/)).toBeInTheDocument();
    expect(screen.getByText('Watch · Sample')).toBeInTheDocument();
  });

  it('offers a retry when the weather cannot load', async () => {
    mockApi({});
    renderAlerts();
    expect(await screen.findByText('Weather is unavailable right now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('remembers the place you pick', async () => {
    const user = userEvent.setup();
    renderAlerts();
    await user.selectOptions(screen.getByLabelText('Place'), 'Cape Town');
    expect(screen.getByRole('region', { name: 'Weather in Cape Town' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('weather:place')).name).toBe('Cape Town');
  });

  it('ticks off the emergency checklist and remembers it', async () => {
    const user = userEvent.setup();
    renderAlerts();
    const checklist = within(screen.getByRole('region', { name: 'Emergency Checklist' }));
    expect(checklist.getByText(`0 of ${CHECKLIST.length} done`)).toBeInTheDocument();

    await user.click(checklist.getByRole('checkbox', { name: CHECKLIST[0].label }));
    expect(checklist.getByText(`1 of ${CHECKLIST.length} done`)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('alerts:checklist'))).toEqual([CHECKLIST[0].id]);
  });
});
