import { vi } from 'vitest';

// Fakes the Express API in UI tests by replacing fetch.
// Pass answers keyed by "METHOD /path"; each is [status, body] or a list of
// them, used in order for repeated calls. Anything unlisted fails like a
// network error (the same as the default in setup.js).
//
//   mockApi({
//     'GET /api/auth/me': [401, { error: 'Not logged in' }],
//     'POST /api/auth/login': [200, { user }],
//   });
export function mockApi(routes) {
  const queues = Object.fromEntries(
    Object.entries(routes).map(([key, answer]) => [
      key,
      Array.isArray(answer[0]) ? [...answer] : [answer],
    ]),
  );

  vi.mocked(fetch).mockImplementation(async (url, options = {}) => {
    const queue = queues[`${options.method ?? 'GET'} ${url}`];
    if (!queue?.length) throw new Error(`no mock for ${options.method ?? 'GET'} ${url}`);
    const [status, body] = queue.length > 1 ? queue.shift() : queue[0];
    return status === 204
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
  });
}

// The body that was sent with the last call to `url`, parsed from JSON.
export function lastBodySentTo(url) {
  const call = vi.mocked(fetch).mock.calls.findLast(([calledUrl]) => calledUrl === url);
  return call && JSON.parse(call[1].body);
}
