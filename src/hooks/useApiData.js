import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../services/api';

// GET one API path and keep the answer in state.
// Returns { status: 'loading' | 'ready' | 'error', data, retry }.
// Same "key" trick as useWeather: an answer for an older path or attempt is ignored.
export function useApiData(path) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, status: 'loading', data: null });
  const key = `${path}#${attempt}`;

  useEffect(() => {
    let ignore = false;
    apiGet(path)
      .then((data) => !ignore && setResult({ key, status: 'ready', data }))
      .catch(() => !ignore && setResult({ key, status: 'error', data: null }));
    return () => {
      ignore = true;
    };
  }, [key, path]);

  const current = result.key === key;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { status: current ? result.status : 'loading', data: current ? result.data : null, retry };
}
