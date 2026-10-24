import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../services/api';
import { AuthContext } from './authContext';

// Real auth, backed by the Express API (api/routes/auth.js).
//
// The session token is in an httpOnly cookie, so this code can never read it.
// Instead it asks the API "who am I?" (GET /auth/me) once on page load, and
// keeps the answer in `user`. Login, register and logout each call the API,
// which sets or clears the cookie, then update `user` to match.
//
// status: 'loading' until that first check answers, then 'ready'.
// RequireAuth waits for 'ready' so a logged-in user isn't bounced to /login
// for a split second on refresh.
//
// initialUser (tests only): skip the check and start as this user (or null).

export function AuthProvider({ children, initialUser }) {
  const skipCheck = initialUser !== undefined;
  const [user, setUser] = useState(initialUser ?? null);
  const [status, setStatus] = useState(skipCheck ? 'ready' : 'loading');

  useEffect(() => {
    if (skipCheck) return undefined;
    let cancelled = false; // ignore the answer if the component unmounted meanwhile

    apiGet('/auth/me')
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && setUser(null)) // 401 or API down: treat as logged out
      .finally(() => !cancelled && setStatus('ready'));

    return () => {
      cancelled = true;
    };
  }, [skipCheck]);

  // Each throws an ApiError on failure (wrong password, email taken...),
  // so the form that called it can show error.message.
  const login = async ({ email, password }) => {
    const data = await apiPost('/auth/login', { email, password });
    setUser(data.user);
  };

  const register = async ({ name, email, password }) => {
    const data = await apiPost('/auth/register', { name, email, password });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiPost('/auth/logout');
    } finally {
      setUser(null); // log out locally even if the request failed
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
