import bcrypt from 'bcryptjs';

// Cost 12 (about 250 ms per hash) is slow on purpose: fine for one login,
// painful for millions of guesses. Tests use 4 to stay fast.
const COST = process.env.NODE_ENV === 'test' ? 4 : 12;

export const hashPassword = (password) => bcrypt.hash(password, COST);

// bcrypt reads the salt and cost back out of the stored hash.
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

// Compared against when the email isn't found, so an unknown email takes as
// long as a wrong password and timing doesn't reveal which emails exist.
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);
