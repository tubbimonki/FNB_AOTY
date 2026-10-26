import { useState } from 'react';
import { useApiData } from '../../hooks/useApiData';
import { apiDelete, apiPost } from '../../services/api';
import { offlineEvents } from '../../../shared/events.js';

// All events from GET /api/events. If the API is down, the bundled list
// (shared/events.js) still shows, with offline: true so Attend can be switched off.
export function useEvents() {
  const { status, data } = useApiData('/events');
  if (status === 'error') return { status: 'ready', events: offlineEvents(), offline: true };
  return { status, events: data?.events ?? [], offline: false };
}

// One event plus attend() / cancel(). The server's answer replaces the
// event, so the count and the attendees list update straight away.
export function useEvent(id) {
  const { status, data, retry } = useApiData(`/events/${id}`);
  const [changed, setChanged] = useState(null); // { id, event } after attend/cancel
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const offline = status === 'error';
  const fromApi = changed?.id === id ? changed.event : data?.event;
  const event = offline ? offlineEvents().find((e) => e.id === id) : fromApi;

  const send = async (request) => {
    setSaving(true);
    setError('');
    try {
      const answer = await request(`/events/${id}/attend`);
      setChanged({ id, event: answer.event });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    status: offline ? (event ? 'ready' : 'missing') : status,
    event,
    offline,
    retry,
    saving,
    error,
    attend: () => send(apiPost),
    cancel: () => send(apiDelete),
  };
}
