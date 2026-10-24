// ─────────────────────────────────────────────────────────────────────────
// YOUR TURN: task 1 in the auth notes doc.
//
// Middleware is a function (req, res, next) that runs before a route.
// It either ends the request (res.status(...).json(...)) or calls next()
// to hand over to the route. This one is the bouncer for every members-only
// API route, e.g. router.get('/me', requireAuth({ db, jwtSecret }), handler).
//
// It must:
//   1. Read the token from the cookie.   cookie-parser puts cookies on
//      req.cookies; the name is COOKIE_NAME from ../auth/tokens.js.
//   2. No token?             → 401 { error: 'Not logged in' }
//   3. Verify it with verifyToken(token, jwtSecret). It THROWS when the
//      token is expired, tampered with or signed with another secret,
//      so wrap it in try/catch. Throws? → 401 { error: '...' }
//   4. payload.sub is the user id as a STRING. Look the user up with
//      findUserById(db, ...) from ../users.js. Gone (deleted account)? → 401
//   5. Put the safe version on the request: req.user = toPublicUser(row)
//      then call next().
//
// Why look the user up at all when the token is already trusted? Think
// about a deleted account, and about task 4 (token_version).
//
// Tests: api/auth.test.js, the describe block 'task 1: requireAuth'.
// Remove `.skip` from it, then `npm run test:watch` until it's green.
// Until this is done, GET /api/auth/me answers 501, so refreshing the page
// logs you out. That's the bug this task fixes. (The lint warnings about
// unused db / jwtSecret / next below go away once you use them.)
// ─────────────────────────────────────────────────────────────────────────

export function requireAuth({ db, jwtSecret }) {
  return (req, res, next) => {
    res.status(501).json({ error: 'requireAuth is not written yet (task 1)' });
  };
}
