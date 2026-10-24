// Server-side checks. The form checks too, but that is only for comfort:
// anyone can skip the form and call the API directly.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normaliseEmail = (email) => String(email ?? '').trim().toLowerCase();

// Returns an error message, or null when the input is fine.
export function validateRegistration({ name, email, password }) {
  if (typeof name !== 'string' || name.trim().length === 0) return 'Name is required';
  if (name.trim().length > 60) return 'Name must be 60 characters or fewer';
  if (!EMAIL_PATTERN.test(normaliseEmail(email))) return 'Enter a valid email address';
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  // bcrypt ignores everything after 72 bytes, so refuse longer ones.
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long';
  return null;
}
