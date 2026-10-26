import { sql } from 'drizzle-orm';
import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

export const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

// One in-memory PGlite per test file (starting one takes a few seconds), with
// every table emptied before each server, so each test starts fresh.
// TEST_DATABASE_URL=postgres://... runs the same tests on a real Postgres.
let shared;
export async function testDatabase() {
  shared ??= openDatabase({ url: process.env.TEST_DATABASE_URL, dir: ':memory:' });
  const db = await shared;
  const { rows } = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tables = rows.map((r) => `"${r.tablename}"`).join(', ');
  // RESTART IDENTITY sets the id counters back to 1, like a new database.
  if (tables) await db.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
  return db;
}

// Starts the API on a random free port with an empty database.
// Options go to createApp (e.g. { weather } for a fake weather service,
// trustProxy, staticDir). Returns { baseUrl, db, close }.
// The extra alert sources and news feeds are off unless a test passes its
// own, so tests never call SAWS or RSS feeds.
// Pass { db } to reuse a database as is (e.g. to test a restart).
export async function startTestServer(options = {}) {
  const db = options.db ?? (await testDatabase());
  const server = createApp({ db, jwtSecret: TEST_SECRET, saws: null, airQuality: null, news: null, ...options }).listen(0); // 0 = any free port
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    baseUrl: `http://localhost:${server.address().port}`,
    db,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// A tiny "browser": remembers the session cookie between requests,
// the way a real browser would.
export function createClient(baseUrl) {
  let cookie = null;
  return {
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      cookie = value;
    },
    async request(method, path, body) {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(cookie && { Cookie: cookie }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = res.headers.getSetCookie()[0];
      if (setCookie) cookie = setCookie.split(';')[0]; // keep just "session=..."
      const text = await res.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text; // not JSON, keep the raw text
      }
      return { status: res.status, body: parsed, setCookie };
    },
  };
}
