// A tiny in-process event bus: modules announce what happened (emit) and
// other modules react (on), without importing each other's code.
// emit waits for every listener, so when a request answers, the points are
// already saved. A failing listener gets one more try (a dropped database
// connection usually works the second time), then it is logged and the
// request carries on. So every listener must be safe to run twice: insert
// with onConflictDoNothing, delete by key, never "add 5 to a counter".
//
//   bus.on('event.attended', async ({ userId, eventId }) => { ... });
//   await bus.emit('event.attended', { userId, eventId });
export function createBus({ retryMs = 200, log = console.error } = {}) {
  const listeners = new Map(); // name -> [fn]

  const run = async (name, fn, payload) => {
    try {
      await fn(payload);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, retryMs));
      try {
        await fn(payload);
      } catch (err) {
        log(`Listener for ${name} failed twice:`, err);
      }
    }
  };

  return {
    on(name, fn) {
      listeners.set(name, [...(listeners.get(name) ?? []), fn]);
    },
    async emit(name, payload) {
      await Promise.all((listeners.get(name) ?? []).map((fn) => run(name, fn, payload)));
    },
  };
}
