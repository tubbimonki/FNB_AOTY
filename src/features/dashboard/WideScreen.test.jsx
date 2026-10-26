import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithProviders } from '../../test/renderWithProviders';
import { wideScreen } from '../../test/wideScreen';
import { mockApi } from '../../test/mockApi';
import { SAMPLE_STATUS } from '../../../api/modules/services/sampleData';

const shella = { id: 1, name: 'Shella', email: 'shella@example.com' };
const renderAt = (route, user = shella) => renderWithProviders(<App />, { route, user });

// Drop only matchMedia; the "no network" fetch from setup.js stays.
afterEach(() => {
  delete window.matchMedia;
});

describe('Wide desktop quick widgets (2xl and up)', () => {
  it('stay off on phones and laptops', () => {
    renderAt('/dashboard');
    expect(screen.queryByRole('complementary', { name: 'At a glance' })).not.toBeInTheDocument();
  });

  it('adds an "At a glance" column to the dashboard', () => {
    wideScreen();
    renderAt('/dashboard');
    const glance = within(screen.getByRole('complementary', { name: 'At a glance' }));
    expect(glance.getByRole('heading', { name: 'Water today' })).toBeInTheDocument();
    expect(glance.getByRole('heading', { name: 'Power' })).toBeInTheDocument();
    expect(glance.getByRole('heading', { name: 'Green Wallet today' })).toBeInTheDocument();
    expect(glance.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
  });

  it('puts each guide next to the tool that goes with it', () => {
    wideScreen();
    renderAt('/dashboard/guides');
    const water = within(screen.getByRole('complementary', { name: 'Try it: Water purification techniques for rural communities' }));
    expect(water.getByRole('heading', { name: 'Water today' })).toBeInTheDocument();
    const recycling = within(screen.getByRole('complementary', { name: 'Try it: Community recycling initiatives: a step-by-step guide' }));
    expect(recycling.getByRole('heading', { name: 'Recycling' })).toBeInTheDocument();
    const metal = within(screen.getByRole('complementary', { name: 'Try it: Reducing metal pollution in local waterways' }));
    expect(metal.getByText('Drop-off point only, never the bin')).toBeInTheDocument();
  });

  it('logging water in the side widget updates the Eco goals straight away', async () => {
    wideScreen();
    renderAt('/eco', null);
    const tools = within(screen.getByRole('complementary', { name: 'Quick tools' }));
    await userEvent.click(tools.getByRole('button', { name: /Toilet flush/ }));
    expect(tools.getByText('91 L left of your 100 L daily goal.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Water Usage' })).toHaveAttribute('aria-valuenow', '9');
  });

  it('answers "can I recycle it?" from the side widget', async () => {
    wideScreen();
    renderAt('/eco', null);
    const tools = within(screen.getByRole('complementary', { name: 'Quick tools' }));
    await userEvent.type(tools.getByRole('searchbox', { name: 'Can I recycle it?' }), 'cans');
    const answers = within(tools.getByRole('list', { name: 'Recycling answers' }));
    expect(answers.getByText('Cooldrink and beer cans').closest('li')).toHaveTextContent('Yes');
  });

  it('shows the tools that fit the open Services tab', async () => {
    wideScreen();
    mockApi({ 'GET /api/services/status': [200, { ...SAMPLE_STATUS, sample: true, live: [] }] });
    renderAt('/services', null);
    const water = within(await screen.findByRole('complementary', { name: 'Water tools' }));
    expect(water.getByRole('heading', { name: 'Water today' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Waste' }));
    expect(within(screen.getByRole('complementary', { name: 'Waste tools' })).getByRole('heading', { name: 'Recycling' })).toBeInTheDocument();

    // Transport has nothing that fits, so no extra column.
    await userEvent.click(screen.getByRole('button', { name: 'Transport' }));
    expect(screen.queryByRole('complementary', { name: 'Transport tools' })).not.toBeInTheDocument();
  });
});
