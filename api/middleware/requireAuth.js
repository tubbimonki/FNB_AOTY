import { COOKIE_NAME, verifyToken } from '../auth/tokens.js';
import { findUserById, toPublicUser } from '../users.js';

// Guards members-only API routes: router.get('/me', requireAuth({ db, jwtSecret }), handler).
// Answers 401, or sets req.user = { id, email, name } and calls next().
export function requireAuth({ db, jwtSecret }) {
  return async (req, res, next) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not logged in' });

    // Only verifyToken goes in the try, so a route's own errors aren't mistaken for a bad token.
    let payload;
    try {
      payload = verifyToken(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }

    // A valid signature proves we issued the token, not that the account still exists.
    const user = await findUserById(db, Number(payload.sub)); // sub is a string in JWTs
    if (!user || user.email !== payload.email) return res.status(401).json({ error: 'Not logged in' });

    req.user = toPublicUser(user); // never the row: it holds passwordHash
    next();
  };
}
