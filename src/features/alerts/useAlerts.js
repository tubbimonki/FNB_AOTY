import { useApiData } from '../../hooks/useApiData';
import { weatherAlerts } from '../weather/weather';

const RANK = { severe: 0, warning: 1, info: 2 };
const bySeverity = (a, b) => (RANK[a.severity] ?? 3) - (RANK[b.severity] ?? 3);

// Every alert for the chosen place, most serious first, from our API
// (weather, power, air quality and SAWS, see api/modules/alerts).
// Until it answers, or if it's down, the forecast warnings are worked out
// right here from the weather we already have, so the page is never empty.
// -> { alerts, sample, sources, apiStatus, retry }
export function useAlerts({ weather, place }) {
  const api = useApiData(`/alerts?lat=${place.lat}&lon=${place.lon}&place=${encodeURIComponent(place.name)}`);
  if (api.status === 'ready') {
    return { alerts: [...(api.data.alerts ?? [])].sort(bySeverity), sample: Boolean(api.data.sample), sources: api.data.sources ?? null, apiStatus: 'ready', retry: api.retry };
  }
  return { alerts: weatherAlerts(weather, place.name).sort(bySeverity), sample: false, sources: null, apiStatus: api.status, retry: api.retry };
}
