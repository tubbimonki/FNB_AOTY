import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { addDays, today } from './totals';

const renderTracker = () => renderWithProviders(<App />, { route: '/tracker' });
const rings = () => within(screen.getByRole('region', { name: "Today's progress" }));
const seed = (logs) => localStorage.setItem('green-wallet:logs', JSON.stringify(logs));

describe('Green Wallet (/tracker)', () => {
  it('opens the action dropdown from the rings and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderTracker();
    const toggle = rings().getByRole('button', { name: 'Log an action' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Food' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('fills the rings and logs on the chosen date', async () => {
    const user = userEvent.setup();
    renderTracker();
    await user.click(screen.getByRole('button', { name: 'Log an action' }));
    const when = screen.getByLabelText('When?');
    await user.clear(when);
    await user.type(when, addDays(today(), -1));
    await user.click(screen.getByRole('button', { name: /Swapped a beef meal/ }));

    expect(screen.getByText('Logged: Swapped a beef meal for beans or veg')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Yesterday' })).getByText(/^1 action ·/)).toBeInTheDocument();
    // Logged for yesterday, so today's rings stay empty.
    expect(rings().getAllByText('0%')).toHaveLength(3);
  });

  it('switches the rings between today and the last 7 days', async () => {
    const user = userEvent.setup();
    seed([
      { id: 'a', actionId: 'no-beef', date: today() },
      { id: 'b', actionId: 'no-beef', date: addDays(today(), -3) },
    ]);
    renderTracker();
    // One beef swap (3.5 kg) against a 5 kg daily goal.
    expect(rings().getByText('70%')).toBeInTheDocument();

    await user.click(rings().getByRole('button', { name: 'This week' }));
    const week = within(screen.getByRole('region', { name: 'Last 7 days' }));
    expect(week.getByRole('button', { name: 'This week' })).toHaveAttribute('aria-pressed', 'true');
    expect(week.getByText('7.0 kg')).toBeInTheDocument();
    expect(week.getByText('/ 35.0 kg')).toBeInTheDocument();
  });

  it('marks a goal as done once it is reached', () => {
    seed([1, 2, 3].map((n) => ({ id: `${n}`, actionId: 'cold-wash', date: today() })));
    renderTracker();
    expect(rings().getByText('✓ done')).toBeInTheDocument(); // 3 of 3 actions
  });

  it('shows the week strip and the streak', () => {
    seed([
      { id: 'a', actionId: 'cold-wash', date: today() },
      { id: 'b', actionId: 'cold-wash', date: addDays(today(), -1) },
    ]);
    renderTracker();
    const week = within(screen.getByRole('region', { name: 'Your week' }));
    expect(week.getAllByRole('listitem')).toHaveLength(7);
    expect(week.getByText(/2-day streak/)).toBeInTheDocument();
  });

  it('deletes an entry from the history', async () => {
    const user = userEvent.setup();
    seed([{ id: 'a', actionId: 'cold-wash', date: today() }]);
    renderTracker();
    await user.click(screen.getByRole('button', { name: `Delete "Washed laundry on cold" on ${today()}` }));
    expect(screen.getByText(/^Nothing logged yet/)).toBeInTheDocument();
  });
});
