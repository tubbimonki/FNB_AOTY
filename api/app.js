import cookieParser from 'cookie-parser';
import express from 'express';
import { authRouter } from './routes/auth.js';
import healthRouter from './routes/health.js';

// Builds the Express app without starting it, so tests can use it directly.
// All routes live under /api so the Vite dev server can forward them here.
//
// db: an open database (see db.js). jwtSecret: the key that signs session
// tokens. Both are passed in rather than read here, so tests can use a
// throwaway in-memory database and a fake secret.
export function createApp({ db, jwtSecret }) {
  if (!db) throw new Error('createApp needs a db');
  if (!jwtSecret) throw new Error('createApp needs a jwtSecret');

  const app = express();

  // Lets routes read JSON request bodies (req.body). Only JSON is parsed,
  // which also means a plain HTML form on another site can't post to us.
  app.use(express.json());
  // Puts cookies on req.cookies (requireAuth reads the session from there).
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter({ db, jwtSecret }));
  // TODO(green-wallet): app.use('/api/logs', logsRouter({ db, jwtSecret }));

  // Anything thrown in a route ends up here. Log the details for us,
  // but never send stack traces to the browser. Express recognises an error
  // handler by its 4 parameters, so _next stays even though it's unused.
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
