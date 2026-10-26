import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Building2, Bus, CalendarDays, Droplet, Flame, Hospital, House, Shield, Stethoscope, Trash2, Zap } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import Segmented from '../../components/ui/Segmented';
import IconChip from '../../components/ui/IconChip';
import Pill from '../../components/ui/Pill';
import LoadState from '../../components/ui/LoadState';
import Photo from '../../components/Photo';
import { STATUS } from '../../components/ui/tones';
import { pageImages } from '../../assets/images';
import { useApiData } from '../../hooks/useApiData';
import { useFacilities } from './useFacilities';

// One entry per tab. `report` is the report form category it links to.
const SERVICES = [
  { id: 'water', label: 'Water', icon: Droplet, tone: 'blue', report: 'water' },
  { id: 'electricity', label: 'Electricity', icon: Zap, tone: 'amber', report: 'electricity' },
  { id: 'transport', label: 'Transport', icon: Bus, tone: 'purple', report: 'roads' },
  { id: 'waste', label: 'Waste', icon: Trash2, tone: 'green', report: 'waste' },
];

// Why a tab is demo data, shown under it.
const DEMO_REASON = {
  water: 'no water reports from EskomSePush for your area yet, and municipalities publish no open water API.',
  electricity: 'EskomSePush is not set up (ESKOMSEPUSH_TOKEN in .env).',
  transport: 'Gautrain, Rea Vaya and PUTCO have no open live-status API.',
  waste: 'Pikitup and the metros publish no open collection API.',
};

const FACILITY_ICONS = { library: BookOpen, water: Droplet, clinic: Stethoscope, hospital: Hospital, shelter: House, police: Shield, fire: Flame };

const StatusCard = ({ service, info, live }) => {
  const status = STATUS[info.status] ?? STATUS.ok;
  return (
    <section aria-label={`${info.title} status`} className="relative isolate overflow-hidden rounded-3xl p-5 text-white shadow-md">
      <Photo image={pageImages.servicesHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-forest-950/75" />
      <div className="flex items-start gap-3">
        <IconChip icon={service.icon} tone={service.tone} />
        <div className="flex-1">
          <h2 className="text-lg text-white">{info.title}</h2>
          <span className="mt-1 flex flex-wrap gap-2">
            <Pill tone={status.tone}>{status.label}</Pill>
            {!live && <Pill tone="gray">Demo data</Pill>}
          </span>
          <p className="mt-3 text-forest-50">{info.message}</p>
          {info.source && (
            <p className="mt-2 text-xs text-forest-100">
              {info.area ? `${info.area} · ` : ''}Source: {info.source}{info.stale ? ' (last known, may be out of date)' : ''}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

// The mockup's Essential Services tracker (plus a Waste tab for trash pickup).
const ServicesPage = () => {
  const [tab, setTab] = useState('water');
  const { status, data, retry } = useApiData('/services/status');
  const nearby = useFacilities();
  const service = SERVICES.find((s) => s.id === tab);
  const info = data?.services[tab];
  const live = Boolean(data?.live?.includes(tab));
  // Live facilities from OpenStreetMap; the demo list if it can't be reached.
  const facilitiesLive = nearby.status === 'ready' && nearby.data.facilities.length > 0;
  const facilities = facilitiesLive ? nearby.data.facilities : data?.facilities ?? [];

  return (
    <>
      <AppBar
        title="Essential Services"
        back="/dashboard"
        action={<Link to={`/community/report?category=${service.report}`} className="rounded-full border border-white/40 px-3 py-1 text-sm font-semibold text-white no-underline hover:bg-white/10">Report</Link>}
      />
      <main className="page space-y-5">
        <Segmented label="Service" value={tab} onChange={setTab} options={SERVICES.map(({ id, label }) => ({ id, label }))} />

        {status !== 'ready' ? (
          <div className="card"><LoadState status={status} retry={retry} what="service status" /></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <StatusCard service={service} info={info} live={live} />

              {info.schedule.length > 0 && (
                <section aria-labelledby="schedule-title" className="card">
                  <h2 id="schedule-title" className="mb-2 flex items-center gap-2 text-base"><CalendarDays className="size-4" aria-hidden="true" />Schedule</h2>
                  <ul className="divide-y divide-slate-100">
                    {info.schedule.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3 py-2"><span className="font-semibold">{s.when}</span><span className="text-right text-slate-500">{s.what}</span></li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="updates-title" className="card">
                <h2 id="updates-title" className="mb-2 text-base">Latest updates</h2>
                {info.updates.length === 0 ? (
                  <p className="text-sm text-slate-500">No updates right now.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {info.updates.map((u) => (
                      <li key={u.id} className="py-2">
                        <p className="font-semibold">{u.href ? <a href={u.href} target="_blank" rel="noreferrer">{u.title}</a> : u.title}</p>
                        <p className="text-sm text-slate-500">{u.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <section aria-labelledby="facilities-title">
                <h2 id="facilities-title" className="section-label">Nearby Facilities</h2>
                <ul className="card divide-y divide-slate-100 p-0 sm:p-0">
                  {facilities.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                      <IconChip icon={FACILITY_ICONS[f.type] ?? Building2} tone="cyan" size="sm" />
                      <span className="flex-1">
                        <span className="block font-semibold">{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : f.name}</span>
                        <span className="text-sm text-slate-500">{f.detail}</span>
                      </span>
                      <span className="text-sm font-semibold text-forest-700">{f.distanceKm.toFixed(1)} km</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  {facilitiesLive && <>Within 3 km of {nearby.place.name} (change it on the weather card). Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors.</>}
                  {nearby.status === 'loading' && 'Demo data while live facilities load (the first load can take up to a minute)…'}
                  {nearby.status === 'error' && 'Demo data: OpenStreetMap could not be reached. It retries in a few minutes.'}
                  {nearby.status === 'ready' && !facilitiesLive && `Demo data: nothing mapped within 3 km of ${nearby.place.name} on OpenStreetMap yet.`}
                </p>
              </section>

              <section className="card text-center">
                <h2 className="mb-1 text-base">Report a Problem</h2>
                <p className="mb-4 text-slate-600">See a problem? Help your community by reporting it directly.</p>
                <Link to={`/community/report?category=${service.report}`} className="btn w-full">Report Now</Link>
              </section>
              {!live && <p className="text-xs text-slate-500">{info.title} is demo data: {DEMO_REASON[tab]}</p>}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ServicesPage;
