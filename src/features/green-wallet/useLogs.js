import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '../../services/storage';

const STORAGE_KEY = 'green-wallet:logs';

// The user's logged actions, saved in localStorage so they survive a refresh.
// Each log is { id, actionId, date }. Later this can sync with the API instead.
export function useLogs() {
  const [logs, setLogs] = useState(() => loadJSON(STORAGE_KEY, []));

  useEffect(() => {
    saveJSON(STORAGE_KEY, logs);
  }, [logs]);

  const addLog = (actionId, date) => {
    setLogs((current) => [{ id: crypto.randomUUID(), actionId, date }, ...current]);
  };

  const removeLog = (id) => {
    setLogs((current) => current.filter((log) => log.id !== id));
  };

  return { logs, addLog, removeLog };
}
