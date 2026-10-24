import { Router } from 'express';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../auth/passwords.js';
import { clearSessionCookie, setSessionCookie } from '../auth/tokens.js';
import { normaliseEmail, validateRegistration } from '../auth/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createUser, findUserByEmail, toPublicUser } from '../users.js';

// Express 4 doesn't catch errors thrown in async handlers; this passes them
// to the error handler in app.js instead of crashing the request.
const asyncRoute = (handler) => (req, res, next) => handler(req, res).catch(next);

// Built as a function so each app (and each test) gets its own db + secret.
export function authRouter({ db, jwtSecret }) {
  const router = Router();

  // ─── YOUR TURN: task 2 (rate limiting) ────────────────────────────────
  // Without a limit, a script can try thousands of passwords a minute.
  // Install express-rate-limit, build ONE limiter here (inside this
  // function, so every test's app starts with a fresh count), allowing
  // 10 requests per 15 minutes per IP, and pass it as the first handler
  // of /register and /login:  router.post('/login', limiter, asyncRoute(...))
  // Its 429 reply should be JSON { error: 'Too many ...' } like every other
  // route here, so the login form can show it (look at the `message` option).
  // Tests: describe block 'task 2: rate limiting' in api/auth.test.js.
  // ──────────────────────────────────────────────────────────────────────

  // POST /api/auth/register  { name, email, password } → 201 { user } + cookie
  router.post(
    '/register',
    asyncRoute(async (req, res) => {
      const error = validateRegistration(req.body ?? {});
      if (error) return res.status(400).json({ error });

      const email = normaliseEmail(req.body.email);
      if (findUserByEmail(db, email)) {
        return res.status(409).json({ error: 'That email is already registered' });
      }

      const passwordHash = await hashPassword(req.body.password);
      const user = createUser(db, { email, name: req.body.name.trim(), passwordHash });

      setSessionCookie(res, user.id, jwtSecret); // registering also logs you in
      res.status(201).json({ user: toPublicUser(user) });
    }),
  );

  // POST /api/auth/login  { email, password } → 200 { user } + cookie
  router.post(
    '/login',
    asyncRoute(async (req, res) => {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = findUserByEmail(db, normaliseEmail(email));
      // Always run bcrypt, even for an unknown email (see DUMMY_HASH), and
      // give the same message either way, so neither the timing nor the
      // text tells an attacker which emails have accounts.
      const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

      setSessionCookie(res, user.id, jwtSecret);
      res.json({ user: toPublicUser(user) });
    }),
  );

  // POST /api/auth/logout → 204, cookie cleared
  router.post('/logout', (req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  });

  // GET /api/auth/me → 200 { user } when logged in, 401 when not.
  // The frontend calls this on page load to find out who is logged in,
  // since it can't read the httpOnly cookie itself.
  router.get('/me', requireAuth({ db, jwtSecret }), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
