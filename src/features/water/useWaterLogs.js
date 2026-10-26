import { useSyncedList } from '../../hooks/useSynced';

export const WATER_KEY = 'water:logs';

// Water logs, saved like Green Wallet's useLogs (Postgres when logged in,
// /api/eco/water/logs). Each log is { id, date, use, litres }.
export function useWaterLogs() {
  const [logs, add, remove] = useSyncedList(WATER_KEY, '/eco/water/logs');

  const addWater = (use, litres, date) => add({ id: crypto.randomUUID(), date, use, litres });

  return { logs, addWater, removeWater: remove };
}
