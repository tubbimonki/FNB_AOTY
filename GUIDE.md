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
```

## Folder layout

```
index.html               the one HTML page; loads src/main.jsx
src/
  main.jsx               starts React: BrowserRouter + AuthProvider + App
  App.jsx                every route, all inside <Layout>
  navItems.js            menu links (add a line here to show a page in the menu)
  index.css              global styles + Tailwind
  components/            shared UI: Layout (header + page + footer), Header, Footer, Carousel...
  pages/                 static content pages (Home, About, News, ...)
  features/              one folder per product feature, holding its pages, hooks and logic
    green-wallet/        actions.js (the action list), totals.js (maths), useLogs.js (saved logs), TrackerPage.jsx, WalletSummary.jsx (home page card)
    dashboard/           DashboardPage.jsx (news + guides side, 2:1 grid), FeatureStrip, HeadlinesWidget
    news/                newsItems.js (placeholder stories), NewsFeed.jsx
    guides/              guideItems.js (placeholder guides), GuideList.jsx
    auth/                AuthProvider (talks to /api/auth), useAuth, RequireAuth, LoginPage, RegisterPage
  services/              talking to the outside world: api.js (fetch wrapper), storage.js (localStorage)
  hooks/                 hooks shared by several features (useApiHealth)
  test/                  test setup, renderWithProviders, mockApi (fake API answers in UI tests)
  assets/                images imported from code
api/
  index.js               starts the Express server (reads .env, opens the database)
  app.js                 builds the Express app (routes are mounted here)
  db.js                  opens SQLite (data/app.db) and creates tables
  users.js               every SQL query about users
  auth/                  passwords.js (bcrypt), tokens.js (JWT + cookie), validate.js
  middleware/            requireAuth.js: guards members-only API routes
  routes/                one file per route group (health.js, auth.js)
  test/                  startTestServer (API + in-memory db) and a cookie-keeping client
data/                    the SQLite database file. Gitignored, created on first run.
public/                  copied as-is into the site (favicon)
_old/                    leftovers from the plain-HTML version. Nothing uses them.
```

Rule of thumb: if it belongs to one feature, it lives in that feature's folder. Move it to `components/`, `hooks/` or `services/` only once a second feature needs it.

## Where new work goes

- **New feature:** make `src/features/<name>/`, put its page there, add a `<Route>` in `App.jsx` and a line in `navItems.js`.
- **Members-only page:** wrap the route element in `<RequireAuth>` (see `/dashboard` in `App.jsx`).
- **Auth:** our own, on Express: bcrypt-hashed passwords in SQLite, a signed JWT in an httpOnly cookie. Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. The frontend only calls `useAuth()` and gets `{ user, status, login, register, logout }`; it never sees the token. Login and register are rate limited (10 tries per 15 minutes per IP). The "why" behind every piece is in the auth notes doc.
- **Members-only API route:** put `requireAuth({ db, jwtSecret })` before the handler; inside, `req.user` is `{ id, email, name }`. Always filter data by `req.user.id`, never by an id the browser sends.
- **Two sides, two tabs:** the nav (`navItems.js`) has only Dashboard (read and learn: news and guides together, `?view=news|guides`) and Green Wallet (do and track: `/tracker`, later quizzes and challenges). The logo goes to the onboarding landing page `/home`. About, Features and Benefits are linked from the footer; `/news` and `/guides` redirect into the dashboard. Login and sign-up land on `/dashboard`.
- **Dashboard widgets:** `DashboardPage.jsx` is a 3-column grid on desktop (main list spans 2, sidebar 1). The sidebar shows the other content type (`HeadlinesWidget`) plus `green-wallet/WalletSummary`; add a widget as one more line in the `<aside>`. Swap placeholder news or guides by replacing `newsItems` / `guideItems` with API data of the same shape. `calculateTotalsByDate()` gives per-day numbers for a future weekly chart.
- **New API route:** add `api/routes/<name>.js` (an Express `Router`), mount it in `api/app.js` under `/api/<name>`, call it from the frontend with `apiGet('/<name>')` from `services/api.js`. Never write `localhost:4000` in the frontend; Vite's proxy forwards `/api`.

## Tests

Vitest runs tests and React Testing Library renders components in a fake browser (jsdom). Test files sit next to the code they test and end in `.test.js` / `.test.jsx`.

- `src/App.test.jsx`: smoke tests that pages render, Green Wallet logs an action, and `/dashboard` needs login.
- `src/features/green-wallet/totals.test.js`: the CO2 / rand maths.
- `api/app.test.js`: starts the API on a random port and checks `/api/health`.
- `api/auth.test.js`: register, login, logout, `/me` (including forged and edited tokens) and rate limiting.
- `src/features/auth/*.test.jsx`: login and sign-up forms, session restore, logout.
- `src/features/dashboard/DashboardPage.test.jsx`: the dashboard (news/guides switch, sidebar, today's Green Wallet totals) and the two-tab nav.

To test a component that uses routing or auth, render it with `renderWithProviders(ui, { route, user })` from `src/test/`. To fake API answers, call `mockApi({ 'POST /api/auth/login': [200, { user }] })` from `src/test/mockApi.js` first.

### End-to-end tests (Karate)

`karate/` holds a separate Java project that drives a real Chrome against `npm run dev` and calls the real API. One `.feature` file per landing-page part (header, mobile menu, hero, each section, footer, photos) plus `/api/health`. Needs Java 17+ and Maven; with `npm run api` and `npm run dev` running, `cd karate && mvn test`. Setup and a Karate primer are in `karate/README.md`.

## Styling

Tailwind is on (class names like `text-2xl font-bold mb-4`). Global custom classes like `.hero` live in `src/index.css`.

## Debugging tips

- A blank white page almost always means a JavaScript error. Open DevTools (F12) and read the **Console** tab.
- `npm run check` catches most mistakes before you push.
