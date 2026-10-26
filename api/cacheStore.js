import { and, eq, lt, notLike } from 'drizzle-orm';
import { apiCache } from './schema.js';

const DAY = 24 * 60 * 60 * 1000;
const KEEP_MS = 7 * DAY; // rows older than a week are deleted...
const KEEP_FACILITIES_MS = 30 * DAY; // ...except facilities, which rarely move

// The api_cache table as a second layer under api/cache.js: memory answers
// first, this table survives a restart (Render restarts the app often).
// Failures here are logged and ignored: the cache must never break a page.
export function createCacheStore(db) {
  let lastSweep = 0;

  return {
    async load(key) {
      try {
        const [row] = await db.select().from(apiCache).where(eq(apiCache.key, key)).limit(1);
        return row ? { value: row.value, fetchedAt: row.fetchedAt.getTime() } : null;
      } catch (err) {
        console.error('api_cache read:', err.message);
        return null;
      }
    },

    async save(key, { value, fetchedAt }) {
      try {
        const row = { key, value, fetchedAt: new Date(fetchedAt) };
        // Upsert: insert, or overwrite the row that has this key.
        await db.insert(apiCache).values(row).onConflictDoUpdate({ target: apiCache.key, set: row });
        if (Date.now() - lastSweep > 60 * 60 * 1000) {
          lastSweep = Date.now();
          const before = (ms) => lt(apiCache.fetchedAt, new Date(Date.now() - ms));
          await db.delete(apiCache).where(and(before(KEEP_MS), notLike(apiCache.key, 'facilities:%')));
          await db.delete(apiCache).where(before(KEEP_FACILITIES_MS));
        }
      } catch (err) {
        console.error('api_cache write:', err.message);
      }
    },
  };
}
