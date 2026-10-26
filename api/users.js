import { eq } from 'drizzle-orm';
import { users } from './schema.js';

// Every query about users. Drizzle turns these into SQL with $1-style
// placeholders that Postgres fills in, which is what stops SQL injection.

export async function createUser(db, { email, name, passwordHash }) {
  const [user] = await db.insert(users).values({ email, name, passwordHash }).returning();
  return user;
}

export async function findUserByEmail(db, email) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function findUserById(db, id) {
  if (!Number.isSafeInteger(id)) return undefined; // a junk token id must not reach the query
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

// The shape the frontend sees. passwordHash must never leave the server.
export function toPublicUser(row) {
  return { id: row.id, email: row.email, name: row.name };
}
