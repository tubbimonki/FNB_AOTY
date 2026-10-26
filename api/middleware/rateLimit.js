import { rateLimit } from 'express-rate-limit';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Public routes that can call an outside API (weather, alerts, services, news).
// Answers are cached, but a new lat/lon is a cache miss, so one script could
// still spend our upstream quota. This caps each visitor (by IP) per minute.
// skipLocal: don't count requests from this computer (dev server, Karate runs).
export function upstreamLimiter({ perMinute = 120, skipLocal = false } = {}) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: perMinute,
    standardHeaders: 'draft-8', // RateLimit header tells the browser when to try again
    legacyHeaders: false,
    skip: (req) => skipLocal && LOOPBACK.has(req.ip),
    message: { error: 'Too many requests, try again in a minute' },
  });
}
