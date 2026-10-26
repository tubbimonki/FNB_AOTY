// One small in-memory cache for upstream APIs (EskomSePush, Overpass).
// - fresh: answer from memory without asking upstream
// - shared: visitors arriving together wait on one upstream call
// - stale: if upstream fails, an old answer beats none
// - cooldown: after a failure, don't ask again for a while (saves quota)
// - store (optional): api/cacheStore.js, the api_cache table, so answers
//   survive a restart. Keys there get the name in front, e.g. "eskom:...".
// weather.js has the same idea written out by hand.

export class Unavailable extends Error {}

export function createCache({ staleMs, cooldownMs, maxKeys = 200, now = Date.now, store = null, name = 'cache' }) {
  const entries = new Map(); // key -> { value, fetchedAt }, oldest first
  const inFlight = new Map(); // key -> Promise
  const failures = new Map(); // key -> { at, message }

  function remember(key, value, fetchedAt = now()) {
    const entry = { value, fetchedAt };
    entries.delete(key); // re-insert so Map order = oldest first
    entries.set(key, entry);
    if (entries.size > maxKeys) entries.delete(entries.keys().next().value);
    return entry;
  }

  // After a restart memory is empty, so look in the table once per key.
  const checked = new Set();
  async function fromStore(key) {
    if (!store || entries.has(key) || checked.has(key)) return;
    if (checked.size > maxKeys * 5) checked.clear();
    checked.add(key);
    const saved = await store.load(`${name}:${key}`);
    if (saved && !entries.has(key)) remember(key, saved.value, saved.fetchedAt);
  }

  async function fetchAndKeep(key, load) {
    const entry = remember(key, await load());
    await store?.save(`${name}:${key}`, entry);
    return entry;
  }

  // load() calls upstream and returns the value to keep.
  async function get(key, freshMs, load) {
    await fromStore(key);
    const hit = entries.get(key);
    const age = hit ? now() - hit.fetchedAt : Infinity;
    if (age < freshMs) return { ...hit, stale: false };

    const failed = failures.get(key);
    const coolingDown = failed && now() - failed.at < cooldownMs;
    if (!coolingDown && !inFlight.has(key)) {
      inFlight.set(key, fetchAndKeep(key, load).finally(() => inFlight.delete(key)));
    }
    try {
      if (coolingDown && !inFlight.has(key)) throw new Error(failed.message);
      const entry = await inFlight.get(key);
      failures.delete(key);
      return { ...entry, stale: false };
    } catch (err) {
      if (!coolingDown) failures.set(key, { at: now(), message: err.message });
      if (age < staleMs) return { ...hit, stale: true };
      throw new Unavailable(err.message);
    }
  }

  return { get };
}
