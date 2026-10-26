# How this app fits together

`README.md` is the quick start and the deploy checklist; this file explains where things live, how the parts talk to each other and where new work goes.

## Commands

First time only: copy `.env.example` to `.env` and fill in `JWT_SECRET` (the file tells you how). The API refuses to start without it. Needs Node 22.13 or newer (`node --version`).

```bash
npm install         # once, or whenever package.json changes
npm run dev         # website at http://localhost:5173, reloads on save
npm run api         # (second terminal) API at http://localhost:4000/api/health, restarts on save
npm test            # run all Vitest tests once
npm run test:watch  # re-run tests on every save
npm run lint        # oxlint over src, api and shared
npm run build       # production build into dist/
npm run check       # lint + test + build, i.e. what CI does. Run before pushing.
npm start           # production server (see Deploying)
npm run db:generate # after changing a schema.js: writes the SQL migration (see Database)
npm run eskom:areas -- "kempton"   # find EskomSePush area and schedule ids
npm run db:import-sqlite           # once: copy accounts from the old data/app.db
```

## Folder layout

```
index.html               the one HTML page; loads src/main.jsx
src/
  main.jsx               starts React: BrowserRouter + AuthProvider + App
  App.jsx                every route, all inside <Layout>, plus the floating ImpactTracker
  navItems.js            the five tabs (Home, Map, Eco, Community, More) and each tab's colour
  brand.js               the app name (Eco 5.0), tagline and mission
  featureList.js         the feature list on the landing and Features pages
  index.css              Tailwind, the nature colour tokens, motion keyframes and shared classes (.page, .card, .btn, .pill ...)
  components/            shared UI: Layout, Header (desktop), BottomNav (phone tabs), Footer, Carousel, Photo, Banner, landing teaser cards
    ui/                  small building blocks: AppBar (title bar), Segmented, IconChip, ListRow/ListCard, ProgressBar, Pill, LoadState, tones.js, and the nature pieces Vine, DriftingLeaves, Hills, GrowingSprout
  pages/                 public content pages (Home = splash + landing, About, Features, Benefits, More, NotFound)
  features/              one folder per product feature: its pages, hooks and logic
    alerts/              AlertsPage, AlertCard + severity.js, SourceStatus, useAlerts (/api/alerts), EmergencyChecklist + useChecklist
    auth/                AuthProvider (talks to /api/auth), useAuth, RequireAuth, AuthShell, LoginPage, RegisterPage
    community/           MapPage + LeafletMap, pinTypes.js (colours, outline icons, NEAR_KM), PinDot, CommunityPage, ReportPage, events (EventsCarousel, EventPage, EventList, useEvents), Reactions + useReactions
    dashboard/           DashboardPage (photo hero with greeting, bell, Premium and weather; Quick Access; Shortcuts), ReadingPage (news / guides), MiniWidget, FeatureStrip, HeadlinesWidget
    eco/                 EcoPage (footprint, goals, plant), FootprintPage, useFootprint, GrowingPlant + plantStages.js
    green-wallet/        actions.js, totals.js (maths), useLogs, TrackerPage (rings), ActionPicker, ProgressRings, WalletSummary
    guides/              guideItems.js (guides with real sources), GuideList, RelatedGuides
    impact/              ImpactPage (level, points, badges, history), ImpactTracker (the floating leaf), comparisons.js (sourced CO2 comparisons), useImpact, useAwards
    news/                useNews (/api/news), NewsFeed, newsItems.js
    notifications/       NotificationBell (dashboard bell) and useNotifications (/api/notifications)
    recycling/           RecyclingPage, RecyclingQuick, recyclingData.js, collection.js (collection day, saved per member)
    services/            ServicesPage (/api/services/status), useFacilities (/api/services/facilities, plus a saved copy per place), PowerQuick
    water/               WaterPage, water.js, useWaterLogs, WeeklyBars, WaterQuick
    weather/             weather.js (places, codes, alerts, tips), usePlace (the one shared place + 10-minute location refresh), useWeather (/api/weather), WeatherCard
  services/              api.js (fetch wrapper: apiGet/apiPost/apiPut/apiDelete), storage.js (localStorage)
  hooks/                 shared hooks: useSynced (personal data in Postgres + a browser copy), useStoredState, useApiData, useWide, and the motion hooks useScrollReveal, usePointerGlow, useParallax, useCountUp
  test/                  test setup, renderWithProviders, mockApi, wideScreen
  assets/                images.js: every photo URL and where it is used
api/
  index.js               starts the server: reads .env, opens the database, builds the services, warms caches
  app.js                 builds the Express app: rate limits, routes, modules, static site, error handler
  bus.js                 the in-process event bus (see Event bus)
  db.js                  opens Postgres (DATABASE_URL) or local PGlite, then runs the migrations
  schema.js              core tables (users, api_cache); modules keep theirs in modules/<name>/schema.js
  migrations/            SQL made by `npm run db:generate` (plus meta/, which Drizzle needs at runtime). Never edit an old one
  cache.js               shared cache for outside APIs: fresh copy, one shared call, stale fallback, failure cooldown
  cacheStore.js          the api_cache table, so cached answers survive a restart and are shared by PC and Render (rows kept 7 days, facilities 30)
  warmup.js              fills the caches at start and every 10 minutes
  weather.js, airQuality.js   Open-Meteo forecast and air quality
  eskom.js               EskomSePush area status (planned outages, neighbour reports)
  facilities.js          nearby clinics, shelters, water points from OpenStreetMap (Overpass, Nominatim fallback)
  saws.js, aia.js        SA Weather Service warnings feed, and the TLS chain fix it needs
  news.js                climate stories from RSS feeds, with a bundled snapshot
  users.js               every query about users
  auth/                  passwords.js (bcrypt), tokens.js (JWT + cookie), validate.js
  middleware/            requireAuth.js (members-only routes, optionalAuth), rateLimit.js (outside-API routes)
  routes/                health.js, auth.js, weather.js, news.js
  modules/               feature modules (alerts, community, events, reactions, services, eco, wallet, impact, notifications). See api/modules/README.md
  scripts/               eskomAreas.js, importSqlite.js
  test/                  startTestServer (API + in-memory PGlite), a cookie-keeping client, a sample SAWS feed
shared/                  pure JS used by both the site and the API: actions, checklist, checks, events, footprint, impact (points and badges), reactions, reports, water, weatherAlerts, newsSnapshot
data/                    pglite/ is the local database when DATABASE_URL is unset. Gitignored
public/                  copied as-is into the site (favicon)
karate/                  end-to-end tests, a separate Java project (see Tests)
render.yaml              Render deploy settings (see Deploying)
demo-assets/             an offline backup for presenting (API answers, photos, map tiles); nothing reads it, see its README
```

Rule of thumb: if it belongs to one feature, it lives in that feature's folder. Move it to `components/`, `hooks/` or `services/` only once a second feature needs it.

## Event bus

The API is a modular monolith: one server, split into feature modules that never import each other. When something happens, a module announces it on the bus (`await bus.emit('log.created', {...})`) and any module that cares listens (`bus.on('log.created', fn)`). The sender doesn't know who listens, so a new feature can react to old events without touching the old code. `emit` waits for the listeners, so when a request answers, the points and notifications are already saved. A failing listener gets one more try after 200 ms (a dropped database connection usually works the second time); if that fails too it is logged and never breaks the request. That retry is why every listener must be safe to run twice: insert with `onConflictDoNothing`, delete by key, never "add 5 to a counter".

| Event | Sent by | When | Heard by |
|---|---|---|---|
| `log.created` | wallet | new Green Wallet logs (one, or many from a sync) | impact (badge check) |
| `water.logged` | eco | new water logs | impact |
| `footprint.saved` | eco | footprint questionnaire saved | impact |
| `checklist.saved` | alerts | emergency checklist saved | impact |
| `report.created` | community | a member reports a problem | impact (+5 points), notifications |
| `event.attended` / `event.cancelled` | events | RSVP added / removed | impact (reward points, Premium days), notifications |
| `reaction.added` / `reaction.removed` | reactions | 😊 ❤ 👏 🌱 on an event | impact (+2 points / taken back) |
| `badge.unlocked` | impact | a badge or a new level is reached for the first time | notifications |
| `service.changed` | services | the area's power or water status changes | notifications (for everyone) |
| `alert.issued` | alerts | a severe alert for a place, once a day | notifications (for that place) |

Each module lists what it emits and hears in its `events` field, and `api/modules.test.js` checks that every declared event is really emitted. Example chain: logging your fifth walk → `log.created` → impact sees Green Commuter unlocked, saves it in `impact_badges` and says `badge.unlocked` → notifications saves "Badge unlocked: Green Commuter" → the bell shows it.

## Where new work goes

- **New feature:** make `src/features/<name>/`, put its page there (start it with `<AppBar title=... back=...>`), add a `<Route>` in `App.jsx`, a row on the More page and, if it matters day to day, a tile on the dashboard. If it needs data, add a module in `api/modules/<name>/` (copy an existing one) and read it with `useApiData('/<name>/...')`.
- **Reacting to something another module does:** don't import it. Listen on the bus in your module's `subscribe({ db, bus })` and add the event to your `events.listens`.
- **Members-only page:** wrap the route element in `<RequireAuth>` (see `/dashboard` in `App.jsx`).
- **Members-only API route:** put `requireAuth({ db, jwtSecret })` before the handler; inside, `req.user` is `{ id, email, name }`. Always filter by `req.user.id`, never by an id the browser sends. `optionalAuth` is for public routes that answer a bit more for members.
- **Auth:** our own, on Express: bcrypt-hashed passwords in Postgres, a signed JWT in an httpOnly cookie. `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`. The frontend only calls `useAuth()`. Login and register allow 10 tries per 15 minutes per IP. Each token has its own id (`jti`); logout writes it to `revoked_tokens` and `requireAuth` refuses it from then on, so a copied cookie dies too while your other devices stay logged in. When any members-only call answers 401 (expired or revoked), `services/api.js` announces `session-ended` and `AuthProvider` logs out on the page.
- **Rate limits:** `/api/weather`, `/api/news`, `/api/alerts` and `/api/services` share one budget of 120 requests per visitor per minute (`api/middleware/rateLimit.js`), so nobody can burn the outside APIs' quotas by asking for many places. Requests from your own computer are not counted outside production, so `npm run dev` and Karate never hit it.
- **Personal data:** logged in, Green Wallet logs, water logs, the checklist, the footprint and the recycling day are saved in Postgres through `hooks/useSynced.js` (`useSyncedList` for lists, `useSyncedValue` for one value). The browser keeps a copy, so pages show at once, guests can use everything, and offline changes are sent on the next load. `useSyncedValue` sends one PUT at a time and always the newest value, so quick changes can't land on the server in the wrong order. The server refuses log dates later than tomorrow (SA time).
- **Points, badges and Premium:** the maths lives in `shared/impact.js`, so the page and `GET /api/impact/me` agree. Rewards (events, reactions, reports) are rows in `impact_awards`; Premium days come from event rewards and show on the dashboard, the Impact page and the tracker.
- **Notification bell:** `GET /api/notifications?place=` returns your own notifications plus the ones for everyone in your place. What's unread is remembered in the browser (the last time you opened the bell). Rows older than 30 days are deleted. To add a new kind, listen for an event in `api/modules/notifications/index.js`.
- **Impact tracker:** the leaf in the bottom corner (`features/impact/ImpactTracker.jsx`), on every page except the splash and the forms. Hover or tap shows actions, CO2 and rand saved, and a comparison from `comparisons.js`; each comparison names its source.
- **Essential services:** with the `ESKOMSEPUSH_*` settings, the Electricity tab is live (planned outages and neighbour reports) and Water goes live when neighbours report it. Facilities come from OpenStreetMap. Transport and waste have no public API, so they stay demo data with a "Demo data" pill and a reason.
- **Weather and alerts:** the browser only calls our API. `/api/alerts` combines Open-Meteo forecasts, EskomSePush, air quality and SAWS warnings; one source failing or being slow (over 4 s) never hides the others.
- **Your place and location:** `features/weather/usePlace.js` holds the one place that weather, alerts, services and the map all use (saved as `weather:place`). When you pick "My location", `useLocationRefresh` (run in `Layout`) reads the device location again every 10 minutes and when the tab comes back, and only moves the place if you moved 500 m or more (GPS jitter would refetch everything). A picked city is never overridden, and a "denied" answer stops it.
- **Nearby facilities:** within `NEAR_KM` (1.5 km) of your place they get a lime ring, a bigger marker and a "Nearby" badge, on the map (with a dashed 1.5 km circle) and in the Services list, which is sorted nearest first. Icons are Lucide outlines in white on the type's colour (`PinDot`), the same in the legend, lists and markers.
- **Facilities caching:** the server keeps each answer per rounded place (about 1 km, `shared/geo.js placeKey`) in `api_cache`: fresh for a day, then served at once while it refreshes in the background (stale-while-revalidate), kept for 30 days. The browser keeps the last good answer for the last 5 places (`facilities:cache`), shows it straight away labelled "Saved copy from ...", and only falls back to the demo list when it has neither.
- **Map:** Leaflet with OpenStreetMap tiles, loaded only on `/map`. Popups are built with `textContent` because report text comes from users. Community reports show as unverified.
- **Security headers:** `api/app.js` sends `nosniff`, no framing, a strict `Referrer-Policy`, a `Permissions-Policy` that only allows location, and HSTS in production. A full Content-Security-Policy is left out on purpose: tiles, photos and fonts come from several hosts and a wrong list would break pages.
- **Caches of outside data:** weather, air quality, news, EskomSePush, SAWS and facilities all keep their last answer in the `api_cache` table too, so a restart (Render's free plan sleeps) starts warm.
- **New API route:** add `api/routes/<name>.js` (an Express `Router`) or a module, mount it in `api/app.js`, call it with `apiGet('/<name>')`. Never write `localhost:4000` in the frontend; Vite's proxy forwards `/api`.
- **Headings:** one `<h1>` per page, `<h2>` for sections, `<h3>` inside cards.

## Environment variables

All of them are explained in `.env.example`. The ones that matter:

| Name | Needed | What it does |
|---|---|---|
| `JWT_SECRET` | always | signs login tokens; long and random |
| `DATABASE_URL` | production | the Neon connection string; unset = local PGlite in `data/pglite` |
| `NODE_ENV`, `TRUST_PROXY` | production | `production` serves the built site; `1` behind Render's proxy |
| `ESKOMSEPUSH_TOKEN`, `ESKOMSEPUSH_SCHEDULE`, `ESKOMSEPUSH_AREA` | optional | live power and water status (50 calls a day, cached in the database) |
| `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_NAME` | optional | a ready-made login for judges |
| `FEATURES_OFF` | optional | switch modules off, e.g. `community,impact` |
| `WARM_PLACE`, `WARM_UP` | optional | where (and whether) the caches are warmed |
| `NEWS_FEEDS`, `SAWS_CAP_URL`, `OVERPASS_URL` | optional | `off` or another server for those sources |
| `REACTIONS_DATABASE_URL` | optional | a second database just for event reactions |

## Tests

**Vitest** runs the unit, page and API tests; React Testing Library renders components in jsdom. Test files sit next to the code and end in `.test.js` / `.test.jsx`.

- `api/*.test.js` start the real Express app on an in-memory PGlite (`startTestServer`): auth, every module, the event bus chain (badges, notifications), rate limits, caches, alerts sources, SAWS, news, facilities, warm-up.
- `src/**/*.test.jsx` render pages with `renderWithProviders(ui, { route, user })` and fake the API with `mockApi({ 'GET /api/...': [200, body] })`.
- `shared/*.test.js` check the maths both sides use (footprint, points).

**Karate** (`karate/`, Java 17+ and Maven) drives a real Chrome against the running app and calls the real API. `@api` checks the routes, `@ui` the pages, `@mobile` the phone layout, `@network` the photo links. Run it with the app up:

```bash
npm run api                    # terminal 1
npm run dev                    # terminal 2
cd karate && mvn test          # terminal 3 (add "-Dkarate.options=--tags ~@network" when offline)
```

`karate/README.md` has the primer and more options (one file, one tag, watch Chrome).

## Deploying

The site and the API run as **one** Express server on one origin, so the session cookie stays first-party. In production (`NODE_ENV=production`) Express serves `dist/` and answers every non-API path with `index.html`.

- **Render:** dashboard → New → Blueprint → this repo. `render.yaml` sets the build, `npm start`, the health check, `NODE_ENV`, `TRUST_PROXY=1` and a generated `JWT_SECRET`. Fill in `DATABASE_URL` (Neon) and the optional keys on the dashboard. The step-by-step checklist is in README.md.
- **Why Neon is required in production:** without `DATABASE_URL` the server would fall back to PGlite, whose first boot peaks at about 740 MB of memory, over Render free's 512 MB, so Render kills it. With Neon it runs at about 130 MB. So with `NODE_ENV=production` and no `DATABASE_URL`, `api/index.js` stops at once with "DATABASE_URL is not set" (`ALLOW_PGLITE=1` overrides, on a machine with about 1 GB).
- **Node and dev packages:** `.node-version` pins Node 22; `.npmrc` with `include=dev` makes even a plain `npm install` fetch Vite while `NODE_ENV=production`.
- **TRUST_PROXY:** after deploying, `/api/health/ip` should show your real IP. If it shows `10.x`, raise it by one.
- **Try production locally:** `npm run build`, then in PowerShell `$env:NODE_ENV='production'; npm start` and open http://localhost:4000.

## Database

Postgres is the main store. Without `DATABASE_URL` the API runs **PGlite** (real Postgres compiled to WebAssembly) in `data/pglite`, so nothing needs installing. With it, it talks to a Postgres server such as **Neon**.

- **Tables** are Drizzle code: core ones in `api/schema.js`, each module's in `api/modules/<name>/schema.js`. Queries use Drizzle too; values go in as parameters, so there's no SQL injection.
- **Changing a table:** edit the `schema.js`, run `npm run db:generate`, read the new file in `api/migrations/`, commit it together with `migrations/meta/`. The API applies new migrations itself on start.
- **Looking at the data:** Neon dashboard → Tables, or `psql "$DATABASE_URL"`. For PGlite, stop `npm run api` first.
- **Tests** use an in-memory PGlite per test file. `TEST_DATABASE_URL=postgres://... npx vitest run api --no-file-parallelism` runs them on a real (throwaway) Postgres.

## Styling

Tailwind 4. The nature palette is defined once as tokens in `src/index.css` (`forest`, `sprout`, `moss`, `bark`, `canvas`, and Tailwind's own colour names remapped to nature tones, see Motion and nature design), and each bottom tab has its own accent colour (`data-accent`) used by its tab pill, title bar line and vine. Shared classes: `.page`, `.page-title`, `.section-label`, `.card`, `.card-link`, `.btn`, `.btn-light`, `.btn-sprout`, `.input`, `.label`, `.pill`, `.scroll-box`. Icons come from `lucide-react`. Reach for these before writing one-off utilities.

### Wide desktop screens

The `wrap` utility grows the content column past 1536px (1408 / 1768 / 2304px at 2xl / 3xl / 4xl). `useWide()` is true from 1536px and adds side columns of quick widgets (WaterQuick, RecyclingQuick, PowerQuick, EventsQuick, RelatedGuides). Tests use `wideScreen()` from `src/test/wideScreen.js`.

## Motion and nature design

The whole app shares one motion system. Most pages get it for free; you only add classes when you want something extra.

**Tokens (src/index.css)**
- `--ease-organic` (quick start, slow settle) and `--motion-fast / base / slow` (150 / 260 / 450 ms). Use them for every transition, e.g. `duration-(--motion-base) ease-organic`.
- Nature colours: Tailwind's own names are remapped (`slate` = stone, `emerald` = leaf, `blue` = sky, `cyan` = lagoon, `violet` = heather, `amber` = sun, `red` = clay). `--accent / --accent-soft / --accent-glow` follow the current tab.
- The "Motion and nature" block at the end of index.css holds the keyframes and classes below.

**What every page gets automatically (Layout.jsx)**
- `useScrollReveal` (src/hooks/useScrollReveal.js): every `.card`, `.section-title` and `.section-label` below the fold starts hidden (`data-reveal="wait"`) and rises in when it scrolls into view (`data-reveal="in"`), staggered 70 ms apart. Things already on screen are left alone.
- `usePointerGlow` (src/hooks/usePointerGlow.js): a soft glow follows the mouse over any `.card-link`; `[data-tilt]` cards also tilt a few degrees.
- Section titles grow a short accent "shoot" along their underline.

**Opt-in pieces**
- `data-reveal` on any element: make it fade in on scroll. `data-reveal="off"`: never animate it.
- `className="rise" style={{ '--i': n }}`: fade/rise in on page load, n steps (110 ms) after the first. Use for heroes.
- `data-tilt` on a `.card-link`: 3D tilt on hover.
- `useParallax(ref, speed)` + class `hero-photo` on the photo: the photo drifts slower than the page.
- `useCountUp(target)`: returns `[ref, value]`, counts up once in view.
- Components in src/components/ui: `DriftingLeaves` (falling leaves behind a hero), `Hills` (two hills fading a photo hero into the page), `GrowingSprout` (plant that grows when it scrolls in), `Vine`.

**Adding it to a new page**
1. Use `.card`, `.section-title` and `.card-link` as usual: the fade-in and glow come with them.
2. For a photo hero, copy the landing page (src/pages/Home.jsx): `rise` on each line, `DriftingLeaves`, `Hills`, `useParallax`.
3. Nothing to do for reduced motion: the hooks skip their work and index.css stops the animations when the system asks for less motion. Never hide content another way: without IntersectionObserver (old browsers, Vitest) everything simply shows.

**Testing**: src/hooks/useScrollReveal.test.jsx fakes IntersectionObserver; src/pages/Home.test.jsx covers the landing cards.

## Debugging tips

- A blank white page almost always means a JavaScript error. Open DevTools (F12) → **Console**.
- The API logs one line per outside source at start (database, EskomSePush, SAWS). `GET /api/features` lists the modules that are on; `GET /api/alerts/saws` shows what the SAWS feed looked like.
- A 429 from `/api/weather` or `/api/alerts` means the per-minute limit; wait a minute.
- `npm run check` catches most mistakes before you push.
