import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { today } from '../green-wallet/totals';
import { mockApi } from '../../test/mockApi';

const thandi = { id: 1, name: 'Thandi Mokoena' };

describe('Your Impact (/impact)', () => {
  it('starts as a level 1 Seedling', () => {
    renderWithProviders(<App />, { route: '/impact', user: thandi });
    expect(screen.getByRole('heading', { name: 'Thandi Mokoena' })).toBeInTheDocument();
    expect(screen.getByText('Seedling')).toBeInTheDocument();
    expect(screen.getByText('0 / 500 points')).toBeInTheDocument();
  });

  it('turns logged actions into points, badges and history', () => {
    const travel = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, actionId: 'walk-5km', date: today() }));
    localStorage.setItem('green-wallet:logs', JSON.stringify(travel));
    localStorage.setItem('eco:footprint', JSON.stringify({ answers: {}, total: 4.2, savedAt: 1 }));
    renderWithProviders(<App />, { route: '/impact', user: thandi });

    expect(screen.getByText('150 / 500 points')).toBeInTheDocument(); // 5 x 10 + 100
    const badges = within(screen.getByRole('region', { name: 'Badges' }));
    expect(within(badges.getByText('Green Commuter').closest('li')).getByText('Active')).toBeInTheDocument();
    expect(within(badges.getByText('Water Saver').closest('li')).getByText('0 / 3')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Your Actions' })).getAllByText('+10 pts')).toHaveLength(5);
  });

  it('adds event rewards from the server to the points', async () => {
    mockApi({
      'GET /api/impact/awards': [200, {
        awards: [{ source: 'event:clean-c-muizenberg-nov', label: 'Going to Clean C beach clean-up: Muizenberg', points: 1200, premiumDays: 7, createdAt: new Date().toISOString() }],
        points: 1200,
        premiumUntil: new Date(Date.now() + 7 * 864e5).toISOString(),
      }],
    });
    renderWithProviders(<App />, { route: '/impact', user: thandi });
    expect(await screen.findByText('1200 / 1500 points')).toBeInTheDocument();
    expect(screen.getByText('Green Guardian')).toBeInTheDocument();
    const rewards = within(screen.getByRole('region', { name: 'Event Rewards' }));
    expect(rewards.getByText('+1200 pts · +7 days Premium')).toBeInTheDocument();
    expect(screen.getByText(/Premium until/)).toBeInTheDocument();
  });

  it("shows the database's score once everything is saved", async () => {
    const saved = [{ id: 'w1', actionId: 'walk-5km', date: today() }];
    localStorage.setItem('green-wallet:logs:u1', JSON.stringify(saved.map((l) => ({ ...l, synced: true }))));
    mockApi({
      'GET /api/wallet/logs': [200, { logs: saved }],
      'GET /api/eco/water/logs': [200, { logs: [] }],
      'GET /api/alerts/checklist': [200, { value: [] }],
      'GET /api/eco/footprint/mine': [200, { value: null }],
      'GET /api/impact/awards': [200, { awards: [], points: 0, premiumUntil: null }],
      // Say a second phone logged more: the database knows, this browser doesn't.
      'GET /api/impact/me': [200, { points: 610, level: 2, title: 'Climate Hero', nextAt: 1000, nextTitle: 'Green Guardian', badges: [], awards: [], premiumUntil: null }],
    });
    renderWithProviders(<App />, { route: '/impact', user: thandi });
    expect(screen.getByText('10 / 500 points')).toBeInTheDocument(); // the browser's count first
    expect(await screen.findByText('610 / 1000 points')).toBeInTheDocument();
    expect(screen.getByText('Climate Hero')).toBeInTheDocument();
  });

  it("keeps the browser's count while a log is still unsaved", async () => {
    localStorage.setItem('green-wallet:logs:u1', JSON.stringify([{ id: 'n1', actionId: 'walk-5km', date: today() }]));
    mockApi({ 'GET /api/impact/me': [200, { points: 0, level: 1, title: 'Seedling', nextAt: 500, nextTitle: 'Climate Hero', badges: [], awards: [], premiumUntil: null }] });
    renderWithProviders(<App />, { route: '/impact', user: thandi });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('10 / 500 points')).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([url]) => url === '/api/impact/me')).toBe(false);
  });
});

