import dotenv from 'dotenv';
import { DEFAULT_BASE_URL } from '../eskom.js';

// Finds the ids you need for .env. Each call uses 1 of your daily credits.
//   npm run eskom:areas -- "fourways"              area ids for a suburb
//   npm run eskom:areas -- --area <area id>        that area's info, incl. its schedule ids
//   npm run eskom:areas -- --schedule <schedule id> the raw schedule the app reads
//   npm run eskom:areas -- --reports <area id> [electricity|water]  the raw neighbour reports the app reads
dotenv.config();

const args = process.argv.slice(2);
const token = process.env.ESKOMSEPUSH_TOKEN;
const base = process.env.ESKOMSEPUSH_BASE_URL || DEFAULT_BASE_URL;

if (args.length === 0) {
  console.error('Use: npm run eskom:areas -- "fourways"  |  -- --area <area id>  |  -- --schedule <schedule id>  |  -- --reports <area id>');
  process.exit(1);
}
if (!token) {
  console.error('ESKOMSEPUSH_TOKEN is missing from .env.');
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers: { Token: token } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`EskomSePush answered ${res.status}: ${body.error ?? ''}`);
    process.exit(1);
  }
  console.log(`(credits left today: ${res.headers.get('x-ratelimit-remaining') ?? '?'})\n`);
  return body;
}

if (args[0] === '--schedule') {
  console.log(JSON.stringify(await get(`/schedule?id=${encodeURIComponent(args[1] ?? '')}`), null, 2));
} else if (args[0] === '--reports') {
  const category = encodeURIComponent(args[2] ?? 'electricity');
  console.log(JSON.stringify(await get(`/reports?id=${encodeURIComponent(args[1] ?? '')}&category=${category}`), null, 2));
} else if (args[0] === '--area') {
  // Printed in full: copy the schedule id (like eskde-10) into ESKOMSEPUSH_SCHEDULE
  // and the area id into ESKOMSEPUSH_AREA.
  console.log(JSON.stringify(await get(`/area?id=${encodeURIComponent(args[1] ?? '')}`), null, 2));
} else {
  const { areas = [] } = await get(`/areas_search?text=${encodeURIComponent(args.join(' '))}`);
  if (areas.length === 0) console.log('No areas found. Try a shorter or different name.');
  for (const area of areas) {
    const place = [area.name, area.municipality, area.province, area.region].filter(Boolean).join(', ');
    console.log(`${area.id}\n  ${place}\n`);
  }
}
