import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { today } from '../green-wallet/totals';
import { newsItems } from '../news/newsItems';
import { guideItems, latestGuides } from '../guides/guideItems';
import { renderWithProviders } from '../../test/renderWithProviders';

const shella = { id: 1, name: 'Shella', email: 'shella@example.com' };
const renderAt = (route) => renderWithProviders(<App />, { route, user: shella });
const sections = () => within(screen.getByRole('navigation', { name: 'Dashboard sections' }));
const sidebar = () => within(screen.getByRole('complementary', { name: 'Sidebar' }));

describe('Dashboard (news + guides side)', () => {
  it('greets the user and shows the news feed by default', () => {
    renderAt('/dashboard');
    expect(screen.getByRole('heading', { name: 'Welcome back, Shella' })).toBeInTheDocument();
    const feed = within(screen.getByRole('region', { name: 'News feed' }));
    expect(feed.getAllByRole('article')).toHaveLength(newsItems.length);
    expect(sections().getByRole('link', { name: /News/ })).toHaveAttribute('aria-current', 'page');
  });

  it('switches to guides from the feature strip, newest first', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');

    await user.click(sections().getByRole('link', { name: /Guides/ }));

    const list = within(screen.getByRole('region', { name: 'Latest guides' }));
    const titles = list.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent);
    expect(titles).toEqual(latestGuides(guideItems).map((g) => g.title));
    expect(sections().getByRole('link', { name: /Guides/ })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the other content type in the sidebar', () => {
    renderAt('/dashboard?view=news');
    const [newest] = latestGuides(guideItems);
    expect(sidebar().getByRole('link', { name: newest.title })).toHaveAttribute(
      'href',
      `/dashboard?view=guides#guide-${newest.id}`,
    );

    renderAt('/dashboard?view=guides');
    expect(screen.getAllByRole('region', { name: 'Top news' })).toHaveLength(1);
  });

  it("shows today's Green Wallet totals in the strip and the sidebar", () => {
    localStorage.setItem(
      'green-wallet:logs',
      JSON.stringify([
        { id: 'a', actionId: 'no-beef', date: today() }, // 3.5 kg, R20 each
        { id: 'b', actionId: 'no-beef', date: today() },
        { id: 'c', actionId: 'no-beef', date: '2000-01-01' },
      ]),
    );
    renderAt('/dashboard');

    expect(sections().getByRole('link', { name: /Green Wallet/ })).toHaveTextContent('7.0 kg today');
    const wallet = within(screen.getByRole('region', { name: 'Green Wallet today' }));
    expect(wallet.getByText('7.0 kg')).toBeInTheDocument();
    expect(wallet.getByText('R40.00')).toBeInTheDocument();
    expect(wallet.getByRole('link', { name: 'Log another action' })).toHaveAttribute('href', '/tracker');
  });

  it('sends the old /news and /guides links to the dashboard', () => {
    renderAt('/guides');
    expect(screen.getByRole('region', { name: 'Latest guides' })).toBeInTheDocument();
  });
});

describe('Navigation', () => {
  it('keeps the header to two tabs, with info pages in the footer', () => {
    renderAt('/dashboard');
    const header = within(screen.getByRole('banner'));
    const tabs = within(header.getByRole('navigation')).getAllByRole('link');
    expect(tabs.map((link) => link.textContent)).toEqual(['Dashboard', 'Green Wallet']);
    expect(header.getByRole('link', { name: /Climate/ })).toHaveAttribute('href', '/home');

    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
