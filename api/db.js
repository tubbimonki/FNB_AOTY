import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// SQLite keeps the whole database in one file (data/app.db), so there is no
// database server to install. node:sqlite is built into Node 22.13+; it prints
// an "experimental" warning on start, which is safe to ignore.
//
// Each statement runs once on startup. IF NOT EXISTS makes that harmless on
// every later start. To change a table later, add a new statement below
// rather than editing an old one (that is what "migrations" are).
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// Pass ':memory:' for a throwaway database (tests use this).
export function openDatabase(file = 'data/app.db') {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}
