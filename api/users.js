import { eq, lt } from 'drizzle-orm';
import { revokedTokens, users } from './schema.js';

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

// Logout: remember the token's id until it would have expired anyway, then
// sweep out the ones that have. Saying it twice (two tabs) is fine.
export async function revokeToken(db, { jti, exp }) {
  await db.insert(revokedTokens).values({ jti, expiresAt: new Date(exp * 1000) }).onConflictDoNothing();
  await db.delete(revokedTokens).where(lt(revokedTokens.expiresAt, new Date()));
}

export async function isRevoked(db, jti) {
  const [row] = await db.select({ jti: revokedTokens.jti }).from(revokedTokens).where(eq(revokedTokens.jti, jti)).limit(1);
  return Boolean(row);
}
