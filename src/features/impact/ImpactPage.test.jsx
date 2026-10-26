import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { today } from '../green-wallet/totals';

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
});
