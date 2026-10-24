import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// The token says "user <id>, valid until <exp>", signed with the secret.
// Anyone can read the payload; only the server can produce a valid signature.
export function signToken(userId, secret) {
  return jwt.sign({ sub: String(userId) }, secret, {
    algorithm: 'HS256',
    expiresIn: MAX_AGE_SECONDS,
  });
}

// Returns the payload ({ sub, iat, exp }) or THROWS if the token is expired,
// tampered with, or signed with another secret. Pinning algorithms stops a
// forged token that claims "alg: none" from being accepted.
export function verifyToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

// httpOnly: page JavaScript can't read it (XSS can't steal it).
// secure: only sent over HTTPS (production only; localhost is plain HTTP).
// sameSite lax: not sent on cross-site POSTs (blocks CSRF).
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(res, userId, secret) {
  res.cookie(COOKIE_NAME, signToken(userId, secret), {
    ...cookieOptions(),
    maxAge: MAX_AGE_SECONDS * 1000, // Express wants milliseconds here
  });
}

export function clearSessionCookie(res) {
  // The browser only deletes a cookie whose path/flags match the one it holds.
  res.clearCookie(COOKIE_NAME, cookieOptions());
}
