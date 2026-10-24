import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

// Asks the Express API if it's running. Returns 'checking...', 'ok' or an offline message.
export function useApiHealth() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    let cancelled = false;
    apiGet('/health')
      .then((data) => !cancelled && setStatus(data.status))
      .catch(() => !cancelled && setStatus('offline (run npm run api)'));
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
