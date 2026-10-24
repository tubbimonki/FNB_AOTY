// One place for talking to the Express API. Every call goes to /api/...,
// which Vite forwards to localhost:4000 in dev (see vite.config.js).
//
// Auth needs nothing per call: the session lives in an httpOnly cookie that
// the browser attaches by itself. `credentials: 'include'` tells fetch to
// send that cookie even if the API ends up on another domain in production.

const BASE = import.meta.env.VITE_API_URL ?? '/api';

// Thrown for any non-2xx answer. `status` lets callers tell 401 from 409 etc.,
// and `message` is the API's { error } text, safe to show to the user.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { body, ...options } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null; // e.g. logout: success, no body
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  return data;
}

export const apiGet = (path) => request(path);
export const apiPost = (path, body) => request(path, { method: 'POST', body });
