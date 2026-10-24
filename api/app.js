import express from 'express';
import healthRouter from './routes/health.js';

// Builds the Express app without starting it, so tests can use it directly.
// All routes live under /api so the Vite dev server can forward them here.
export function createApp() {
  const app = express();

  // Lets routes read JSON request bodies (req.body).
  app.use(express.json());

  app.use('/api/health', healthRouter);
  // TODO(auth): app.use('/api/auth', authRouter);
  // TODO(green-wallet): app.use('/api/logs', logsRouter);

  return app;
}
