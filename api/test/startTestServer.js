import { createApp } from '../app.js';
import { openDatabase } from '../db.js';

export const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

// Starts the API on a random free port with a fresh in-memory database.
// Returns { baseUrl, db, close }.
export async function startTestServer() {
  const db = openDatabase(':memory:');
  const server = createApp({ db, jwtSecret: TEST_SECRET }).listen(0); // 0 = any free port
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
