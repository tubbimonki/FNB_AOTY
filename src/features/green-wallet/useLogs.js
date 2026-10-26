import { useSyncedList } from '../../hooks/useSynced';

const STORAGE_KEY = 'green-wallet:logs';

// The user's logged actions: in Postgres when logged in (/api/wallet/logs),
// with a copy in this browser so it works offline and for guests.
// Each log is { id, actionId, date }.
export function useLogs() {
  const [logs, add, remove] = useSyncedList(STORAGE_KEY, '/wallet/logs');

  const addLog = (actionId, date) => add({ id: crypto.randomUUID(), actionId, date });

  return { logs, addLog, removeLog: remove };
}
