// Copies accounts from the old SQLite file (data/app.db) into the database
// the app uses now (DATABASE_URL, or local PGlite). Safe to run twice:
// emails that already exist are skipped. Stop `npm run api` first when using
// PGlite, since only one program can open data/pglite at a time.
//   npm run db:import-sqlite            (reads data/app.db)
//   npm run db:import-sqlite -- other.db
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';
import { openDatabase } from '../db.js';
import { users } from '../schema.js';

dotenv.config();
const file = process.argv[2] ?? 'data/app.db';
if (!existsSync(file)) {
  console.log(`No ${file}, nothing to import.`);
  process.exit(0);
}

const old = new DatabaseSync(file, { readOnly: true });
const rows = old.prepare('SELECT email, name, password_hash, created_at FROM users').all();
if (!rows.length) {
  console.log('No accounts in the old file.');
  process.exit(0);
}
const db = await openDatabase({ url: process.env.DATABASE_URL, dir: process.env.PGLITE_DIR || 'data/pglite' });

// The bcrypt hashes move as they are, so everyone keeps their password.
const added = await db
  .insert(users)
  .values(rows.map((r) => ({ email: r.email, name: r.name, passwordHash: r.password_hash, createdAt: new Date(`${r.created_at}Z`) })))
  .onConflictDoNothing({ target: users.email })
  .returning({ email: users.email });

console.log(`Imported ${added.length} of ${rows.length} accounts into ${db.kind}.`);
await db.close();
