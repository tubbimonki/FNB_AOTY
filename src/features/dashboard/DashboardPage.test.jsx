import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { today } from '../green-wallet/totals';
import { newsItems } from '../news/newsItems';
import { guideItems, latestGuides } from '../guides/guideItems';
import { renderWithProviders } from '../../test/renderWithProviders';
import { mockApi } from '../../test/mockApi';

const shella = { id: 1, name: 'Shella', email: 'shella@example.com' };
const renderAt = (route) => renderWithProviders(<App />, { route, user: shella });
const shortcuts = () => within(screen.getByRole('region', { name: 'Shortcuts' }));
const sections = () => within(screen.getByRole('navigation', { name: 'Dashboard sections' }));
const sidebar = () => within(screen.getByRole('complementary', { name: 'Sidebar' }));

const logTwoBeefSwaps = () =>
  localStorage.setItem(
    'green-wallet:logs',
    JSON.stringify([
      { id: 'a', actionId: 'no-beef', date: today() }, // 3.5 kg, R20 each
      { id: 'b', actionId: 'no-beef', date: today() },
      { id: 'c', actionId: 'no-beef', date: '2000-01-01' },
    ]),
  );

// What our /api/weather answers: 34°C tomorrow should raise a heat alert.
const sunnyThenHot = {
  current: { tempC: 26.4, feelsLikeC: 27, humidity: 30, windKph: 9, code: 0, isDay: true },
  days: [
    { date: '2026-10-25', code: 0, maxC: 29, minC: 15, rainChance: 0, uvMax: 6 },
    { date: '2026-10-26', code: 1, maxC: 34, minC: 18, rainChance: 10, uvMax: 7 },
    { date: '2026-10-27', code: 3, maxC: 25, minC: 14, rainChance: 40, uvMax: 5 },
    { date: '2026-10-28', code: 61, maxC: 21, minC: 12, rainChance: 90, uvMax: 3 },
  ],
  fetchedAt: Date.parse('2026-10-25T08:00:00Z'),
  stale: false,
};

describe('Dashboard (/dashboard)', () => {
  it('greets the user and shows weather, quick access and shortcuts', () => {
    renderAt('/dashboard');
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening), Shella!$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Today in Johannesburg' })).toHaveAttribute('href', '/alerts');
    const quick = within(screen.getByRole('region', { name: 'Quick Access' }));
    expect(quick.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/alerts', '/services', '/eco', '/map']);
    expect(shortcuts().getAllByRole('article')).toHaveLength(3);
    expect(shortcuts().getByRole('link', { name: 'Climate news' })).toHaveAttribute('href', '/dashboard/news');
    expect(shortcuts().getByRole('link', { name: 'Guides' })).toHaveAttribute('href', '/dashboard/guides');
    expect(shortcuts().getByRole('link', { name: 'Green Wallet' })).toHaveAttribute('href', '/tracker');
  });

  it('shows the weather from the API and turns the heat into the alert banner', async () => {
    mockApi({ 'GET /api/weather?lat=-26.2&lon=28.05': [200, sunnyThenHot] });
    renderAt('/dashboard');
    const today = within(screen.getByRole('link', { name: 'Today in Johannesburg' }));
    expect(await today.findByText('26°C')).toBeInTheDocument();
    expect(today.getByText('Clear sky')).toBeInTheDocument();
    expect(today.getByText('H: 29° L: 15°')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Heat: up to 34°C' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details →' })).toHaveAttribute('href', '/alerts');
  });

  it('puts the most serious alert from the API in the banner', async () => {
    mockApi({
      'GET /api/alerts?lat=-26.2&lon=28.05&place=Johannesburg': [200, { alerts: [
        { id: 'a', severity: 'info', title: 'Air quality: moderate', body: '...' },
        { id: 'b', severity: 'severe', title: 'Heavy rain warning', body: 'Possible flooding.' },
      ] }],
    });
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Heavy rain warning' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alerts (2)' })).toBeInTheDocument();
  });

  it('says so when the weather cannot load', async () => {
    mockApi({});
    renderAt('/dashboard');
    expect(await screen.findByText('Weather unavailable. Tap for details.')).toBeInTheDocument();
  });

  it("shows today's Green Wallet totals on its shortcut", () => {
    logTwoBeefSwaps();
    renderAt('/dashboard');
    const wallet = shortcuts().getByRole('link', { name: 'Green Wallet' }).closest('article');
    expect(wallet).toHaveTextContent('7.0 kg CO2 · R40.00 today');
  });

  it('opens the dedicated news page from its widget', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    await user.click(shortcuts().getByRole('link', { name: 'Climate news' }));

    expect(screen.getByRole('heading', { name: 'Climate news' })).toBeInTheDocument();
    const feed = within(screen.getByRole('region', { name: 'News feed' }));
    expect(feed.getAllByRole('article')).toHaveLength(newsItems.length);
  });

  it('sends old ?view= links to the dedicated pages', () => {
    renderAt('/dashboard?view=guides');
    expect(screen.getByRole('heading', { name: 'Guides', level: 1 })).toBeInTheDocument();
  });

  it.each([
    ['/news', 'Climate news'],
    ['/guides', 'Guides'],
  ])('redirects the old %s page to the dashboard', (route, title) => {
    renderAt(route);
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeInTheDocument();
  });
});

describe('News and Guides pages', () => {
  it('lists guides newest first and marks Guides as the current section', () => {
    renderAt('/guides');
    const list = within(screen.getByRole('region', { name: 'Latest guides' }));
    const titles = list.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent);
    expect(titles).toEqual(latestGuides(guideItems).map((g) => g.title));
    expect(sections().getByRole('link', { name: /Guides/ })).toHaveAttribute('aria-current', 'page');
  });

  it('switches between the two pages from the section strip', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/news');
    await user.click(sections().getByRole('link', { name: /Guides/ }));
    expect(screen.getByRole('region', { name: 'Latest guides' })).toBeInTheDocument();
  });

  it('shows the other content type in the sidebar', () => {
    renderAt('/dashboard/news');
    const [newest] = latestGuides(guideItems);
    expect(sidebar().getByRole('link', { name: newest.title })).toHaveAttribute(
      'href',
      `/dashboard/guides#guide-${newest.id}`,
    );
  });

  it("shows today's totals in the strip and the sidebar card", () => {
    logTwoBeefSwaps();
    renderAt('/dashboard/news');
    expect(sections().getByRole('link', { name: /Green Wallet/ })).toHaveTextContent('7.0 kg today');
    const wallet = within(screen.getByRole('region', { name: 'Green Wallet today' }));
    expect(wallet.getByText('R40.00')).toBeInTheDocument();
  });

  it('needs a login, like the overview', () => {
    renderWithProviders(<App />, { route: '/dashboard/guides' });
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});

describe('Real news and guides', () => {
  const liveStory = {
    id: 'abc123', title: 'Gauteng heatwave warning issued', summary: 'Hot days ahead.', source: 'News24',
    date: '2026-10-25', topic: 'Weather', url: 'https://www.news24.com/heat', region: 'za', top: true,
  };

  it('shows live stories from the API, each linking to its source in a new tab', async () => {
    mockApi({ 'GET /api/news': [200, { items: [liveStory], source: 'live', feeds: {} }] });
    renderAt('/dashboard/news');
    const link = await screen.findByRole('link', { name: liveStory.title });
    expect(link).toHaveAttribute('href', liveStory.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/Live from climate news feeds/)).toBeInTheDocument();
  });

  it('falls back to the bundled real stories when the API is down', () => {
    renderAt('/dashboard/news');
    const [first] = newsItems;
    expect(screen.getByRole('link', { name: first.title })).toHaveAttribute('href', first.url);
    expect(screen.getByText(/checked by hand/)).toBeInTheDocument();
  });

  it('puts the news and guides lists in height-limited scroll boxes', () => {
    renderAt('/dashboard/news');
    expect(screen.getByRole('group', { name: 'News stories' })).toHaveClass('scroll-box', 'scroll-box-tall');
  });

  it('links every guide to real how-to pages', () => {
    renderAt('/dashboard/guides');
    for (const guide of guideItems) {
      const links = within(screen.getByRole('list', { name: `Read more: ${guide.title}` })).getAllByRole('link');
      expect(links.map((a) => a.getAttribute('href'))).toEqual(guide.links.map((l) => l.url));
    }
    expect(screen.getByRole('group', { name: 'Guides' })).toHaveClass('scroll-box');
  });

  it('shows scrollable latest news and guides on the dashboard', () => {
    renderAt('/dashboard');
    const news = within(screen.getByRole('list', { name: 'Latest News list' }));
    expect(news.getAllByRole('link')).toHaveLength(Math.min(12, newsItems.length));
    const guides = within(screen.getByRole('list', { name: 'Latest Guides list' }));
    expect(guides.getAllByRole('link')[0]).toHaveAttribute('href', `/dashboard/guides#guide-${latestGuides(guideItems)[0].id}`);
  });
});
