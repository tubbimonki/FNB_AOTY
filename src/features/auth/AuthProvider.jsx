import { useEffect, useState } from 'react';
import { apiGet, apiPost, SESSION_ENDED } from '../../services/api';
import { AuthContext } from './authContext';

// Auth state, backed by /api/auth. The token is an httpOnly cookie this code
// can't read, so on load it asks GET /auth/me and keeps the answer in `user`.
// status: 'loading' until that answer, then 'ready'. initialUser is for tests.
export function AuthProvider({ children, initialUser }) {
  const skipCheck = initialUser !== undefined;
  const [user, setUser] = useState(initialUser ?? null);
  const [status, setStatus] = useState(skipCheck ? 'ready' : 'loading');

  useEffect(() => {
    if (skipCheck) return undefined;
    let cancelled = false; // ignore the answer if we unmounted meanwhile

    apiGet('/auth/me')
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && setUser(null)) // 401 or API down: treat as logged out
      .finally(() => !cancelled && setStatus('ready'));

    return () => {
      cancelled = true;
    };
  }, [skipCheck]);

  // The API said our session is over (see SESSION_ENDED in services/api.js).
  useEffect(() => {
    const ended = () => setUser(null);
    window.addEventListener(SESSION_ENDED, ended);
    return () => window.removeEventListener(SESSION_ENDED, ended);
  }, []);

  // Each throws an ApiError on failure, so the form can show error.message.
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
