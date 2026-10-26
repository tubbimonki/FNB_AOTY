import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { renderWithProviders } from './test/renderWithProviders';

describe('App smoke tests', () => {
  it('renders the splash screen with sign-up and login', () => {
    renderWithProviders(<App />, { route: '/home' });
    expect(screen.getByRole('heading', { name: 'Eco 5.0', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');
    // One in the splash, one in the desktop header.
    expect(screen.getAllByRole('link', { name: 'Log in' }).map((a) => a.getAttribute('href'))).toEqual(['/login', '/login']);
  });

  it('scrolls smoothly to the features section from the splash', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/home' });
    const scroll = vi.fn();
    document.getElementById('features').scrollIntoView = scroll;

    await user.click(screen.getByRole('link', { name: 'Explore Features' }));
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('logs an action in Green Wallet and updates today', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/tracker' });

    expect(screen.getByText(/^Nothing logged yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Log an action' }));
    await user.click(screen.getByRole('button', { name: /Walked or cycled 5 km/ }));

    const todayGroup = within(screen.getByRole('region', { name: 'Today' }));
    expect(todayGroup.getByText(/^1 action ·/)).toBeInTheDocument();
    expect(todayGroup.getByText('Walked or cycled 5 km instead of driving')).toBeInTheDocument();
  });

  it('sends logged-out visitors from the dashboard to login', () => {
    renderWithProviders(<App />, { route: '/dashboard' });
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows the dashboard to a logged-in user', () => {
    renderWithProviders(<App />, { route: '/dashboard', user: { id: '1', name: 'Shella' } });
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)/ })).toBeInTheDocument();
  });

  it.each([
    ['/alerts', 'Weather & Climate Alerts'],
    ['/map', 'Community Map'],
    ['/community', 'Community'],
    ['/services', 'Essential Services'],
    ['/eco', 'Eco-Impact'],
    ['/eco/footprint', 'Carbon Footprint'],
    ['/eco/water', 'Water Usage'],
    ['/eco/recycling', 'Recycling & Waste Guide'],
    ['/more', 'More'],
  ])('opens %s without an account', async (route, title) => {
    renderWithProviders(<App />, { route });
    expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeInTheDocument();
  });

  it.each(['/impact', '/community/report'])('%s needs a login', (route) => {
    renderWithProviders(<App />, { route });
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});
