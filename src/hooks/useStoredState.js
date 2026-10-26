import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '../features/auth/authContext';
import { loadJSON, saveJSON } from '../services/storage';

// Personal data kept in localStorage, one copy per account, so the next
// person to log in on the same phone doesn't see your logs.
// Guests use the plain key; logged-in users get "<key>:u<id>".
export const userKey = (key, user) => (user ? `${key}:u${user.id}` : key);

// Like useState, but saved under the current user's key. When the user
// changes (log in or out) it reloads that user's copy.
export function useStoredState(key, fallback) {
  const user = useContext(AuthContext)?.user ?? null;
  const fullKey = userKey(key, user);
  const [state, setState] = useState(() => ({ key: fullKey, value: load(fullKey, key, fallback) }));

  // Switched user: read their copy (setState during render is React's
  // recommended way to reset state from a changed prop).
  if (state.key !== fullKey) setState({ key: fullKey, value: load(fullKey, key, fallback) });

  const setValue = useCallback((next) => {
    setState((current) => {
      const value = typeof next === 'function' ? next(current.value) : next;
      saveJSON(current.key, value);
      return { key: current.key, value };
    });
  }, []);

  return [state.key === fullKey ? state.value : load(fullKey, key, fallback), setValue];
}

// A stored value of the wrong shape (an old version, hand edits) falls back
// instead of crashing the page.
function load(fullKey, key, fallback) {
  const value = loadJSON(fullKey, undefined) ?? (fullKey === key ? undefined : adoptGuestCopy(fullKey, key));
  if (value === undefined) return fallback;
  if (Array.isArray(fallback) !== Array.isArray(value)) return fallback;
  return value;
}

// Data saved before this change sat under the plain key. The first account
// to log in on this device takes it over, then the plain copy is removed.
function adoptGuestCopy(fullKey, key) {
  const value = loadJSON(key, undefined);
  if (value === undefined) return undefined;
  saveJSON(fullKey, value);
  try {
    localStorage.removeItem(key);
  } catch {
    // storage blocked: keep going
  }
  return value;
}
