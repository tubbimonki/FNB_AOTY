import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { useAuth } from '../auth/useAuth';

const NONE = { awards: [], premiumUntil: null };

// Rewards the server gave this user (e.g. for going to an event), from
// GET /api/impact/awards. Visitors and failed requests get none.
export function useAwards() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState({ userId: null, ...NONE });

  useEffect(() => {
    if (userId === null) return;
    let ignore = false;
    apiGet('/impact/awards')
      // premiumUntil only while it's still running.
      .then((data) => {
        const active = data.premiumUntil && new Date(data.premiumUntil) > new Date();
        if (!ignore) setResult({ userId, awards: data.awards, premiumUntil: active ? data.premiumUntil : null });
      })
      .catch(() => {}); // no awards is fine
    return () => {
      ignore = true;
    };
  }, [userId]);

  return result.userId === userId && userId !== null ? result : NONE;
}
