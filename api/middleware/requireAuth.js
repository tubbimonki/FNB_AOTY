import { COOKIE_NAME, verifyToken } from '../auth/tokens.js';
import { findUserById, toPublicUser } from '../users.js';

// Guards members-only API routes:
//   router.get('/me', requireAuth({ db, jwtSecret }), handler)
//
// requireAuth(...) is a factory: it runs once when routes are set up and
// returns the real middleware, which runs on every request. A middleware
// either ends the request (return res.status(...)) or calls next() to hand
// over to the route. When it hands over, req.user is { id, email, name }.
export function requireAuth({ db, jwtSecret }) {
  return (req, res, next) => {
    // cookie-parser (app.js) has already parsed the Cookie header.
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not logged in' });

    // verifyToken throws for an expired, edited or forged token. Only that
    // one call goes in the try, so errors from the route later on aren't
    // mistaken for a bad token.
    let payload;
    try {
      payload = verifyToken(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }

    // The signature proves we issued the token, not that the account still
    // exists. A deleted user's token must stop working too.
    const user = findUserById(db, Number(payload.sub)); // sub is a string in JWTs
    if (!user) return res.status(401).json({ error: 'Not logged in' });

    req.user = toPublicUser(user); // never the row itself: it holds password_hash
    next();
  };
}
