import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../auth/passwords.js';
import { clearSessionCookie, setSessionCookie } from '../auth/tokens.js';
import { normaliseEmail, validateRegistration } from '../auth/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isUniqueViolation } from '../db.js';
import { createUser, findUserByEmail, toPublicUser } from '../users.js';

// Handlers are plain async functions: Express 5 passes a thrown error to the
// error handler in app.js by itself.

// Built as a function so each app (and each test) gets its own db + secret.
export function authRouter({ db, jwtSecret }) {
  const router = Router();

  // Brute-force protection: 10 login/register attempts per IP per 15 minutes,
  // shared by both routes. Created in here so each app (and test) starts fresh.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Too many attempts, try again in 15 minutes' },
  });

  // POST /api/auth/register  { name, email, password } → 201 { user } + cookie
  router.post('/register', limiter, async (req, res) => {
    const error = validateRegistration(req.body ?? {});
    if (error) return res.status(400).json({ error });

    const email = normaliseEmail(req.body.email);
    if (await findUserByEmail(db, email)) {
      return res.status(409).json({ error: 'That email is already registered' });
    }

    const passwordHash = await hashPassword(req.body.password);
    let user;
    try {
      user = await createUser(db, { email, name: req.body.name.trim(), passwordHash });
    } catch (err) {
      // Two sign-ups with the same email at once: the second hits the UNIQUE rule.
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'That email is already registered' });
      }
      throw err;
    }

    setSessionCookie(res, user, jwtSecret); // registering also logs you in
    res.status(201).json({ user: toPublicUser(user) });
  });

  // POST /api/auth/login  { email, password } → 200 { user } + cookie
  router.post('/login', limiter, async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(db, normaliseEmail(email));
    // Always run bcrypt (DUMMY_HASH for unknown emails) and give one message,
    // so neither timing nor text reveals which emails have accounts.
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

    setSessionCookie(res, user, jwtSecret);
    res.json({ user: toPublicUser(user) });
  });

  // POST /api/auth/logout → 204, cookie cleared
  router.post('/logout', (req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  });

  // GET /api/auth/me → 200 { user } or 401. The frontend calls it on page load,
  // since it can't read the httpOnly cookie itself.
  router.get('/me', requireAuth({ db, jwtSecret }), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
