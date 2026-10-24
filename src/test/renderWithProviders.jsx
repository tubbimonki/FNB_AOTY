import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';

// Renders UI the way main.jsx does, but at a chosen URL and with an optional user.
export function renderWithProviders(ui, { route = '/', user = null } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider initialUser={user}>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
