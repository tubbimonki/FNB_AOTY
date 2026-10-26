import { addDays, today } from '../green-wallet/totals';
import { useSyncedValue } from '../../hooks/useSynced';

const COLLECTION_KEY = 'recycling:weekday';
const TUESDAY = 2;

// Your collection day (0 = Sunday): [weekday, setWeekday].
// Saved in this browser, and for members also in Postgres
// (/api/eco/prefs/recyclingDay), so it follows you to another device.
export function useCollectionDay() {
  const [weekday, setWeekday] = useSyncedValue(COLLECTION_KEY, '/eco/prefs/recyclingDay', TUESDAY);
  return [weekday ?? TUESDAY, setWeekday];
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The next date (today included) that falls on `weekday` (0 = Sunday).
export function nextCollection(weekday, from = today()) {
  const [y, m, d] = from.split('-').map(Number);
  const todayIndex = new Date(y, m - 1, d).getDay();
  return addDays(from, (weekday - todayIndex + 7) % 7);
}
