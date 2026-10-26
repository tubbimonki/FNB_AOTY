import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Recycling & Waste Guide (/eco/recycling)', () => {
  it('shows what each material takes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/recycling' });
    expect(screen.getByRole('heading', { name: 'Recyclable Plastic Items' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Glass' }));
    expect(screen.getByRole('heading', { name: 'Recyclable Glass Items' })).toBeInTheDocument();
    expect(screen.getByText('Mirrors')).toBeInTheDocument();
  });

  it('searches across every material', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/recycling' });
    await user.type(screen.getByLabelText('Search items'), 'pizza');
    const results = within(screen.getByRole('region', { name: 'Search results' }));
    expect(results.getByText('Greasy pizza boxes')).toBeInTheDocument();
    expect(results.getByText('Not accepted')).toBeInTheDocument();
  });

  it('remembers your collection day', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/eco/recycling' });
    await user.selectOptions(screen.getByLabelText('My collection day'), 'Friday');
    expect(localStorage.getItem('recycling:weekday')).toBe('5');
    expect(screen.getByText(/^Next collection:/)).toHaveTextContent('Fri');
  });
});
