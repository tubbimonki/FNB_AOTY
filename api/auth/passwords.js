import bcrypt from 'bcryptjs';

// Cost 12 = 2^12 rounds, roughly 250 ms per hash. Slow on purpose: fine for
// one login, painful for an attacker trying millions of guesses.
// Tests use 4 so the suite stays fast; the algorithm is identical.
const COST = process.env.NODE_ENV === 'test' ? 4 : 12;

export const hashPassword = (password) => bcrypt.hash(password, COST);

// bcrypt reads the salt and cost back out of the stored hash, then compares.
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

// Compared against when the email isn't found, so "no such user" takes as
// long as "wrong password" and response times don't reveal which emails exist.
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);
