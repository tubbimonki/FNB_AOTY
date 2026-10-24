import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { navItems } from '../navItems';
import { renderWithProviders } from '../test/renderWithProviders';

describe('Header mobile menu', () => {
  it('opens and closes with the menu button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header navigation={navItems} />, { route: '/home' });

    const button = screen.getByRole('button', { name: 'Open menu' });
    const nav = document.getElementById('main-nav');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(nav).toHaveClass('hidden');

    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(nav).not.toHaveClass('hidden');
  });

  it('closes after a link is tapped', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header navigation={navItems} />, { route: '/home' });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('link', { name: 'Green Wallet' }));
    expect(document.getElementById('main-nav')).toHaveClass('hidden');
  });
});
