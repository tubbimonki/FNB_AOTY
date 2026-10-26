import { useCallback, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../features/auth/authContext';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { loadJSON, removeKey, saveJSON } from '../services/storage';
import { userKey, useStoredState } from './useStoredState';

// Personal data that lives in Postgres once you log in.
// The browser keeps a copy (useStoredState), so pages show at once, guests
// can use everything, and nothing is lost offline. Logged in:
//   on load  - ask the API, send it anything saved offline, use its answer
//   on save  - change the copy at once, then tell the API
// If the API is down the copy keeps working and syncs on the next load.

// Several components can load the same list at once (dashboard widgets):
// they share one request instead of each asking.
const pending = new Map();
function once(key, start) {
  if (!pending.has(key)) pending.set(key, start().finally(() => pending.delete(key)));
  return pending.get(key);
}

// A list of items with ids, e.g. Green Wallet logs.
// path: '/wallet/logs' (GET list, POST one, POST /sync many, DELETE /:id).
// Items the API has confirmed get synced: true; the rest are sent on next load.
export function useSyncedList(key, path) {
  const user = useContext(AuthContext)?.user ?? null;
  const [items, setItems] = useStoredState(key, []);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let ignore = false;
    const stored = loadJSON(userKey(key, { id: userId }), []);
    const local = Array.isArray(stored) ? stored : [];
    const unsent = local.filter((item) => !item.synced);
    const before = new Set(local.map((item) => item.id));
    once(`${path}#${userId}`, () => (unsent.length ? apiPost(`${path}/sync`, { logs: unsent }) : apiGet(path)))
      .then(({ logs }) => {
        if (ignore) return;
        const saved = new Set(logs.map((log) => log.id));
        // The server's list wins, except for logs not sent yet and logs
        // added while we were asking (the answer can't know about those).
        setItems((current) => [
          ...current.filter((item) => !saved.has(item.id) && (!item.synced || !before.has(item.id))),
          ...logs.map((log) => ({ ...log, synced: true })),
        ]);
      })
      .catch(() => {}); // offline or API down: keep the copy
    return () => {
      ignore = true;
    };
  }, [userId, key, path, setItems]);

  const add = useCallback(
    (item) => {
      setItems((current) => [item, ...current]);
      if (!userId) return;
      apiPost(path, item)
        .then(() => setItems((current) => current.map((i) => (i.id === item.id ? { ...i, synced: true } : i))))
        .catch(() => {}); // sent again on the next load
    },
    [userId, path, setItems],
  );

  const remove = useCallback(
    (id) => {
      setItems((current) => current.filter((item) => item.id !== id));
      if (userId) apiDelete(`${path}/${encodeURIComponent(id)}`).catch(() => {});
    },
    [userId, path, setItems],
  );

  return [items, add, remove];
}

// One value per user, e.g. the footprint answers or checklist ticks.
// path: GET -> { value }, PUT { value }. A change that hasn't reached the
// API yet is marked "dirty" and sent on the next load.
export function useSyncedValue(key, path, fallback) {
  const user = useContext(AuthContext)?.user ?? null;
  const [value, setValue] = useStoredState(key, fallback);
  const userId = user?.id;
  const fallbackRef = useRef(fallback); // a [] literal is new every render; keep the first

  useEffect(() => {
    if (!userId) return undefined;
    let ignore = false;
    const fullKey = userKey(key, { id: userId });
    const dirtyKey = `${fullKey}:dirty`;
    const local = loadJSON(fullKey, null);
    const hasLocal = Array.isArray(local) ? local.length > 0 : local !== null;
    once(`${path}#${userId}`, () => apiGet(path))
      .then(({ value: saved }) => {
        if (ignore) return;
        const empty = saved === null || (Array.isArray(saved) && saved.length === 0);
        // Ours is newer (changed offline, or saved before the database existed): send it.
        if (hasLocal && (loadJSON(dirtyKey, false) || empty)) {
          return apiPut(path, { value: local }).then(() => removeKey(dirtyKey));
        }
        setValue(saved ?? fallbackRef.current);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [userId, key, path, setValue]);

  const save = useCallback(
    (next) => {
      setValue(next);
      if (!userId) return;
      const dirtyKey = `${userKey(key, { id: userId })}:dirty`;
      saveJSON(dirtyKey, true);
      apiPut(path, { value: next })
        .then(() => removeKey(dirtyKey))
        .catch(() => {});
    },
    [userId, key, path, setValue],
  );

  return [value, save];
}
