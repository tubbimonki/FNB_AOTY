import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { lastBodySentTo, mockApi } from '../../test/mockApi';
import { ago } from './ago';

const thandi = { id: 1, name: 'Thandi' };
const updates = {
  updates: [{ id: 'u1', kind: 'road', title: 'Road reopened on Main Rd', detail: 'Traffic flowing normally', minutesAgo: 120 }],
  events: [{ id: 'e1', title: 'Clean-up', body: 'Bring gloves', where: 'Park', when: 'Sat 08:00' }],
  sample: true,
};

describe('Community (/community)', () => {
  it('shows local updates, events and help', async () => {
    mockApi({ 'GET /api/community/updates': [200, updates] });
    renderWithProviders(<App />, { route: '/community' });
    expect(await screen.findByText('Road reopened on Main Rd')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago · Traffic flowing normally')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: "What's on" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /10111/ })).toHaveAttribute('href', 'tel:10111');
  });

  it('asks visitors to log in before showing their reports', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/community' });
    await user.click(screen.getByRole('button', { name: 'My Reports' }));
    expect(screen.getByText("Log in to see the problems you've reported.")).toBeInTheDocument();
  });

  it("lists a logged-in user's reports", async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /api/community/reports/mine': [200, { reports: [{ id: 1, category: 'water', description: 'Burst pipe', status: 'received', createdAt: '2026-10-25T08:00:00Z' }] }],
    });
    renderWithProviders(<App />, { route: '/community', user: thandi });
    await user.click(screen.getByRole('button', { name: 'My Reports' }));
    expect(await screen.findByText('Burst pipe')).toBeInTheDocument();
    expect(screen.getByText('received')).toBeInTheDocument();
  });
});

describe('Report a problem (/community/report)', () => {
  it('checks the form before sending', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/community/report', user: thandi });
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a category');
  });

  it('sends the report and says thanks', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/community/reports': [201, { report: { id: 1 } }] });
    renderWithProviders(<App />, { route: '/community/report?category=water', user: thandi });
    expect(screen.getByLabelText('What kind of problem?')).toHaveValue('water');
    await user.type(screen.getByLabelText("What's happening?"), 'Burst pipe on 4th Ave');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(await screen.findByRole('heading', { name: 'Thanks, your report was sent' })).toBeInTheDocument();
    expect(lastBodySentTo('/api/community/reports')).toEqual({ category: 'water', description: 'Burst pipe on 4th Ave' });
  });
});

describe('ago', () => {
  it.each([[5, '5 min ago'], [60, '1 hour ago'], [300, '5 hours ago'], [2880, '2 days ago']])('%i -> %s', (m, text) => {
    expect(ago(m)).toBe(text);
  });
});
