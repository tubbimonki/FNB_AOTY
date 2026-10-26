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
import { createWeatherService } from './weather.js';
import { createAirQualityService } from './airQuality.js';
import { parsePlace, startWarmup } from './warmup.js';

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
// A fresh PGlite needs about 740 MB while it sets itself up, more than Render's
// free 512 MB, so the server gets killed mid-deploy. Say so plainly instead.
// ALLOW_PGLITE=1 skips this on a bigger server.
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && process.env.ALLOW_PGLITE !== '1') {
  console.error(
    'DATABASE_URL is not set.\n' +
      'In production the app needs a real Postgres (Neon). On Render: Environment -> add DATABASE_URL\n' +
      'with the Neon connection string, then redeploy. (ALLOW_PGLITE=1 runs PGlite anyway, needs ~1 GB RAM.)',
  );
  process.exit(1);
}
let db;
try {
  db = await openDatabase({ url: process.env.DATABASE_URL, dir: pgliteDir });
} catch (err) {
  console.error('Could not open the database:', err.message);
  if (process.env.DATABASE_URL) console.error('Check DATABASE_URL in .env (copy it again from the Neon dashboard).');
  process.exit(1);
}
console.log(db.kind === 'postgres' ? 'Database: Postgres (DATABASE_URL)' : `Database: PGlite in ${pgliteDir} (set DATABASE_URL to use Neon)`);

// Optional: keep event reactions in a database of their own. Unset = the main one.
let reactionsDb = db;
if (process.env.REACTIONS_DATABASE_URL) {
  try {
    reactionsDb = await openDatabase({ url: process.env.REACTIONS_DATABASE_URL });
    console.log('Reactions database: Postgres (REACTIONS_DATABASE_URL)');
  } catch (err) {
    console.error('Could not open REACTIONS_DATABASE_URL, keeping reactions in the main database:', err.message);
  }
}
if (db.kind === 'pglite' && process.env.NODE_ENV === 'production') {
  console.warn('ALLOW_PGLITE=1: data lives on this server\'s disk and is lost when it restarts.');
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
const saws = createSawsService({ url: process.env.SAWS_CAP_URL || undefined, cacheStore });
if (saws.enabled) {
  saws.check()
    .then((c) => console.log(`SAWS: ${c.items} warnings in the feed, read ${c.capFiles} of the newest CAP files`))
    .catch((err) => console.log(`SAWS: feed not reachable (${err.message}), alerts page leaves it out`));
}

// Climate news from RSS feeds. NEWS_FEEDS=off shows only the bundled snapshot.
const news = process.env.NEWS_FEEDS === 'off' ? null : createNewsService({ store: cacheStore });

// Made here (not inside createApp) so the warm-up below fills the same caches the routes use.
const weather = createWeatherService({ store: cacheStore, log: console.log });
const airQuality = createAirQualityService({ store: cacheStore });

const server = createApp({ db, reactionsDb, jwtSecret: JWT_SECRET, cacheStore, trustProxy, staticDir, featuresOff, weather, airQuality, eskom, facilities, saws, news }).listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

// Fill the outside-data caches now and every 10 minutes, so the first visitor
// doesn't wait. WARM_PLACE=-26.1,28.23 picks the place; WARM_UP=off stops it.
let stopWarmup = () => {};
if (process.env.WARM_UP !== 'off') {
  stopWarmup = startWarmup({ place: parsePlace(process.env.WARM_PLACE), weather, airQuality, eskom, saws, facilities, news });
}

// Ctrl+C or a Render deploy: finish open requests, then close the database
// cleanly (PGlite must flush its files, Postgres frees its connections).
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stopWarmup();
    server.close(async () => {
      if (reactionsDb !== db) await reactionsDb.close();
      await db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
