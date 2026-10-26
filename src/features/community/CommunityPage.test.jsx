import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { lastBodySentTo, mockApi } from '../../test/mockApi';
import { ago } from './ago';
import { offlineEvents } from '../../../shared/events.js';
import { eventWhen } from './eventDates';

const thandi = { id: 1, name: 'Thandi' };
const updates = {
  updates: [{ id: 'u1', kind: 'road', title: 'Road reopened on Main Rd', detail: 'Traffic flowing normally', minutesAgo: 120 }],
  sample: true,
};
// The bundled events as the API would send them on 1 Nov 2026.
const events = offlineEvents(new Date('2026-11-01T10:00:00+02:00'));
const muizenberg = events.find((e) => e.id === 'clean-c-muizenberg-nov');

describe('Community (/community)', () => {
  it('shows the events carousel, tools, local updates and help', async () => {
    mockApi({ 'GET /api/community/updates': [200, updates], 'GET /api/events': [200, { events, sample: true }] });
    renderWithProviders(<App />, { route: '/community' });
    expect(await screen.findByText('Road reopened on Main Rd')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago · Traffic flowing normally')).toBeInTheDocument();
    const carousel = await screen.findByRole('region', { name: 'Upcoming events' });
    expect(within(carousel).getByRole('link', { name: /Clean C beach clean-up: Muizenberg/ })).toHaveAttribute('href', '/community/events/clean-c-muizenberg-nov');
    expect(within(carousel).queryByText(/International Coastal Cleanup Day/)).not.toBeInTheDocument(); // past events stay off the carousel
    expect(screen.getByRole('link', { name: /Community Map/ })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: /10111/ })).toHaveAttribute('href', 'tel:10111');
  });

  it('lists upcoming and past events on the Events tab', async () => {
    const user = userEvent.setup();
    const going = events.map((e) => (e.id === 'repair-cafe' ? { ...e, going: true } : e));
    mockApi({ 'GET /api/events': [200, { events: going, sample: true }] });
    renderWithProviders(<App />, { route: '/community' });
    await user.click(screen.getByRole('button', { name: 'Events' }));
    expect(within(await screen.findByRole('list', { name: "Events you're going to" })).getByText('Repair café')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Upcoming events' })).getByText(eventWhen(muizenberg))).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Recent events' })).getByText(/International Coastal Cleanup Day/)).toBeInTheDocument();
  });

  it('still shows the saved events when the API is down', async () => {
    mockApi({}); // every call fails
    renderWithProviders(<App />, { route: '/community?tab=events' });
    expect(await screen.findByText(/the server can't be reached/)).toBeInTheDocument();
    expect(screen.getAllByText('Clean C beach clean-up: Muizenberg').length).toBeGreaterThan(0);
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

describe('An event (/community/events/:id)', () => {
  const route = '/community/events/clean-c-muizenberg-nov';

  it('shows the details, who is going and the reward', async () => {
    mockApi({ [`GET /api${route.replace('/community', '')}`]: [200, { event: muizenberg }] });
    renderWithProviders(<App />, { route });
    expect(await screen.findByRole('heading', { name: 'Clean C beach clean-up: Muizenberg' })).toBeInTheDocument();
    expect(screen.getByText('Shark Spotters hut, Surfer’s Corner, Muizenberg, Cape Town')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Who's going (23)" })).toBeInTheDocument();
    expect(screen.getByText('and 11 more')).toBeInTheDocument(); // 12 names shown
    const reward = screen.getByRole('region', { name: 'Reward for going' });
    expect(within(reward).getByText('1200 eco-points')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in to attend' })).toBeInTheDocument();
  });

  it('lets a member attend, then unlocks the reward', async () => {
    const user = userEvent.setup();
    const going = { ...muizenberg, going: true, attendeeCount: 24, attendees: ['You', ...muizenberg.attendees] };
    mockApi({
      'GET /api/events/clean-c-muizenberg-nov': [200, { event: muizenberg }],
      'POST /api/events/clean-c-muizenberg-nov/attend': [201, { event: going }],
      'DELETE /api/events/clean-c-muizenberg-nov/attend': [200, { event: muizenberg }],
    });
    renderWithProviders(<App />, { route, user: thandi });
    await user.click(await screen.findByRole('button', { name: 'Attend' }));
    expect(await screen.findByText("You're going!")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Who's going (24)" })).toBeInTheDocument();
    expect(screen.getByText(/Unlocked!/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "I can't make it" }));
    expect(await screen.findByRole('button', { name: 'Attend' })).toBeInTheDocument();
  });

  it('can still be read when the API is down, without signing up', async () => {
    mockApi({});
    renderWithProviders(<App />, { route, user: thandi });
    expect(await screen.findByText(/Can't reach the server/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Attend' })).not.toBeInTheDocument();
  });

  it('says so when the event does not exist', async () => {
    mockApi({ 'GET /api/events/nope': [404, { error: 'Event not found' }] });
    renderWithProviders(<App />, { route: '/community/events/nope' });
    expect(await screen.findByText("We couldn't find that event.")).toBeInTheDocument();
  });
});

describe('Event reactions', () => {
  const route = '/community/events/clean-c-muizenberg-nov';
  const counts = { smile: 4, heart: 2, clap: 0, seedling: 1 };

  it('shows the counts and toggles a heart for a member', async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /api/events/clean-c-muizenberg-nov': [200, { event: muizenberg }],
      'GET /api/reactions/events/clean-c-muizenberg-nov': [200, { counts, mine: [] }],
      'POST /api/reactions/events/clean-c-muizenberg-nov': [
        [200, { counts: { ...counts, heart: 3 }, mine: ['heart'], reacted: true }],
        [200, { counts, mine: [], reacted: false }],
      ],
    });
    renderWithProviders(<App />, { route, user: thandi });
    const heart = await screen.findByRole('button', { name: 'Heart (2)' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await user.click(heart);
    expect(await screen.findByRole('button', { name: 'Heart (3)' })).toHaveAttribute('aria-pressed', 'true');
    expect(lastBodySentTo('/api/reactions/events/clean-c-muizenberg-nov')).toEqual({ reaction: 'heart' });
    await user.click(screen.getByRole('button', { name: 'Heart (3)' }));
    expect(await screen.findByRole('button', { name: 'Heart (2)' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sends visitors to log in', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/events/clean-c-muizenberg-nov': [200, { event: muizenberg }] });
    renderWithProviders(<App />, { route });
    await user.click(await screen.findByRole('button', { name: /^Smile/ }));
    expect(await screen.findByRole('button', { name: /Log in/ })).toBeInTheDocument();
  });

  it('shows counts on the carousel slides', async () => {
    mockApi({
      'GET /api/events': [200, { events, sample: true }],
      'GET /api/reactions/events': [200, { reactions: { 'clean-c-muizenberg-nov': { counts, mine: ['smile'] } } }],
    });
    renderWithProviders(<App />, { route: '/community' });
    const carousel = await screen.findByRole('region', { name: 'Upcoming events' });
    expect(await within(carousel).findByText('Reactions: 4 Smile, 2 Heart, 1 Green')).toBeInTheDocument();
  });
});

describe('ago', () => {
  it.each([[5, '5 min ago'], [60, '1 hour ago'], [300, '5 hours ago'], [2880, '2 days ago']])('%i -> %s', (m, text) => {
    expect(ago(m)).toBe(text);
  });
});
