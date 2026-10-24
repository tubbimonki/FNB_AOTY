import { useState } from 'react';
import { AuthContext } from './authContext';

// PLACEHOLDER AUTH. No real provider is wired in yet.
//
// The rest of the app only ever uses `useAuth()` and gets back
// { user, login, logout } (see useAuth.js). To plug in a real provider (Firebase, Supabase,
// Auth0, Clerk, or your own Express + JWT), replace the bodies of login/logout
// below and load the current user on startup. Nothing else should need to change.
//
// `user` is null when logged out, or an object like { id, name, email }.

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);

  // TODO(auth): call the real provider here.
  const login = async ({ name }) => {
    setUser({ id: 'demo-user', name: name || 'Demo user' });
  };

  // TODO(auth): call the real provider here.
  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

