import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithProviders } from '../test/renderWithProviders';

const TABS = ['Home', 'Map', 'Eco', 'Community', 'More'];
const tabBar = () => within(screen.getByRole('navigation', { name: 'Tabs' }));
const header = () => within(screen.getByRole('banner'));

describe('Navigation', () => {
  it('shows the same five tabs in the header and the phone tab bar', () => {
    renderWithProviders(<App />, { route: '/eco' });
    expect(tabBar().getAllByRole('link').map((a) => a.textContent)).toEqual(TABS);
    expect(within(header().getByRole('navigation', { name: 'Main' })).getAllByRole('link').map((a) => a.textContent)).toEqual(TABS);
  });

  it.each([
    ['/tracker', 'Eco'],
    ['/eco/water', 'Eco'],
    ['/alerts', 'Home'],
    ['/community/report', 'Community'],
    ['/about', 'More'],
  ])('on %s the %s tab is the current one', (route, tab) => {
    renderWithProviders(<App />, { route, user: { id: 1, name: 'Thandi' } });
    expect(tabBar().getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
    expect(tabBar().getAllByRole('link').filter((a) => a.getAttribute('aria-current'))).toHaveLength(1);
  });

  it('hides the tab bar on the splash and login screens', () => {
    renderWithProviders(<App />, { route: '/home' });
    expect(screen.queryByRole('navigation', { name: 'Tabs' })).not.toBeInTheDocument();
  });

  it('moves between pages from the tab bar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco' });
    await user.click(tabBar().getByRole('link', { name: 'More' }));
    expect(screen.getByRole('heading', { name: 'More', level: 1 })).toBeInTheDocument();
  });

  it('keeps the info pages in the footer and the logo on /home', () => {
    renderWithProviders(<App />, { route: '/eco' });
    expect(header().getByRole('link', { name: /Eco 5.0/ })).toHaveAttribute('href', '/home');
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
