import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Bell, CalendarCheck, Megaphone, TriangleAlert, Zap } from 'lucide-react';
import { ago } from '../community/ago';
import { useNotifications } from './useNotifications';

const minutesSince = (iso) => Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));

const ICONS = { badge: Award, event: CalendarCheck, report: Megaphone, service: Zap, alert: TriangleAlert };

// The bell on the dashboard. Opens a small panel with what's happening
// right now (live alerts for your place) and recent updates (from the bus).
// The dot shows when there are updates you haven't seen, or live alerts.
const NotificationBell = ({ alerts = [], place = '' }) => {
  const { items, unread, markSeen } = useNotifications(place);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const box = useRef(null);
  const urgent = alerts.filter((a) => a.severity !== 'info');
  const count = unread + urgent.length;

  // Close on Escape or a click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onClick = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

  const toggle = () => {
    if (!open) markSeen();
    setOpen(!open);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Notifications (${count})`}
        className="relative grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <Bell className={`size-5 ${count > 0 && !open ? 'motion-safe:animate-bell' : ''}`} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-forest-950 ring-2 ring-forest-900">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute top-12 right-0 z-40 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-2xl bg-white p-3 text-slate-800 shadow-xl ring-1 ring-black/5 motion-safe:animate-pop"
        >
          <h2 className="px-1 text-xs font-semibold tracking-widest text-slate-500 uppercase">Right now</h2>
          {urgent.length === 0 && <p className="px-1 py-2 text-sm text-slate-600">No warnings for {place || 'your area'}. 🌤️</p>}
          <ul className="mb-2">
            {urgent.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link to="/alerts" className="flex gap-2 rounded-xl px-1 py-2 text-sm text-slate-800 no-underline hover:bg-slate-50">
                  <span aria-hidden="true">{a.icon}</span>
                  <span><strong className="block">{a.title}</strong><span className="text-xs text-slate-500">{a.where}</span></span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="border-t border-slate-100 px-1 pt-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">Updates</h2>
          {items.length === 0 && <p className="px-1 py-2 text-sm text-slate-600">Nothing yet. Log an action or join an event to earn badges.</p>}
          <ul className="scroll-box max-h-72" aria-label="Updates">
            {items.map((n) => {
              const Icon = ICONS[n.kind] ?? Bell;
              return (
                <li key={n.id}>
                  <Link to={n.href ?? '/dashboard'} className="flex gap-2 rounded-xl px-1 py-2 text-sm text-slate-800 no-underline hover:bg-slate-50">
                    <Icon className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden="true" />
                    <span className="min-w-0">
                      <strong className="block">{n.title}</strong>
                      {n.body && <span className="block text-slate-600">{n.body}</span>}
                      <span className="text-xs text-slate-500">{ago(minutesSince(n.createdAt))}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
