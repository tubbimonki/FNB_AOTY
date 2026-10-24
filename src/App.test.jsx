import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { renderWithProviders } from './test/renderWithProviders';

describe('App smoke tests', () => {
  it('renders the home page with the nav', () => {
    renderWithProviders(<App />, { route: '/home' });
    expect(screen.getByText('Protecting Our Planet for Future Generations')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Green Wallet' })).toBeInTheDocument();
  });

  it('logs an action in Green Wallet and updates today', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/tracker' });

    expect(screen.getByText('Nothing logged yet. Add your first action above.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Log it' }));

    expect(screen.getByText(/^1 actions/)).toBeInTheDocument();
    const [entry] = screen.getAllByRole('listitem').filter((li) => li.textContent.includes('Delete'));
    expect(within(entry).getByText('Walked or cycled 5 km instead of driving')).toBeInTheDocument();
  });

  it('sends logged-out visitors from the dashboard to login', () => {
    renderWithProviders(<App />, { route: '/dashboard' });
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows the dashboard to a logged-in user', () => {
    renderWithProviders(<App />, { route: '/dashboard', user: { id: '1', name: 'Shella' } });
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
