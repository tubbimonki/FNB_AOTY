import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Water Usage (/eco/water)', () => {
  it('logs water and fills the ring and the week', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/water' });
    const todayCard = within(screen.getByRole('region', { name: "Today's water" }));
    expect(todayCard.getByText('0 L')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /5 min shower/ }));
    await user.type(screen.getByLabelText('Litres'), '10');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(todayCard.getByText('55 L')).toBeInTheDocument();
    expect(todayCard.getByText('55% of daily limit')).toBeInTheDocument();
    expect(todayCard.getByText('45 L remaining for today')).toBeInTheDocument();
    const week = within(screen.getByRole('list', { name: 'Litres per day' }));
    expect(week.getAllByRole('listitem')).toHaveLength(7);
    expect(week.getByText(/: 55 litres$/)).toBeInTheDocument();
  });

  it('removes a log', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/water' });
    await user.click(screen.getByRole('button', { name: /Toilet flush/ }));
    await user.click(screen.getByRole('button', { name: 'Remove 9 L' }));
    expect(within(screen.getByRole('region', { name: "Today's water" })).getByText('0 L')).toBeInTheDocument();
  });

  it('compares you with the goal and the SA average', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/water' });
    await user.click(screen.getByRole('button', { name: 'Comparison' }));
    expect(screen.getByText('South African average')).toBeInTheDocument();
  });
});
