import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { addDays, today } from '../green-wallet/totals';
import { stageFor } from './plantStages';

const seed = (key, value) => localStorage.setItem(key, JSON.stringify(value));

describe('Eco-Impact (/eco)', () => {
  it('invites you to work out your footprint, then shows it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco' });
    await user.click(screen.getByRole('link', { name: 'Work out my footprint' }));

    expect(screen.getByRole('heading', { name: 'Carbon Footprint', level: 1 })).toBeInTheDocument();
    const result = within(screen.getByRole('region', { name: 'Your estimate' }));
    const before = result.getByText(/^\d+\.\d$/).textContent;

    await user.click(screen.getByRole('radio', { name: 'Vegan' }));
    expect(result.getByText(/^\d+\.\d$/).textContent).not.toBe(before);

    await user.click(screen.getByRole('button', { name: 'Save my footprint' }));
    await user.click(screen.getByRole('link', { name: 'Back to Eco-Impact' }));
    expect(screen.getByRole('link', { name: 'Redo the questions' })).toBeInTheDocument();
  });

  it('fills the goals from the water log and Green Wallet', () => {
    seed('water:logs', [{ id: 'w', date: today(), use: 'shower', litres: 45 }]);
    seed('green-wallet:logs', [{ id: 'a', actionId: 'recycle-bag', date: today() }]);
    renderWithProviders(<App />, { route: '/eco' });
    expect(screen.getByRole('progressbar', { name: 'Water Usage' })).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByText('Keep it up!')).toBeInTheDocument();
  });

  it('grows the plant with points and wilts it after three quiet days', () => {
    seed('green-wallet:logs', [{ id: 'a', actionId: 'cold-wash', date: addDays(today(), -4) }]);
    renderWithProviders(<App />, { route: '/eco' });
    expect(screen.getByRole('img', { name: /wilting/ })).toBeInTheDocument();
  });

  it('picks the plant stage from the points', () => {
    expect([0, 9, 10, 60, 130, 400].map(stageFor)).toEqual([0, 0, 1, 2, 3, 4]);
  });
});
