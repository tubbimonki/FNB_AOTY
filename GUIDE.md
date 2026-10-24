# How this app fits together

`README.md` is the quick start; this file explains where things live and where new work goes.

## Commands

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
    green-wallet/        actions.js (the action list), totals.js (maths), useLogs.js (saved logs), TrackerPage.jsx
    dashboard/           DashboardPage.jsx (placeholder, data wired, styling TODO)
    auth/                placeholder auth: AuthProvider, useAuth, RequireAuth, LoginPage
  services/              talking to the outside world: api.js (fetch wrapper), storage.js (localStorage)
  hooks/                 hooks shared by several features (useApiHealth)
  test/                  test setup + renderWithProviders helper
  assets/                images imported from code
api/
  index.js               starts the Express server
  app.js                 builds the Express app (routes are mounted here)
  routes/                one file per route group (health.js so far)
public/                  copied as-is into the site (favicon)
_old/                    leftovers from the plain-HTML version. Nothing uses them.
```

Rule of thumb: if it belongs to one feature, it lives in that feature's folder. Move it to `components/`, `hooks/` or `services/` only once a second feature needs it.

## Where new work goes

- **New feature:** make `src/features/<name>/`, put its page there, add a `<Route>` in `App.jsx` and a line in `navItems.js`.
- **Members-only page:** wrap the route element in `<RequireAuth>` (see `/dashboard` in `App.jsx`).
- **Auth:** everything outside `features/auth/` only calls `useAuth()` and gets `{ user, login, logout }`. To add a real provider, change `AuthProvider.jsx` (and `LoginPage.jsx` for the form). Put keys in `.env`. Search for `TODO(auth)` to find every hook point, including the token header in `services/api.js` and the API route in `api/app.js`.
- **Dashboard:** `DashboardPage.jsx` already gets real totals from `useLogs()` + `calculateTotals()`. `calculateTotalsByDate()` gives per-day numbers for a chart. Search `TODO(dashboard)`.
- **New API route:** add `api/routes/<name>.js` (an Express `Router`), mount it in `api/app.js` under `/api/<name>`, call it from the frontend with `apiGet('/<name>')` from `services/api.js`. Never write `localhost:4000` in the frontend; Vite's proxy forwards `/api`.

## Tests

Vitest runs tests and React Testing Library renders components in a fake browser (jsdom). Test files sit next to the code they test and end in `.test.js` / `.test.jsx`.

- `src/App.test.jsx`: smoke tests that pages render, Green Wallet logs an action, and `/dashboard` needs login.
- `src/features/green-wallet/totals.test.js`: the CO2 / rand maths.
- `api/app.test.js`: starts the API on a random port and checks `/api/health`.

To test a component that uses routing or auth, render it with `renderWithProviders(ui, { route, user })` from `src/test/`.

## Styling

Tailwind is on (class names like `text-2xl font-bold mb-4`). Global custom classes like `.hero` live in `src/index.css`. Dashboard styling is still open.

## Debugging tips

- A blank white page almost always means a JavaScript error. Open DevTools (F12) and read the **Console** tab.
- `npm run check` catches most mistakes before you push.
