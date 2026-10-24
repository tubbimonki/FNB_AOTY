// One place for talking to the Express API. Every call goes to /api/...,
// which Vite forwards to localhost:4000 in dev (see vite.config.js).
//
// When auth lands, attach the token here (e.g. an Authorization header)
// so no component has to think about it.

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const apiGet = (path) => request(path);
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: JSON.stringify(body) });
