import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { lastBodySentTo, mockApi } from '../../test/mockApi';
import { renderWithProviders } from '../../test/renderWithProviders';

const fillForm = async (user) => {
  await user.type(screen.getByLabelText('Name'), 'Shella');
  await user.type(screen.getByLabelText('Email'), 'shella@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct horse battery');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

// YOUR TURN (task 3): remove `.skip` once you start on RegisterPage.jsx.
describe.skip('task 3: RegisterPage', () => {
  it('registers, then lands on the dashboard logged in', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /api/auth/register': [201, { user: { id: 1, name: 'Shella', email: 'shella@example.com' } }],
    });
    renderWithProviders(<App />, { route: '/register' });

    await fillForm(user);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log out \(Shella\)/ })).toBeInTheDocument();

    expect(lastBodySentTo('/api/auth/register')).toEqual({
      name: 'Shella',
      email: 'shella@example.com',
      password: 'correct horse battery',
    });
  });

  it("shows the API's error and stays on the page", async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/register': [409, { error: 'That email is already registered' }] });
    renderWithProviders(<App />, { route: '/register' });

    await fillForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('That email is already registered');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('links to the login page', () => {
    renderWithProviders(<App />, { route: '/register' });
    // within(main): the header has its own "Log in" link, so look only at the page.
    const page = within(screen.getByRole('main'));
    expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });
});
