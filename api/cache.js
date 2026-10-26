// One small in-memory cache for upstream APIs (EskomSePush, Overpass).
// - fresh: answer from memory without asking upstream
// - shared: visitors arriving together wait on one upstream call
// - stale: if upstream fails, an old answer beats none
// - cooldown: after a failure, don't ask again for a while (saves quota)
// - store (optional): api/cacheStore.js, the api_cache table, so answers
//   survive a restart. Keys there get the name in front, e.g. "eskom:...".
//   Before asking upstream we look in the table too: another server on the
//   same database (your PC and Render on Neon) may have just fetched it,
//   and sharing that answer saves quota (EskomSePush allows 50 calls a day).
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

  // Takes the table's answer when it is newer than ours (or we have none,
  // e.g. after a restart).
  async function fromStore(key) {
    if (!store) return;
    const saved = await store.load(`${name}:${key}`);
    const hit = entries.get(key);
    if (saved && (!hit || saved.fetchedAt > hit.fetchedAt)) remember(key, saved.value, saved.fetchedAt);
  }

  const ageOf = (key) => {
    const hit = entries.get(key);
    return hit ? now() - hit.fetchedAt : Infinity;
  };

  async function fetchAndKeep(key, load) {
    const entry = remember(key, await load());
    await store?.save(`${name}:${key}`, entry);
    return entry;
  }

  // load() calls upstream and returns the value to keep.
  async function get(key, freshMs, load) {
    if (ageOf(key) < freshMs) return { ...entries.get(key), stale: false };
    // Too old in memory: check the table before spending an upstream call.
    if (!inFlight.has(key)) await fromStore(key);
    const hit = entries.get(key);
    const age = ageOf(key);
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
