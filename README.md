# Eco 5.0 (FNB App of the Year)

Prepare. Save. Protect. A climate-change web app for South African households: weather and climate alerts with an emergency checklist, a community map and reports, essential services status, and Eco-Impact (Green Wallet, carbon footprint, water usage, recycling guide, points and badges). React + Vite + Tailwind frontend, Express API backend split into feature modules, Postgres database (Neon in production, PGlite locally).

```bash
npm install
# first time only: copy .env.example to .env and set JWT_SECRET (instructions inside)
npm run dev     # website at http://localhost:5173
npm run api     # API at http://localhost:4000/api/health (second terminal)
npm run check   # lint + tests + build, run before pushing
```

Deploy: one Express server serves the site and the API (Render, `render.yaml`) with `DATABASE_URL` pointing at Neon. See "Deploying" and "Database" in GUIDE.md.

Read [GUIDE.md](GUIDE.md) for the folder layout and where new work (auth, dashboards, API routes, tests) goes.
