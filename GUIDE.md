# How this app fits together

`README.md` is the quick start; this file explains where things live and where new work goes.

## Commands

First time only: copy `.env.example` to `.env` and fill in `JWT_SECRET` (the file tells you how). The API refuses to start without it. Needs Node 22.13 or newer (`node --version`).

```bash
npm install         # once, or whenever package.json changes
npm run dev         # website at http://localhost:5173, reloads on save
npm run api         # (second terminal) API at http://localhost:4000/api/health, restarts on save
npm test            # run all tests once
npm run test:watch  # re-run tests on every save
npm run lint        # check code for common mistakes
npm run build       # production build into dist/
npm run check       # lint + test + build, i.e. what CI does. Run before pushing.
npm start           # production server (see Deploying)
npm run db:generate # after changing a schema.js: writes the SQL migration (see Database)
npm run db:import-sqlite  # once: copy accounts from the old data/app.db
```

## Folder layout

```
index.html               the one HTML page; loads src/main.jsx
src/
  main.jsx               starts React: BrowserRouter + AuthProvider + App
  App.jsx                every route, all inside <Layout>
  navItems.js            the five tabs (Home, Map, Eco, Community, More); see "Navigation" below
  brand.js               the app name (Eco 5.0), tagline and mission
  featureList.js         the feature list on the landing and Features pages
  index.css              Tailwind, the Eco 5.0 colour tokens and the shared classes (.page, .card, .btn, .pill ...)
  components/            shared UI: Layout, Header (desktop), BottomNav (phone tabs), Footer, Carousel, Photo, Banner, the landing-page teaser cards
    ui/                  small building blocks: AppBar (green title bar), Segmented (pill switch), IconChip, ListRow/ListCard, ProgressBar, Pill, LoadState, tones.js
  pages/                 public content pages (Home = splash + landing, About, Features, Benefits, More, NotFound)
  features/              one folder per product feature, holding its pages, hooks and logic
    green-wallet/        actions.js (the action list), totals.js (maths), useLogs.js (saved logs), TrackerPage.jsx, WalletSummary.jsx (sidebar card)
    dashboard/           DashboardPage.jsx (photo hero with greeting + weather, alert banner, Quick Access, Shortcuts, latest news), MiniWidget, greeting.js, ReadingPage.jsx (news / guides pages), FeatureStrip, HeadlinesWidget
    alerts/              AlertsPage (Current / Forecast / Alerts), AlertCard + severity.js, useAlerts (weather + /api/alerts), EmergencyChecklist + checklist.js + useChecklist
    community/           MapPage + LeafletMap (OpenStreetMap), pinTypes.js, CommunityPage (Nearby / My Reports), ReportPage, EventsCarousel, helpContacts.js
    services/            ServicesPage (water, electricity, transport, waste from /api/services/status; useFacilities -> /api/services/facilities)
    eco/                 EcoPage (footprint, goals, plant), FootprintPage, useFootprint, GrowingPlant + plantStages.js
    water/               WaterPage, water.js (goal, uses, maths), useWaterLogs, WeeklyBars
    recycling/           RecyclingPage, recyclingData.js (what goes where), collection.js (next collection day)
    impact/              ImpactPage (level, points, badges, history), useImpact (gathers everything for shared/impact.js)
    weather/             weather.js (places, weather codes, weather alerts, green tips), useWeather.js (calls /api/weather), WeatherCard.jsx
    news/                newsItems.js (placeholder stories), NewsFeed.jsx
    guides/              guideItems.js (placeholder guides), GuideList.jsx
    auth/                AuthProvider (talks to /api/auth), useAuth, RequireAuth, LoginPage, RegisterPage
  services/              talking to the outside world: api.js (fetch wrapper), storage.js (localStorage)
  hooks/                 hooks shared by several features: useSynced (personal data in Postgres + a browser copy), useStoredState, useApiData
  test/                  test setup, renderWithProviders, mockApi (fake API answers in UI tests)
  assets/                images.js: every photo URL and where each one is used
api/
  index.js               starts the Express server (reads .env, opens the database)
  app.js                 builds the Express app (routes are mounted here)
  db.js                  opens Postgres (DATABASE_URL) or local PGlite, then runs the migrations
  schema.js              core tables (users, api_cache) as Drizzle code; modules keep theirs in modules/<name>/schema.js
  migrations/            SQL made by `npm run db:generate`. Never edit an old one; add a new one
  cacheStore.js          the api_cache table, so cached EskomSePush/OpenStreetMap answers survive a restart
  users.js               every query about users
  auth/                  passwords.js (bcrypt), tokens.js (JWT + cookie), validate.js
  middleware/            requireAuth.js: guards members-only API routes
  weather.js             Open-Meteo client with a 15-minute in-memory cache
  cache.js               shared cache for upstream APIs (fresh, shared call, stale fallback, failure cooldown), in memory plus api_cache
  eskom.js               EskomSePush area status (planned outages cached 2 h, neighbour reports 1 h, API v3.1)
  facilities.js          nearby clinics, shelters, water points etc. from OpenStreetMap Overpass (no key, cached 24 h per place)
  scripts/eskomAreas.js  npm run eskom:areas finds area and schedule ids for ESKOMSEPUSH_AREA and ESKOMSEPUSH_SCHEDULE
  scripts/importSqlite.js  npm run db:import-sqlite copies accounts from the old SQLite file
  routes/                one file per route group (health.js, auth.js, weather.js, news.js)
  modules/               feature modules (alerts, community, services, eco, wallet, impact): routes, sample data and their tables (schema.js). See api/modules/README.md
shared/                  pure JS used by both the site and the API: actions.js (Green Wallet actions), checklist.js, footprint.js, impact.js (points and badges), reports.js (report rules), water.js (goal), checks.js (id and date checks)
  test/                  startTestServer (API + in-memory PGlite, emptied for each server) and a cookie-keeping client
data/                    pglite/ is the local database when DATABASE_URL is unset. Gitignored, created on first run.
public/                  copied as-is into the site (favicon)
karate/                  end-to-end tests, a separate Java project (see Tests)
render.yaml              Render deploy settings (see Deploying)
```

Rule of thumb: if it belongs to one feature, it lives in that feature's folder. Move it to `components/`, `hooks/` or `services/` only once a second feature needs it.

## Where new work goes

- **New feature:** make `src/features/<name>/`, put its page there (start it with `<AppBar title=... back=...>`), add a `<Route>` in `App.jsx`, a row on the More page and, if it matters day to day, a tile on the dashboard. If it needs data, add a module in `api/modules/<name>/` (copy an existing one) and read it with `useApiData('/<name>/...')`.
- **Members-only page:** wrap the route element in `<RequireAuth>` (see `/dashboard` in `App.jsx`).
- **Auth:** our own, on Express: bcrypt-hashed passwords in Postgres (users table), a signed JWT in an httpOnly cookie. Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. The frontend only calls `useAuth()` and gets `{ user, status, login, register, logout }`; it never sees the token. Login and register are rate limited (10 tries per 15 minutes per IP). The "why" behind every piece is in the auth notes doc.
- **Members-only API route:** put `requireAuth({ db, jwtSecret })` before the handler; inside, `req.user` is `{ id, email, name }`. Always filter data by `req.user.id`, never by an id the browser sends.
- **Navigation:** five tabs from the Eco 5.0 design in `navItems.js`: Home (`/dashboard`), Map, Eco, Community, More. Phones get them in a bottom tab bar (`BottomNav`), desktops in the header. Each item's `match` list says which paths light it up (Eco stays lit on `/tracker` and `/eco/*`). The splash and login pages hide the tab bar. About, Features and Benefits are in the footer and on More.
- **Feature modules (API):** each module in `api/modules/` owns its routes and tables (`schema.js`), and never imports another module's code (impact only reads the others' tables until the event bus exists). `FEATURES_OFF=community` in `.env` switches one off. Sample data is marked `sample: true` and the pages say so. Code both sides need (footprint maths, points, report rules) lives in `shared/` so the numbers always match.
- **Essential services:** with `ESKOMSEPUSH_TOKEN`, `ESKOMSEPUSH_SCHEDULE` and `ESKOMSEPUSH_AREA` in `.env`, the Electricity tab on /services shows your area's status (planned outages plus what neighbours report, no stages), and the Water tab goes live too when neighbours report water. Nearby Facilities come from OpenStreetMap near the place picked on the weather card. Transport and waste have no public API, so they are demo data with a "Demo data" pill. The EskomSePush key only allows 50 calls a day, so answers are cached (about 36 calls a day), in memory and in the `api_cache` table, so a restart doesn't spend extra calls.
- **Dashboard routes (nested, all behind RequireAuth):** `/dashboard` is where login lands: the photo hero (greeting, today's weather, alert bell), the most serious alert, Quick Access (alerts, services, eco, map), Shortcuts (news, guides, Green Wallet) and the latest story; `/dashboard/news` and `/dashboard/guides` are the full lists. `/news`, `/guides` and old `?view=` links redirect there.
- **Public tools:** `/alerts`, `/map`, `/community`, `/services`, `/eco`, `/eco/footprint`, `/eco/water`, `/eco/recycling`, `/tracker` and `/more` work without an account. `/impact` and `/community/report` need one.
- **Personal data:** logged in, Green Wallet logs, water logs, the checklist and the footprint are saved in Postgres through `hooks/useSynced.js` (`useSyncedList` for lists, `useSyncedValue` for one value). The browser keeps a copy, so pages show at once, guests can use everything, and offline changes are sent on the next load. Logs carry an id made in the browser, so sending one twice is harmless. Only the recycling day stays in the browser. `/api/impact/me` works out points from the same tables.
- **Weather:** the browser calls our `GET /api/weather?lat=&lon=`, never Open-Meteo directly. The API rounds the place to about 1 km, caches each place for 15 minutes, shares one upstream call between requests that arrive together, and serves the old copy (marked `stale`) for up to 6 hours if Open-Meteo is down. No API key needed. When the scheduler exists, a job can refresh popular places and emit a `weather.updated` event; the frontend doesn't change.
- **Alerts:** `useAlerts` joins live weather warnings from `weatherAlerts()` with `GET /api/alerts` (sample data) and sorts them `severe`, `warning`, `info`. Red is only for `severe`. Community events come from `GET /api/community/updates` and show in `EventsCarousel`.
- **Map:** Leaflet with OpenStreetMap tiles, loaded only on `/map` (`lazy()`), pins drawn as `circleMarker`s. Popups are built with `textContent` because report text comes from users. Tests replace `LeafletMap` with a stand-in (`vi.mock`), since jsdom can't draw maps.
- **Carousel:** `components/Carousel.jsx` takes `images` (photos) or `items` + `renderItem` (anything). Slides glide sideways, pause on hover, focus or the pause button, start paused for people who turn off animations, and switch from dots to arrows past 6 slides.
- **Reading pages:** `ReadingPage.jsx` is a 3-column grid on desktop (main list spans 2, sidebar 1). The sidebar shows the other content type (`HeadlinesWidget`) plus `green-wallet/WalletSummary`; add a widget as one more line in the `<aside>`. Swap placeholder news or guides by replacing `newsItems` / `guideItems` with API data of the same shape. `calculateTotalsByDate()` gives per-day numbers for a future weekly chart.
- **New API route:** add `api/routes/<name>.js` (an Express `Router`), mount it in `api/app.js` under `/api/<name>`, call it from the frontend with `apiGet('/<name>')` from `services/api.js`. Never write `localhost:4000` in the frontend; Vite's proxy forwards `/api`. Handlers can be plain `async` functions: Express 5 sends a thrown error to the error handler in `app.js` by itself.
- **Headings:** one `<h1>` per page (the `.page-title`), `<h2>` for its sections, `<h3>` inside cards. Screen readers navigate by heading level, so keep the order.

## Tests

Vitest runs tests and React Testing Library renders components in a fake browser (jsdom). Test files sit next to the code they test and end in `.test.js` / `.test.jsx`.

- `src/App.test.jsx`: smoke tests that pages render, Green Wallet logs an action, and `/dashboard` needs login.
- `src/components/*.test.jsx`: navigation (five tabs, which one is current, hidden on the splash), the carousel (swipe, autoplay, pause, custom slides) and the photo fallback (Photo).
- `src/features/{alerts,community,services,eco,water,recycling,impact}/*.test.*`: each new page, the checklist, map filters, report form, water maths, collection day and points.
- `shared/*.test.js`: footprint and points maths. `api/modules.test.js`: every module route, logins, `FEATURES_OFF`, impact from saved data.
- `api/data.test.js`: the database: logs per user, sync, delete only your own, footprint, checklist, reports surviving a restart, the `api_cache` table and PGlite on disk.
- `src/hooks/useSynced.test.jsx`: loading from the API, sending offline logs, deletes from another device, guests and offline use.
- `src/features/green-wallet/totals.test.js`: the CO2 / rand maths.
- `api/app.test.js`: `/api/health`, JSON 404s, `trustProxy` (real visitor IP, per-visitor rate limit) and serving the built site.
- `api/weather.test.js`: the weather cache (fresh, shared, stale fallback) with a fake Open-Meteo, and `/api/weather` validation.
- `src/features/weather/weather.test.js`: weather codes, weather alerts, tips and the alert/community mix.
- `api/auth.test.js`: register, login, logout, `/me` (including forged and edited tokens) and rate limiting.
- `src/features/auth/*.test.jsx`: login and sign-up forms, session restore, logout.
- `src/features/dashboard/DashboardPage.test.jsx`: the hero weather, the alert banner, Quick Access and Shortcuts, the news and guides pages and redirects.

To test a component that uses routing or auth, render it with `renderWithProviders(ui, { route, user })` from `src/test/`. To fake API answers, call `mockApi({ 'POST /api/auth/login': [200, { user }] })` from `src/test/mockApi.js` first.

### End-to-end tests (Karate)

`karate/` holds a separate Java project that drives a real Chrome against `npm run dev` and calls the real API. One `.feature` file per landing-page part (header, phone tab bar, splash, each section, footer, photos), `pages.feature` for the Eco 5.0 pages, plus `/api/health` and the feature modules. Login and the dashboard have no scenarios yet. Needs Java 17+ and Maven; with `npm run api` and `npm run dev` running, `cd karate && mvn test` (add `"-Dkarate.options=--tags ~@network"` when offline). Setup and a Karate primer are in `karate/README.md`.

## Deploying

The site and the API run as **one** Express server on one origin. In production (`NODE_ENV=production`) Express serves the built `dist/` folder and answers every non-API path with `index.html`, so React Router handles `/dashboard` on a refresh. One origin keeps the session cookie first-party; a site on GitHub Pages calling an API elsewhere would need a third-party cookie, which browsers block.

- **Render:** dashboard → New → Blueprint → this repo. `render.yaml` sets the build (`npm ci --include=dev && npm run build`), `npm start`, the health check, `NODE_ENV=production`, `TRUST_PROXY=1` and a generated `JWT_SECRET`.
- **TRUST_PROXY:** how many proxies sit in front of the server. Behind Render's proxy every request looks like it comes from the proxy, so the login rate limit would block everyone at once. After deploying, open `/api/health/ip`: it should show your real IP. If it shows a private address like `10.x`, raise `TRUST_PROXY` by one.
- **Try production locally:** `npm run build`, then in PowerShell `$env:NODE_ENV='production'; npm start` and open http://localhost:4000.
- **Data:** set `DATABASE_URL` on Render to the Neon connection string (see Database). Without it the app falls back to PGlite on Render's disk, which is wiped on every deploy and restart.
- **GitHub Pages:** can only host the static site, so login won't work there. CI should keep testing and building, without the Pages deploy.

## Database

Postgres is the main store. Locally, with no `DATABASE_URL` in `.env`, the API runs **PGlite** (the real Postgres, compiled to WebAssembly) in `data/pglite`, so nothing needs installing. With `DATABASE_URL` it talks to a Postgres server, e.g. **Neon** in production. The same SQL runs on both.

- **Tables** are written as Drizzle code: core ones in `api/schema.js`, each module's in `api/modules/<name>/schema.js`. Queries use Drizzle too (`db.select().from(walletLogs).where(eq(walletLogs.userId, id))`); it fills values in as parameters, so there's no SQL injection.
- **Changing a table:** edit the `schema.js`, run `npm run db:generate`, read the new file in `api/migrations/`, commit both. The API applies new migrations by itself when it starts (Drizzle records which ran in a `drizzle.__drizzle_migrations` table). Never edit a migration that has run somewhere; add a new one.
- **Looking at the data:** Neon dashboard → Tables, or `psql "$DATABASE_URL"`. For PGlite, stop `npm run api` first (only one program can open `data/pglite` at a time); deleting `data/pglite` starts the local database empty.
- **Tests** use an in-memory PGlite, one per test file, emptied before each test server. To run the API tests on a real Postgres: `TEST_DATABASE_URL=postgres://... npx vitest run api --no-file-parallelism` (use a throwaway database: the tests empty every table).
- **Old accounts:** `npm run db:import-sqlite` copies users from the old `data/app.db` (passwords keep working, since the bcrypt hashes move as they are).

## Styling

Tailwind is on (class names like `text-2xl font-bold mb-4`). The Eco 5.0 tokens are defined once in `src/index.css`: `forest-50` to `forest-950` (900 is the title bar green), `sprout` (the lime from the splash), `moss`, `bark`, `canvas` (page background), the Inter font and `tabbar` (tab bar height, as in `pb-tabbar`). The same file holds the shared classes `.page`, `.page-title`, `.section-title`, `.section-label`, `.card`, `.card-link`, `.btn`, `.btn-light`, `.btn-sprout`, `.input`, `.label` and `.pill`. Icons come from `lucide-react`; tinted icon squares use `<IconChip tone="blue">` with the tones in `components/ui/tones.js`. Reach for these before writing one-off utilities; a change there restyles every page at once.

### Wide desktop screens
- Every page column uses the `wrap` utility (src/index.css): 1152px up to 1535px wide, then it grows (1408 / 1768 / 2304px at 2xl / 3xl / 4xl). `3xl` (1920px) and `4xl` (2400px) are our own breakpoints.
- From 1920px the root font size goes up a little (17px, then 18px), so every rem-based size grows with the screen.
- `useWide()` (src/hooks/useWide.js) is true from 1536px. Pages use it to add quick widgets (WaterQuick, RecyclingQuick, PowerQuick, EventsQuick, RelatedGuides) only where they fit the content, e.g. the water widget beside the water purification guide. Phones and laptops never load them.
- Tests: `wideScreen()` from src/test/wideScreen.js pretends the screen is wide.

## Debugging tips

- A blank white page almost always means a JavaScript error. Open DevTools (F12) and read the **Console** tab.
- `npm run check` catches most mistakes before you push.
