import { COOKIE_NAME, verifyToken } from '../auth/tokens.js';
import { findUserById, toPublicUser } from '../users.js';

// Reads the session cookie. Returns { user } or { error } (the 401 message).
async function sessionUser(req, { db, jwtSecret }) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return { error: 'Not logged in' };

  // Only verifyToken goes in the try, so a route's own errors aren't mistaken for a bad token.
  let payload;
  try {
    payload = verifyToken(token, jwtSecret);
  } catch {
    return { error: 'Session expired, please log in again' };
  }

  // A valid signature proves we issued the token, not that the account still exists.
  const user = await findUserById(db, Number(payload.sub)); // sub is a string in JWTs
  if (!user || user.email !== payload.email) return { error: 'Not logged in' };
  return { user: toPublicUser(user) }; // never the row: it holds passwordHash
}

// Guards members-only API routes: router.get('/me', requireAuth({ db, jwtSecret }), handler).
// Answers 401, or sets req.user = { id, email, name } and calls next().
export function requireAuth(deps) {
  return async (req, res, next) => {
    const { user, error } = await sessionUser(req, deps);
    if (error) return res.status(401).json({ error });
    req.user = user;
    next();
  };
}

// For public routes that answer a bit more for members (e.g. "you're going").
// Sets req.user when the session is valid, and never answers 401.
export function optionalAuth(deps) {
  return async (req, res, next) => {
    req.user = (await sessionUser(req, deps)).user ?? null;
    next();
  };
}
