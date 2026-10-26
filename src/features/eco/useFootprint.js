import { useSyncedValue } from '../../hooks/useSynced';
import { estimateFootprint } from '../../../shared/footprint';

export const FOOTPRINT_KEY = 'eco:footprint';

// The last saved questionnaire: { answers, total, savedAt } or null.
// Saved in Postgres when logged in (/api/eco/footprint/mine).
export function useFootprint() {
  const [saved, setSaved, pending] = useSyncedValue(FOOTPRINT_KEY, '/eco/footprint/mine', null);

  const save = (answers) => {
    setSaved({ answers, total: estimateFootprint(answers).total, savedAt: Date.now() });
  };

  return { saved, save, pending }; // pending: not in the database yet
}
