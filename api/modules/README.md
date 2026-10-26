# Feature modules

Each folder is one feature of the modular monolith (see the backend
assessment doc). A module is a plain object:

```js
export default {
  name: 'community',                 // mounted at /api/community
  events: { emits: [...], listens: [...] },  // what it says / hears on the bus
  subscribe({ db, bus }) { ... },    // optional: bus.on(...) listeners, run once at start
  router({ db, jwtSecret, bus }) { ... }, // an Express Router
};
```

and its tables live next to it in `schema.js` (Drizzle). After changing a
`schema.js`, run `npm run db:generate` (see GUIDE.md, Database).

| Module    | Routes                                                         | Data             |
|-----------|----------------------------------------------------------------|------------------|
| alerts    | `GET /api/alerts`, `GET`/`PUT /checklist`                      | live alerts from 4 sources; checklist ticks in `checklist_ticks` |
| community | `GET /pins`, `GET /updates`, `POST /reports`, `GET /reports/mine` | reports in `reports`; pins/updates are sample data |
| events    | `GET /api/events`, `GET /:id`, `POST`/`DELETE /:id/attend`     | `events` (seeded from shared/events.js at start), `event_attendees`; emits `event.attended` / `event.cancelled` |
| services  | `GET /api/services/status`, `GET /api/services/facilities`      | live power/water (EskomSePush), live facilities (OpenStreetMap), both cached in `api_cache`; demo transport/waste |
| eco       | `POST /footprint`, `GET`/`PUT /footprint/mine`, `GET`/`POST /water/logs`, `POST /water/logs/sync`, `DELETE /water/logs/:id` | `footprints`, `water_logs` |
| wallet    | `GET`/`POST /logs`, `POST /logs/sync`, `DELETE /logs/:id`      | `wallet_logs`    |
| impact    | `GET /api/impact/me`, `GET /awards`                            | worked out from the tables above, plus `impact_awards` filled by listening for `event.attended` |

Rules that keep the modules independent:

- A module only writes its own tables. (impact reads the others' tables
  for now; with the event bus it would keep its own points table instead.)
- Modules never import each other's code. They share pure code from
  `shared/` and talk through events on the bus (`api/bus.js`).
- Every personal route filters by `req.user.id`, never by an id the browser sends.
- `FEATURES_OFF=community,impact` in `.env` switches modules off.

Each `index.js` has `TODO(...)` comments for what is still missing.
