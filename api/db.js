import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MIGRATIONS = fileURLToPath(new URL('./migrations', import.meta.url));

// Opens the database and brings its tables up to date.
// url set (DATABASE_URL): a real Postgres server, e.g. Neon in production.
// No url: PGlite, the same Postgres compiled to WebAssembly, running inside
// Node. It keeps its files in `dir`, or only in memory when dir is ':memory:'
// (tests). Same SQL either way, so code tested on PGlite runs on Neon.
// Returns a Drizzle db with db.close() added.
export async function openDatabase({ url, dir = 'data/pglite' } = {}) {
  let db;
  let close;
  if (url) {
    const { default: pg } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    // A pool keeps a few connections open and lends one to each query.
    const pool = new pg.Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 5) });
    pool.on('error', (err) => console.error('Postgres:', err.message)); // a dropped idle connection shouldn't crash the app
    db = drizzle({ client: pool });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    close = () => pool.end();
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const memory = dir === ':memory:';
    if (!memory) mkdirSync(dir, { recursive: true });
    const client = memory ? new PGlite() : new PGlite(dir);
    db = drizzle({ client });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    close = () => client.close();
  }
  db.close = close;
  db.kind = url ? 'postgres' : 'pglite';
  return db;
}

// Postgres error code for "this would break a UNIQUE rule".
export const isUniqueViolation = (err) => (err?.code ?? err?.cause?.code) === '23505';
