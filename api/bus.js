// A tiny in-process event bus: modules announce what happened (emit) and
// other modules react (on), without importing each other's code.
// emit waits for every listener, so when a request answers, the points are
// already saved. A failing listener is logged and doesn't break the request.
//
//   bus.on('event.attended', async ({ userId, eventId }) => { ... });
//   await bus.emit('event.attended', { userId, eventId });
export function createBus() {
  const listeners = new Map(); // name -> [fn]

  return {
    on(name, fn) {
      listeners.set(name, [...(listeners.get(name) ?? []), fn]);
    },
    async emit(name, payload) {
      const results = await Promise.allSettled((listeners.get(name) ?? []).map((fn) => fn(payload)));
      for (const r of results) if (r.status === 'rejected') console.error(`Listener for ${name} failed:`, r.reason);
    },
  };
}
