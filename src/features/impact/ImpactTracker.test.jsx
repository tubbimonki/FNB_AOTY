import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { today } from '../green-wallet/totals';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('impact tracker (floats on every page)', () => {
  it('opens on tap with the totals from Green Wallet and a sourced comparison', async () => {
    const user = userEvent.setup();
    localStorage.setItem('green-wallet:logs', JSON.stringify([{ id: 'a', actionId: 'no-beef', date: today() }])); // 3.5 kg, R20
    renderWithProviders(<App />, { route: '/eco' });

    await user.click(screen.getByRole('button', { name: 'Your impact: 10 eco-points' }));
    const panel = within(screen.getByRole('region', { name: 'Your impact so far' }));
    expect(panel.getByText('3.5 kg')).toBeInTheDocument();
    expect(panel.getByText('R20')).toBeInTheDocument();
    expect(panel.getByText(/km not driven/)).toBeInTheDocument();
    expect(panel.getByRole('link', { name: /Source: US EPA/ })).toHaveAttribute('href', expect.stringContaining('epa.gov'));

    await user.click(panel.getByRole('button', { name: 'Another comparison' }));
    expect(panel.getByText(/kWh of coal-heavy grid power/)).toBeInTheDocument();
  });

  it('stays out of the way on the splash page', () => {
    renderWithProviders(<App />, { route: '/home' });
    expect(screen.queryByRole('button', { name: /Your impact/ })).not.toBeInTheDocument();
  });
});
