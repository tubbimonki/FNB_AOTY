// Event times in South African time, whatever the phone's time zone is.
const SA = 'Africa/Johannesburg';
const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { timeZone: SA, weekday: 'short', day: 'numeric', month: 'short' });
const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: SA, hour: '2-digit', minute: '2-digit', hour12: false });

// "Sat 7 Nov · 09:00–10:30", or "Sat 12 Dec – Sun 13 Dec" for a multi-day event.
export function eventWhen({ startsAt, endsAt }) {
  const startDay = day(startsAt);
  const endDay = day(endsAt);
  if (startDay !== endDay) return `${startDay} – ${endDay}`;
  return `${startDay} · ${time(startsAt)}–${time(endsAt)}`;
}

// For the date badge on the photo: { day: '7', month: 'Nov' }
export function dateBadge(iso) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-GB', { timeZone: SA, day: 'numeric' }),
    month: d.toLocaleDateString('en-GB', { timeZone: SA, month: 'short' }),
  };
}
