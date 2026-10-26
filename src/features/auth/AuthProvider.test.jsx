import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { lastBodySentTo, mockApi } from '../../test/mockApi';
import { AuthProvider } from './AuthProvider';

// Like main.jsx: no initialUser, so the provider really asks GET /api/auth/me.
const renderApp = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );

const shella = { id: 1, name: 'Shella', email: 'shella@example.com' };
const loggedOut = [401, { error: 'Not logged in' }];

describe('AuthProvider + LoginPage', () => {
  it('restores the session on page load (GET /auth/me)', async () => {
    mockApi({ 'GET /api/auth/me': [200, { user: shella }] });
    renderApp('/dashboard');

    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening)/ })).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('logs in through the form and returns to the page that asked', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/auth/me': loggedOut, 'POST /api/auth/login': [200, { user: shella }] });
    renderApp('/dashboard');

    await user.type(await screen.findByLabelText('Email'), shella.email);
    await user.type(screen.getByLabelText('Password'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening)/ })).toBeInTheDocument();
    expect(lastBodySentTo('/api/auth/login')).toEqual({
      email: shella.email,
      password: 'correct horse battery',
    });
  });

  it('shows the error when the password is wrong', async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /api/auth/me': loggedOut,
      'POST /api/auth/login': [401, { error: 'Invalid email or password' }],
    });
    renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), shella.email);
    await user.type(screen.getByLabelText('Password'), 'nope nope nope');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('logs out through the header button', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /api/auth/me': [200, { user: shella }], 'POST /api/auth/logout': [204] });
    renderApp('/dashboard');

    await user.click(await screen.findByRole('button', { name: 'Log out (Shella)' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('logs out on the page when a members-only call says the session ended', async () => {
    mockApi({
      'GET /api/auth/me': [200, { user: shella }],
      // e.g. the token was revoked by logging out in another tab
      'GET /api/impact/awards': [401, { error: 'Session expired, please log in again' }],
    });
    renderApp('/impact');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});
