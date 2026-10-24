import dotenv from 'dotenv';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

// Load environment variables from .env (if present). See .env.example.
dotenv.config();

const PORT = process.env.PORT || 4000;
const { JWT_SECRET } = process.env;

// Refuse to start with a missing or guessable secret: anyone who knows it
// can forge a login for any user.
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    'JWT_SECRET is missing or shorter than 32 characters.\n' +
      'Generate one with:\n' +
      `  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n` +
      'and put it in .env as JWT_SECRET=...',
  );
  process.exit(1);
}

const db = openDatabase(process.env.DATABASE_FILE || 'data/app.db');

createApp({ db, jwtSecret: JWT_SECRET }).listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});
