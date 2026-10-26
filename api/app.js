import cookieParser from 'cookie-parser';
import express from 'express';
import { resolve } from 'node:path';
import { authRouter } from './routes/auth.js';
import healthRouter from './routes/health.js';
import { weatherRouter } from './routes/weather.js';
import { createWeatherService } from './weather.js';
import { createEskomService } from './eskom.js';
import { createFacilitiesService } from './facilities.js';
import { createAirQualityService } from './airQuality.js';
import { createSawsService } from './saws.js';
import { mountModules } from './modules/index.js';
import { createCacheStore } from './cacheStore.js';
import { createBus } from './bus.js';
import { newsRouter } from './routes/news.js';
import { createNewsService } from './news.js';

// Builds the Express app without starting it (tests use it directly). Routes
// live under /api. db (from openDatabase in db.js), jwtSecret and weather are
// passed in so tests can use an in-memory database, a fake secret and fake weather.
// trustProxy: how many proxies sit in front of us (1 on Render), so req.ip is
// the visitor and not the proxy. staticDir: the built site (dist/) to serve.
// featuresOff: module names to switch off, e.g. ['community'].
// eskom: area power/water status (switched off when it has no token).
// facilities: nearby clinics, shelters etc. from OpenStreetMap.
// airQuality and saws: extra alert sources for /api/alerts.
// news: climate stories from RSS feeds (null = bundled snapshot only).
// cacheStore: the api_cache table, so module caches survive a restart.
// now: the clock, so tests can pretend it's another day.
// reactionsDb: a separate database for event reactions (defaults to db).
// sourceDeadlineMs: how long /api/alerts waits for each source (tests shorten it).
export function createApp({
  db,
  jwtSecret,
  cacheStore = createCacheStore(db),
  weather = createWeatherService(),
  eskom = createEskomService(),
  facilities = createFacilitiesService(),
  airQuality = createAirQualityService(),
  saws = createSawsService(),
  news = createNewsService(),
  trustProxy = 0,
  staticDir,
  featuresOff = [],
  now,
  reactionsDb = db,
  sourceDeadlineMs,
}) {
  if (!db) throw new Error('createApp needs a db');
  if (!jwtSecret) throw new Error('createApp needs a jwtSecret');

  const app = express();
  app.disable('x-powered-by'); // don't advertise the framework
  // Without this the rate limiter sees every visitor as the proxy's IP.
  app.set('trust proxy', trustProxy);

  app.use(express.json()); // JSON only, so an HTML form on another site can't post to us
  app.use(cookieParser()); // req.cookies, read by requireAuth

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter({ db, jwtSecret }));
  app.use('/api/weather', weatherRouter({ weather }));
  app.use('/api/news', newsRouter({ news }));
  // One bus per app: modules announce things on it (see api/bus.js).
  const bus = createBus();
  mountModules(app, { db, reactionsDb, jwtSecret, bus, now, cacheStore, weather, eskom, facilities, airQuality, saws, sourceDeadlineMs }, featuresOff);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Production: serve the site from the same origin as the API, so the
  // session cookie is first-party. Any other path gets index.html (React routes it).
  if (staticDir) {
    const dir = resolve(staticDir);
    app.use(
      express.static(dir, {
        index: false,
        setHeaders(res, file) {
          // Vite puts a hash in every assets/ file name, so they never change.
          if (/[\\/]assets[\\/]/.test(file)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get('/{*path}', (req, res) => {
      res.sendFile('index.html', { root: dir, headers: { 'Cache-Control': 'no-cache' } });
    });
  }

  // Errors thrown in routes end up here: log them, never send stack traces.
  // Express recognises an error handler by its 4 parameters, hence _next.
  // Bad requests (broken JSON, body too big) keep their 4xx status.
  app.use((err, req, res, _next) => {
    const status = err.status ?? err.statusCode;
    if (status >= 400 && status < 500) {
      const messages = { 400: 'The request body is not valid JSON', 413: 'The request is too large' };
      return res.status(status).json({ error: messages[status] ?? 'Bad request' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
