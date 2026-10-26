# demo-assets (offline demo backup)

A snapshot for presenting Eco 5.0 when the venue Wi-Fi or an outside API
lets you down. Nothing in the app, the build or the tests reads this folder:
it is a backup you can open by hand, and it is not deployed (Vite only
bundles `src/` and `public/`).

| Folder | What is in it | Where it came from |
| --- | --- | --- |
| `api/` | JSON answers from our own API (`/api/alerts`, `/api/news`, `/api/services/status`, `/api/services/facilities`, `/api/notifications`), plus a raw Open-Meteo answer and a failed weather call | saved from the running app |
| `photos/` | the Unsplash photos listed in `src/assets/images.js` | Unsplash (free licence) |
| `tiles/` | OpenStreetMap tiles at zoom 13 around Johannesburg, for screenshots of the map | © OpenStreetMap contributors |

Notes:

- `api/weather.error.txt` is a real 503 from the moment Open-Meteo was rate
  limited, kept on purpose to show the error state.
- The snapshot holds no personal data (no accounts, no logs); keep it that way
  before committing a new one.
- If it ever grows big, move it out of git (a release attachment, or Google
  Drive) and delete the folder; nothing will break.
