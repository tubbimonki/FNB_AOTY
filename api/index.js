import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { createEskomService } from './eskom.js';
import { createFacilitiesService } from './facilities.js';
import { createSawsService } from './saws.js';
import { createNewsService } from './news.js';
import { openDatabase } from './db.js';
import { createCacheStore } from './cacheStore.js';
import { hashPassword } from './auth/passwords.js';
import { normaliseEmail } from './auth/validate.js';
import { createUser, findUserByEmail } from './users.js';
import { parseFeatureList } from './modules/index.js';

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

// How many proxies sit in front of the app: 0 locally, 1 on Render.
const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
if (!Number.isInteger(trustProxy) || trustProxy < 0) {
  console.error('TRUST_PROXY must be a whole number (0 locally, 1 behind one proxy).');
  process.exit(1);
}

// In production Express serves the built site too (one origin, see GUIDE.md).
let staticDir;
if (process.env.NODE_ENV === 'production') {
  staticDir = fileURLToPath(new URL('../dist', import.meta.url));
  if (!existsSync(`${staticDir}/index.html`)) {
    console.error('dist/index.html is missing. Run `npm run build` first.');
    process.exit(1);
  }
}

// DATABASE_URL (Neon, Supabase, any Postgres) in production. Without it the
// app runs PGlite, a local Postgres kept in data/pglite, so `npm run api` just works.
const pgliteDir = process.env.PGLITE_DIR || 'data/pglite';
let db;
try {
  db = await openDatabase({ url: process.env.DATABASE_URL, dir: pgliteDir });
} catch (err) {
  console.error('Could not open the database:', err.message);
  if (process.env.DATABASE_URL) console.error('Check DATABASE_URL in .env (copy it again from the Neon dashboard).');
  process.exit(1);
}
console.log(db.kind === 'postgres' ? 'Database: Postgres (DATABASE_URL)' : `Database: PGlite in ${pgliteDir} (set DATABASE_URL to use Neon)`);
if (db.kind === 'pglite' && process.env.NODE_ENV === 'production') {
  console.warn('No DATABASE_URL: data lives on this server\'s disk and is lost when Render restarts.');
}
const cacheStore = createCacheStore(db);

// An optional demo account (DEMO_EMAIL + DEMO_PASSWORD) for judges, made at
// start if it doesn't exist yet.
const demoEmail = normaliseEmail(process.env.DEMO_EMAIL);
if (demoEmail && process.env.DEMO_PASSWORD?.length >= 8 && !(await findUserByEmail(db, demoEmail))) {
  await createUser(db, { email: demoEmail, name: process.env.DEMO_NAME || 'Demo', passwordHash: await hashPassword(process.env.DEMO_PASSWORD) });
  console.log(`Demo account ready: ${demoEmail}`);
}

const featuresOff = parseFeatureList(process.env.FEATURES_OFF);

// Live area power/water status when a key is set, otherwise the Services page shows demo data.
const eskom = createEskomService({
  token: process.env.ESKOMSEPUSH_TOKEN,
  scheduleId: process.env.ESKOMSEPUSH_SCHEDULE,
  areaId: process.env.ESKOMSEPUSH_AREA,
  baseUrl: process.env.ESKOMSEPUSH_BASE_URL || undefined,
  cacheStore,
});
console.log(eskom.enabled ? 'EskomSePush: on' : 'EskomSePush: off (no ESKOMSEPUSH_TOKEN), using sample data');

// Facilities from OpenStreetMap need no key. OVERPASS_URL swaps in a mirror.
const facilities = createFacilitiesService({ url: process.env.OVERPASS_URL || undefined, cacheStore });

// Official SAWS warnings feed. SAWS_CAP_URL=off switches it off.
const saws = createSawsService({ url: process.env.SAWS_CAP_URL || undefined });

// Climate news from RSS feeds. NEWS_FEEDS=off shows only the bundled snapshot.
const news = process.env.NEWS_FEEDS === 'off' ? null : createNewsService();

const server = createApp({ db, jwtSecret: JWT_SECRET, cacheStore, trustProxy, staticDir, featuresOff, eskom, facilities, saws, news }).listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

// Ctrl+C or a Render deploy: finish open requests, then close the database
// cleanly (PGlite must flush its files, Postgres frees its connections).
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
