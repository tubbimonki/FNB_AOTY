import { useSyncedValue } from '../../hooks/useSynced';
import { CHECKLIST } from './checklist';

const CHECKLIST_KEY = 'alerts:checklist';

// Which checklist items are ticked, as a list of ids. Saved in Postgres
// when logged in (/api/alerts/checklist), and in this browser.
export function useChecklist() {
  const [done, setDone, pending] = useSyncedValue(CHECKLIST_KEY, '/alerts/checklist', []);

  const toggle = (id) => setDone(done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);

  // Ignore ids of items that were removed from CHECKLIST.
  const doneCount = CHECKLIST.filter((item) => done.includes(item.id)).length;
  // pending: the API doesn't have the latest ticks yet.
  return { done, toggle, doneCount, total: CHECKLIST.length, pending };
}
