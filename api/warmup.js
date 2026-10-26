// Fills the outside-data caches before any visitor asks, and keeps them
// filled, so nobody waits for Overpass or the SAWS CAP files on a cold start.
// Each service only calls upstream when its answer is past "fresh", so a
// refresh every few minutes costs nothing extra while answers are fresh.
// EskomSePush is warmed once at start but left out of the timer: its quota
// (50 a day) is better spent on real visits.

// The weather card's default place (Johannesburg), rounded the same way the
// services round it, so the warm answers are the ones the pages ask for.
export const DEFAULT_WARM_PLACE = { lat: -26.2, lon: 28.05 };

// "-26.1,28.23" -> { lat, lon }, or the default for anything else.
export function parsePlace(value) {
  const [lat, lon] = String(value ?? '').split(',').map(Number);
  const ok = Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180;
  return ok && value ? { lat, lon } : DEFAULT_WARM_PLACE;
}

// Runs every job at once; one failing never stops the others.
// -> { ok: ['weather', ...], failed: ['saws: fetch failed', ...] }
export async function warmCaches({ place = DEFAULT_WARM_PLACE, weather, airQuality, eskom, saws, facilities, news, withEskom = true }) {
  const { lat, lon } = place;
  const jobs = {
    weather: weather && (() => weather.getWeather(lat, lon)),
    air: airQuality && (() => airQuality.getAir(lat, lon)),
    power: withEskom && eskom?.enabled && (() => eskom.getArea()),
    saws: saws?.enabled && (() => saws.getWarnings(lat, lon)),
    facilities: facilities && (() => facilities.getFacilities(lat, lon)),
    news: news && (() => news.getNews()),
  };
  const names = Object.keys(jobs).filter((name) => jobs[name]);
  const results = await Promise.allSettled(names.map((name) => jobs[name]()));
  const ok = [];
  const failed = [];
  results.forEach((r, i) => (r.status === 'fulfilled' ? ok.push(names[i]) : failed.push(`${names[i]}: ${r.reason?.message ?? r.reason}`)));
  return { ok, failed };
}

// Warms now, then every `everyMs`. Returns stop(). The timer is unref'd so
// it never keeps the process alive on its own.
export function startWarmup(services, { everyMs = 10 * 60 * 1000, log = console.log } = {}) {
  const run = (withEskom) =>
    warmCaches({ ...services, withEskom })
      .then(({ ok, failed }) => log(`Warm-up: ${ok.join(', ') || 'nothing'} ready${failed.length ? `; failed: ${failed.join(' | ')}` : ''}`))
      .catch((err) => log(`Warm-up failed: ${err.message}`));
  run(true);
  const timer = setInterval(() => run(false), everyMs);
  timer.unref();
  return () => clearInterval(timer);
}
