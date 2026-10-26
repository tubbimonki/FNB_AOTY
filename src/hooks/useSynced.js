import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../features/auth/authContext';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { loadJSON, removeKey, saveJSON } from '../services/storage';
import { userKey, useStoredState } from './useStoredState';

// Personal data that lives in Postgres once you log in.
// The browser keeps a copy (useStoredState), so pages show at once, guests
// can use everything, and nothing is lost offline. Logged in:
//   on load  - ask the API, send it anything saved or deleted offline, use its answer
//   on save  - change the copy at once, then tell the API
// If the API is down the copy keeps working and syncs on the next load.

// Several components can load the same list at once (dashboard widgets):
// they share one request instead of each asking.
const pending = new Map();
function once(key, start) {
  if (!pending.has(key)) pending.set(key, start().finally(() => pending.delete(key)));
  return pending.get(key);
}

// Ids deleted while the API couldn't be told, kept in "<key>:u<id>:deleted"
// until a DELETE gets through. Without this the server's list would bring
// a deleted log back on the next load.
const deletedKey = (key, userId) => `${userKey(key, { id: userId })}:deleted`;
const loadDeleted = (key, userId) => {
  const ids = loadJSON(deletedKey(key, userId), []);
  return Array.isArray(ids) ? ids : [];
};
function forgetDeleted(key, userId, id) {
  const left = loadDeleted(key, userId).filter((x) => x !== id);
  if (left.length) saveJSON(deletedKey(key, userId), left);
  else removeKey(deletedKey(key, userId));
}
// Tells the API about one delete; the id stays remembered if that fails.
const sendDelete = (key, path, userId, id) =>
  apiDelete(`${path}/${encodeURIComponent(id)}`).then(() => forgetDeleted(key, userId, id));

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
    once(`${path}#${userId}`, async () => {
      // Deletes first, so the list we get back no longer has them.
      await Promise.allSettled(loadDeleted(key, userId).map((id) => sendDelete(key, path, userId, id)));
      return unsent.length ? apiPost(`${path}/sync`, { logs: unsent }) : apiGet(path);
    })
      .then(({ logs }) => {
        if (ignore) return;
        const gone = new Set(loadDeleted(key, userId)); // deletes that still didn't get through
        const fromServer = logs.filter((log) => !gone.has(log.id));
        const saved = new Set(fromServer.map((log) => log.id));
        // The server's list wins, except for logs not sent yet and logs
        // added while we were asking (the answer can't know about those).
        setItems((current) => [
          ...current.filter((item) => !saved.has(item.id) && (!item.synced || !before.has(item.id))),
          ...fromServer.map((log) => ({ ...log, synced: true })),
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
      if (!userId) return;
      saveJSON(deletedKey(key, userId), [...new Set([...loadDeleted(key, userId), id])]);
      sendDelete(key, path, userId, id).catch(() => {}); // tried again on the next load
    },
    [userId, key, path, setItems],
  );

  return [items, add, remove];
}

// One value per user, e.g. the footprint answers or checklist ticks.
// path: GET -> { value }, PUT { value }. A change that hasn't reached the
// API yet is marked "dirty" and sent on the next load.
// Returns [value, save, pending]: pending is true while the API doesn't have
// the latest value yet (on its way, or saved offline).
export function useSyncedValue(key, path, fallback) {
  const user = useContext(AuthContext)?.user ?? null;
  const [value, setValue] = useStoredState(key, fallback);
  const userId = user?.id;
  const fallbackRef = useRef(fallback); // a [] literal is new every render; keep the first
  const [, setSent] = useState(0); // bumped when a PUT lands, so pending is read again
  const dirtyKeyOf = (id) => `${userKey(key, { id })}:dirty`;
  const pending = Boolean(userId) && loadJSON(dirtyKeyOf(userId), false) === true;

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
          saveJSON(dirtyKey, true);
          return apiPut(path, { value: local }).then(() => {
            removeKey(dirtyKey);
            if (!ignore) setSent((n) => n + 1);
          });
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
        .then(() => {
          removeKey(dirtyKey);
          setSent((n) => n + 1);
        })
        .catch(() => {});
    },
    [userId, key, path, setValue],
  );

  return [value, save, pending];
}
