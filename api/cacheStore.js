import { eq, lt } from 'drizzle-orm';
import { apiCache } from './schema.js';

const KEEP_MS = 7 * 24 * 60 * 60 * 1000; // rows older than a week are deleted

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
          await db.delete(apiCache).where(lt(apiCache.fetchedAt, new Date(Date.now() - KEEP_MS)));
        }
      } catch (err) {
        console.error('api_cache write:', err.message);
      }
    },
  };
}
