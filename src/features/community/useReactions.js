import { useState } from 'react';
import { useApiData } from '../../hooks/useApiData';
import { apiPost } from '../../services/api';
import { seedReactionCounts } from '../../../shared/reactions.js';

// Reaction counts for every event, for the carousel and lists.
// countsFor(id) falls back to the demo counts if nobody reacted yet or the API is down.
export function useReactionSummary() {
  const { data } = useApiData('/reactions/events');
  const all = data?.reactions ?? {};
  return {
    countsFor: (id) => all[id]?.counts ?? seedReactionCounts(id),
    mineFor: (id) => all[id]?.mine ?? [],
  };
}

// One event's reactions plus toggle(reaction). The server's answer replaces
// the counts, so they stay right even if two people tap at once.
export function useEventReactions(eventId) {
  const { data } = useApiData(`/reactions/events/${eventId}`);
  const [changed, setChanged] = useState(null); // { eventId, data } after a tap
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = changed?.eventId === eventId ? changed.data : data;

  const toggle = async (reaction) => {
    setBusy(true);
    setError('');
    try {
      setChanged({ eventId, data: await apiPost(`/reactions/events/${eventId}`, { reaction }) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return {
    counts: current?.counts ?? seedReactionCounts(eventId),
    mine: current?.mine ?? [],
    busy,
    error,
    toggle,
  };
}
