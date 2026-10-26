import alerts from './alerts/index.js';
import community from './community/index.js';
import eco from './eco/index.js';
import impact from './impact/index.js';
import services from './services/index.js';
import wallet from './wallet/index.js';

// The feature modules of the modular monolith. Each one owns its routes,
// sample data and its own tables (schema.js), and (later) talks to the
// others only through events. See api/modules/README.md.
export const MODULES = [alerts, community, services, eco, wallet, impact];

// FEATURES_OFF=community,impact -> ['community', 'impact']
export const parseFeatureList = (value = '') =>
  value.split(',').map((name) => name.trim()).filter(Boolean);

// Mounts every module that is switched on at /api/<name>.
// deps ({ db, jwtSecret, cacheStore, weather, eskom, facilities, airQuality, saws }) is passed to each module's router.
export function mountModules(app, deps, off = []) {
  const on = MODULES.filter((mod) => !off.includes(mod.name));
  for (const mod of on) app.use(`/api/${mod.name}`, mod.router(deps));
  // Lets the frontend (or you) see which features are live.
  app.get('/api/features', (req, res) => res.json({ on: on.map((mod) => mod.name), off }));
}
