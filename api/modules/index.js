import alerts from './alerts/index.js';
import community from './community/index.js';
import eco from './eco/index.js';
import events from './events/index.js';
import impact from './impact/index.js';
import notifications from './notifications/index.js';
import reactions from './reactions/index.js';
import services from './services/index.js';
import wallet from './wallet/index.js';

// The feature modules of the modular monolith. Each one owns its routes,
// sample data and its own tables (schema.js), and talks to the others
// through events on the bus (api/bus.js). See api/modules/README.md.
export const MODULES = [alerts, community, events, reactions, services, eco, wallet, impact, notifications];

// FEATURES_OFF=community,impact -> ['community', 'impact']
export const parseFeatureList = (value = '') =>
  value.split(',').map((name) => name.trim()).filter(Boolean);

// Mounts every module that is switched on at /api/<name>.
// deps ({ db, reactionsDb, jwtSecret, bus, cacheStore, weather, eskom, facilities, airQuality, saws }) is passed to each module's router.
// Modules with subscribe() start listening on the bus first.
export function mountModules(app, deps, off = []) {
  const on = MODULES.filter((mod) => !off.includes(mod.name));
  for (const mod of on) mod.subscribe?.(deps);
  for (const mod of on) app.use(`/api/${mod.name}`, mod.router(deps));
  // Lets the frontend (or you) see which features are live.
  app.get('/api/features', (req, res) => res.json({ on: on.map((mod) => mod.name), off }));
}
