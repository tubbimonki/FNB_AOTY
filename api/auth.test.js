// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signToken } from './auth/tokens.js';
import { createClient, startTestServer, TEST_SECRET } from './test/startTestServer.js';
import { users } from './schema.js';

const tubbi = { name: 'tubbi', email: 'tubbi@example.com', password: 'correct horse battery' };

let api;
let client;

beforeEach(async () => {
  api = await startTestServer();
  client = createClient(api.baseUrl);
});

afterEach(() => api.close());

describe('POST /api/auth/register', () => {
  it('creates the user, logs them in, and never returns the hash', async () => {
    const res = await client.request('POST', '/api/auth/register', tubbi);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: 1, name: 'tubbi', email: 'tubbi@example.com' });
    expect(res.setCookie).toMatch(/^session=/);
    expect(res.setCookie).toMatch(/HttpOnly/i);
    expect(res.setCookie).toMatch(/SameSite=Lax/i);
  });

  it('stores a bcrypt hash, not the password', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const [row] = await api.db.select().from(users);

    expect(row.passwordHash).not.toContain(tubbi.password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$\d\d\$/);
  });

  it('treats emails case-insensitively', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const res = await client.request('POST', '/api/auth/register', {
      ...tubbi,
      email: '  tubbi@Example.com ',
    });
    expect(res.status).toBe(409);
  });

  it.each([
    [{ ...tubbi, name: '' }, 'Name is required'],
    [{ ...tubbi, email: 'not-an-email' }, 'Enter a valid email address'],
    [{ ...tubbi, password: 'short' }, 'Password must be at least 8 characters'],
    [{ ...tubbi, password: 'x'.repeat(73) }, 'Password is too long'],
  ])('rejects bad input %#', async (body, error) => {
    const res = await client.request('POST', '/api/auth/register', body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(error);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createClient(api.baseUrl).request('POST', '/api/auth/register', tubbi);
  });

  it('logs in with the right password and sets the cookie', async () => {
    const res = await client.request('POST', '/api/auth/login', {
      email: tubbi.email,
      password: tubbi.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(tubbi.email);
    expect(res.setCookie).toMatch(/^session=/);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const wrongPassword = await client.request('POST', '/api/auth/login', {
      email: tubbi.email,
      password: 'wrong password',
    });
    const unknownEmail = await client.request('POST', '/api/auth/login', {
      email: 'nobody@example.com',
      password: 'wrong password',
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(client.cookie).toBeNull();
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const res = await client.request('POST', '/api/auth/logout');

    expect(res.status).toBe(204);
    expect(res.setCookie).toMatch(/^session=;/);
    expect(res.setCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('GET /api/auth/me (requireAuth)', () => {
  it('returns the user for a valid session cookie', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const res = await client.request('GET', '/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 1, name: 'tubbi', email: tubbi.email } });
  });

  it('returns 401 with no cookie', async () => {
    const res = await client.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('refuses a copy of the cookie after logout (the token is revoked)', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const copy = createClient(api.baseUrl);
    copy.cookie = client.cookie; // e.g. another tab, or a stolen cookie
    expect((await copy.request('GET', '/api/auth/me')).status).toBe(200);

    await client.request('POST', '/api/auth/logout');
    const res = await copy.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/log in again/);
  });

  it('keeps other sessions of the same account working after one logs out', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const phone = createClient(api.baseUrl);
    await phone.request('POST', '/api/auth/login', { email: tubbi.email, password: tubbi.password });

    await client.request('POST', '/api/auth/logout');
    expect((await phone.request('GET', '/api/auth/me')).status).toBe(200);
  });

  it('logs out fine with no cookie or a junk one', async () => {
    expect((await client.request('POST', '/api/auth/logout')).status).toBe(204);
    client.cookie = 'session=not-a-token';
    expect((await client.request('POST', '/api/auth/logout')).status).toBe(204);
  });

  it('returns 401 after logout', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    await client.request('POST', '/api/auth/logout');
    const res = await client.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret (forgery)', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    client.cookie = `session=${signToken(1, 'attacker-guessed-this-secret-value-xx')}`;
    const res = await client.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a token whose payload was edited', async () => {
    await client.request('POST', '/api/auth/register', tubbi);
    const [header, , signature] = client.cookie.replace('session=', '').split('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: '2' })).toString('base64url');
    client.cookie = `session=${header}.${fakePayload}.${signature}`;
    const res = await client.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a valid token for a user that no longer exists', async () => {
    client.cookie = `session=${signToken(999, TEST_SECRET)}`;
    const res = await client.request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('rate limiting', () => {
  it('blocks the 11th login attempt within 15 minutes', async () => {
    const attempt = () =>
      client.request('POST', '/api/auth/login', { email: tubbi.email, password: 'guess' });

    for (let i = 0; i < 10; i += 1) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    // Same { error } shape as every other route, so the login form can show it.
    expect(blocked.body.error).toMatch(/too many/i);
  });
});
