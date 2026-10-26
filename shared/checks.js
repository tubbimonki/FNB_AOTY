// Small input checks shared by the API modules.

// Ids the browser makes with crypto.randomUUID() (older logs may use other short ids).
export const isClientId = (id) => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);

// "2026-10-25", and a real date (not 2026-02-31).
export function isDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// Today in South Africa as "YYYY-MM-DD" (the server runs on UTC).
export const todaySA = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
