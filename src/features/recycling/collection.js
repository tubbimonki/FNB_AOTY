import { addDays, today } from '../green-wallet/totals';

// localStorage key for the chosen collection day (0 = Sunday).
export const COLLECTION_KEY = 'recycling:weekday';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The next date (today included) that falls on `weekday` (0 = Sunday).
export function nextCollection(weekday, from = today()) {
  const [y, m, d] = from.split('-').map(Number);
  const todayIndex = new Date(y, m - 1, d).getDay();
  return addDays(from, (weekday - todayIndex + 7) % 7);
}
