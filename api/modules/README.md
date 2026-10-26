# Feature modules

Each folder is one feature of the modular monolith. A module is a plain object:

```js
export default {
  name: 'community',                          // mounted at /api/community
  events: { emits: [...], listens: [...] },   // what it says / hears on the bus
  subscribe({ db, bus }) { ... },             // optional: bus.on(...) listeners, run once at start
  router({ db, jwtSecret, bus, ... }) { ... }, // an Express Router
};
```

Its tables live next to it in `schema.js` (Drizzle). After changing a
`schema.js`, run `npm run db:generate` (see GUIDE.md, Database).

| Module        | Routes (under /api/<name>)                                        | Tables / data | Bus |
|---------------|-------------------------------------------------------------------|---------------|-----|
| alerts        | `GET /`, `GET /saws`, `GET`/`PUT /checklist`                      | live alerts from 4 sources; `checklist_ticks` | emits `alert.issued`, `checklist.saved` |
| community     | `GET /pins`, `GET /updates`, `POST /reports`, `GET /reports/mine` | `reports`; pins/updates are sample data | emits `report.created` |
| events        | `GET /`, `GET /:id`, `POST`/`DELETE /:id/attend`                  | `events` (seeded from shared/events.js), `event_attendees` | emits `event.attended`, `event.cancelled` |
| reactions     | `GET /events`, `GET /events/:id`, `POST /events/:id`              | `event_reactions` (optionally its own database) | emits `reaction.added`, `reaction.removed` |
| services      | `GET /status`, `GET /facilities`                                  | EskomSePush and OpenStreetMap, cached in `api_cache`; transport/waste demo | emits `service.changed` |
| eco           | `POST /footprint`, `GET`/`PUT /footprint/mine`, water logs, `GET`/`PUT /prefs/:key` | `footprints`, `water_logs`, `eco_prefs` (recycling day) | emits `water.logged`, `footprint.saved` |
| wallet        | `GET`/`POST /logs`, `POST /logs/sync`, `DELETE /logs/:id`         | `wallet_logs` | emits `log.created` |
| impact        | `GET /me`, `GET /awards`                                          | reads the tables above; owns `impact_awards`, `impact_badges` | hears all of the above, emits `badge.unlocked` |
| notifications | `GET /?place=`                                                    | `notifications` | hears `badge.unlocked`, `event.attended`, `report.created`, `service.changed`, `alert.issued` |

Rules that keep the modules independent:

- A module only writes its own tables. (impact reads the others' log tables,
  so there is one copy of each log; its own rewards and badges it writes itself.)
- Modules never import each other's code. They share pure code from
  `shared/` and talk through events on the bus (`api/bus.js`).
- Every event in `events.emits` must really be emitted, and every event in
  `events.listens` must be emitted by some module: `api/modules.test.js` checks.
- Every personal route filters by `req.user.id`, never by an id the browser sends.
- `FEATURES_OFF=community,impact` in `.env` switches modules off.
