# Eco 5.0 (FNB App of the Year)

Prepare. Save. Protect. A climate-change web app for South African households: live weather and climate alerts with an emergency checklist, a community map with reports and events, essential services status (EskomSePush, OpenStreetMap), and Eco-Impact (Green Wallet, carbon footprint, water usage, recycling guide, points, badges and Premium), with a notification bell and a floating impact tracker.

React + Vite + Tailwind frontend, Express API split into feature modules that talk over an event bus, Postgres database (Neon in production, PGlite locally). [GUIDE.md](GUIDE.md) explains the structure, the event bus and where new work goes.

## Run it locally

```bash
npm install
# first time only: copy .env.example to .env and set JWT_SECRET (instructions inside)
npm run dev     # website at http://localhost:5173
npm run api     # API at http://localhost:4000/api/health (second terminal)
npm run check   # lint + tests + build, run before pushing
```

End-to-end tests: with both running, `cd karate && mvn test` (Java 17+ and Maven, see `karate/README.md`).

## Deploy checklist (Render + Neon)

1. **Neon:** create a project, then Dashboard → Connect → copy the connection string (`postgresql://...?sslmode=require`). Use the same string on your PC and on Render so both share accounts and the EskomSePush cache.
2. **Repo:** commit everything, including `api/migrations/meta/` (Drizzle needs it at start), `.node-version` and `.npmrc` (one line: `include=dev`; in PowerShell `Set-Content .npmrc "include=dev"`).
3. **Render:** New → Blueprint → this repo (reads `render.yaml`). Or a Web Service by hand with Build `npm ci --include=dev && npm run build`, Start `npm start`, Health check `/api/health`.
4. **Environment on Render:** `DATABASE_URL` (Neon), `JWT_SECRET` (long and random), `NODE_ENV=production`, `TRUST_PROXY=1`, `NODE_VERSION=22`; optional `ESKOMSEPUSH_TOKEN`, `ESKOMSEPUSH_AREA`, `ESKOMSEPUSH_SCHEDULE`, `DEMO_EMAIL`, `DEMO_PASSWORD`.
5. **Check:** the deploy log ends with `Database: Postgres (DATABASE_URL)`. Open `/api/health` (ok), `/api/health/ip` (your real IP) and `/api/features` (the modules that are on).

Without `DATABASE_URL` the production server stops on purpose: the local PGlite fallback needs more memory than Render's free plan has. Details in "Deploying" in GUIDE.md.
