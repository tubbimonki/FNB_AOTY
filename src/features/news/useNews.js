import { useApiData } from '../../hooks/useApiData';
import { newsItems } from './newsItems';

// Live news from our API, or the bundled real stories while it loads or if it fails.
// source: 'live' | 'stale' | 'snapshot' | 'loading'
export function useNews() {
  const { status, data } = useApiData('/news');
  const items = data?.items?.length ? data.items : newsItems;
  const source = status === 'ready' ? data.source : status === 'error' ? 'snapshot' : 'loading';
  return { items, source };
}
