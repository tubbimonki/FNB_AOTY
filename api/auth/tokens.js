import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// The token says "user <id> with this email, valid until <exp>", signed with the secret.
// The email matters on Render: its disk is wiped on restart, so ids start again
// at 1 and an old token must not log in as the new user 1.
export function signToken(user, secret) {
  return jwt.sign({ sub: String(user.id), email: user.email }, secret, {
    algorithm: 'HS256',
    expiresIn: MAX_AGE_SECONDS,
  });
}

// Returns the payload or throws if the token is expired, tampered with, or
// signed with another secret. Pinning the algorithm blocks forged "alg: none" tokens.
export function verifyToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

// httpOnly: JS can't read it. secure: HTTPS only (production).
// sameSite lax: not sent on cross-site POSTs (blocks CSRF).
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(res, user, secret) {
  res.cookie(COOKIE_NAME, signToken(user, secret), {
    ...cookieOptions(),
    maxAge: MAX_AGE_SECONDS * 1000, // Express wants milliseconds
  });
}

export function clearSessionCookie(res) {
  // The browser only deletes a cookie whose path/flags match the one it holds.
  res.clearCookie(COOKIE_NAME, cookieOptions());
}
