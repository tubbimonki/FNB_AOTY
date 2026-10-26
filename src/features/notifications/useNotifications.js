import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { useAuth } from '../auth/useAuth';
import { useStoredState } from '../../hooks/useStoredState';

const REFRESH_MS = 5 * 60 * 1000;

// The bell's messages from GET /api/notifications (badges, RSVPs, power
// changes, severe alerts for `place`), asked again every 5 minutes.
// What's unread is kept in this browser: anything newer than the last time
// you opened the bell. markSeen() is called when you open it.
export function useNotifications(place = '') {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [seenAt, setSeenAt] = useStoredState('notifications:seenAt', 0);

  useEffect(() => {
    let ignore = false;
    const load = () =>
      apiGet(`/notifications?place=${encodeURIComponent(place)}`)
        .then((data) => !ignore && setItems(data.items))
        .catch(() => {}); // offline: keep what we have
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [place, user?.id]);

  const unread = items.filter((n) => Date.parse(n.createdAt) > seenAt).length;
  const markSeen = () => setSeenAt(Date.now());
  return { items, unread, markSeen };
}
