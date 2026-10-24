// Every SQL query about users lives here, so routes never write SQL.
// The ? placeholders are filled in by SQLite itself, which is what stops
// SQL injection. Never build a query with `${...}`.

export function createUser(db, { email, name, passwordHash }) {
  const result = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run(email, name, passwordHash);
  return findUserById(db, Number(result.lastInsertRowid));
}

export function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function findUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// The shape the frontend sees. password_hash must never leave the server.
export function toPublicUser(row) {
  return { id: row.id, email: row.email, name: row.name };
}
