import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, Landmark, Phone, Plus, ShieldCheck, Truck, Users } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import Segmented from '../../components/ui/Segmented';
import ListRow, { ListCard } from '../../components/ui/ListRow';
import IconChip from '../../components/ui/IconChip';
import LoadState from '../../components/ui/LoadState';
import Pill from '../../components/ui/Pill';
import { useApiData } from '../../hooks/useApiData';
import { useAuth } from '../auth/useAuth';
import { REPORT_CATEGORIES } from '../../../shared/reports';
import EventsCarousel from './EventsCarousel';
import { ago } from './ago';
import { EMERGENCY_CONTACTS, RELIEF_LINKS } from './helpContacts';

const UPDATE_ICONS = {
  road: { icon: ShieldCheck, tone: 'green' },
  water: { icon: Truck, tone: 'blue' },
  community: { icon: Users, tone: 'green' },
};

const Nearby = () => {
  const { status, data, retry } = useApiData('/community/updates');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <section aria-labelledby="updates-title">
          <h2 id="updates-title" className="section-label">Local Updates</h2>
          {status !== 'ready' ? (
            <div className="card"><LoadState status={status} retry={retry} what="local updates" /></div>
          ) : (
            <ul className="space-y-3">
              {data.updates.map((u) => {
                const look = UPDATE_ICONS[u.kind] ?? UPDATE_ICONS.community;
                return (
                  <li key={u.id} className="card flex items-center gap-3 p-4 sm:p-4">
                    <IconChip icon={look.icon} tone={look.tone} />
                    <div>
                      <p className="font-semibold">{u.title}</p>
                      <p className="text-sm text-slate-500">{ago(u.minutesAgo)} · {u.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        {data?.events?.length > 0 && <EventsCarousel events={data.events} />}
      </div>

      <section aria-labelledby="help-title">
        <h2 id="help-title" className="section-label">Get Help</h2>
        <div className="space-y-3">
          {/* <details> opens and closes with no JavaScript, and is keyboard friendly. */}
          <details className="card group p-0 sm:p-0">
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
              <IconChip icon={Phone} tone="red" />
              <span className="flex-1"><span className="block font-semibold">Emergency Contacts</span><span className="text-sm text-slate-500">Police, ambulance, fire & disaster</span></span>
              <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">›</span>
            </summary>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {EMERGENCY_CONTACTS.map((c) => (
                <li key={c.id}>
                  <a href={`tel:${c.number}`} className="flex min-h-12 items-center justify-between px-4 py-2 no-underline hover:bg-forest-50">
                    <span className="text-forest-950">{c.name}</span><span className="font-bold">{c.number}</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <ListCard>
            <li><ListRow icon={Landmark} tone="blue" title="Municipal Services" subtitle="Report issues or get assistance" to="/services" /></li>
          </ListCard>

          <details className="card group p-0 sm:p-0">
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
              <IconChip icon={HandHeart} tone="green" />
              <span className="flex-1"><span className="block font-semibold">Relief Funds & Assistance</span><span className="text-sm text-slate-500">Apply for help or donate goods</span></span>
              <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">›</span>
            </summary>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {RELIEF_LINKS.map((r) => (
                <li key={r.id}><ListRow title={r.name} subtitle={r.detail} href={r.href} /></li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
};

const categoryLabel = (id) => REPORT_CATEGORIES.find((c) => c.id === id)?.label.split(' (')[0] ?? id;

const MyReports = () => {
  const { status, data, retry } = useApiData('/community/reports/mine');
  if (status !== 'ready') return <div className="card"><LoadState status={status} retry={retry} what="your reports" /></div>;
  if (data.reports.length === 0) {
    return (
      <div className="card text-center">
        <p className="mb-3 text-slate-600">You haven't reported anything yet.</p>
        <Link to="/community/report" className="btn">Report a problem</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {data.reports.map((r) => (
        <li key={r.id} className="card">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-semibold">{categoryLabel(r.category)}</p>
            <Pill tone="blue">{r.status}</Pill>
          </div>
          <p className="text-slate-600">{r.description}</p>
          <p className="mt-2 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('en-ZA')}</p>
        </li>
      ))}
    </ul>
  );
};

// The mockup's Community screen: Nearby (updates, events, help) and My Reports.
const CommunityPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState('nearby');

  return (
    <>
      <AppBar
        title="Community"
        back="/dashboard"
        action={
          <Link to="/community/report" aria-label="Report a problem" className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10">
            <Plus className="size-5" aria-hidden="true" />
          </Link>
        }
      />
      <main className="page space-y-5">
        <Segmented
          dark
          label="Show"
          value={view}
          onChange={setView}
          className="max-w-sm"
          options={[{ id: 'nearby', label: 'Nearby' }, { id: 'mine', label: 'My Reports' }]}
        />
        {view === 'nearby' && <Nearby />}
        {view === 'mine' &&
          (user ? (
            <MyReports />
          ) : (
            <div className="card text-center">
              <p className="mb-3 text-slate-600">Log in to see the problems you've reported.</p>
              <Link to="/login" state={{ from: '/community' }} className="btn">Log in</Link>
            </div>
          ))}
      </main>
    </>
  );
};

export default CommunityPage;
