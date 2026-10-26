import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Cpu, Gift, Newspaper, Package, Search, ShieldAlert, Truck, Wine } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import IconChip from '../../components/ui/IconChip';
import Pill from '../../components/ui/Pill';
import ListRow, { ListCard } from '../../components/ui/ListRow';
import { loadJSON, saveJSON } from '../../services/storage';
import { ALL_ITEMS, DROP_OFFS, MATERIALS } from './recyclingData';
import { useWide } from '../../hooks/useWide';
import RelatedGuides from '../guides/RelatedGuides';
import { COLLECTION_KEY, WEEKDAYS, nextCollection } from './collection';

const ICONS = { plastic: Package, glass: Wine, paper: Newspaper, metal: Package, ewaste: Cpu };

const prettyDate = (date) => new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });

// The mockup's Recycling & Waste Guide.
const RecyclingPage = () => {
  const [materialId, setMaterialId] = useState('plastic');
  const [query, setQuery] = useState('');
  const [weekday, setWeekday] = useState(() => loadJSON(COLLECTION_KEY, 2));
  const material = MATERIALS.find((m) => m.id === materialId);
  const wide = useWide();

  useEffect(() => {
    saveJSON(COLLECTION_KEY, weekday);
  }, [weekday]);

  const q = query.trim().toLowerCase();
  const results = q ? ALL_ITEMS.filter((r) => r.item.toLowerCase().includes(q)) : [];

  return (
    <>
      <AppBar title="Recycling & Waste Guide" back="/eco" />
      <main className="page grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_22rem_22rem]">
        <div className="space-y-5">
          <label className="relative block">
            <span className="sr-only">Search items</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Can I recycle… (e.g. bottles)" className="input rounded-full pl-10" />
          </label>

          {q ? (
            <section aria-label="Search results" className="card">
              {results.length === 0 ? (
                <p className="text-slate-600">No match. When in doubt, leave it out: one dirty item can spoil a whole bag.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <li key={`${r.material}-${r.item}`} className="flex items-center justify-between gap-3 py-2">
                      <span>{r.item} <span className="text-sm text-slate-500">· {r.material}</span></span>
                      <Pill tone={r.accepted ? 'green' : 'red'}>{r.accepted ? 'Recycle' : 'Not accepted'}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <>
              <div role="group" aria-label="Material" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {MATERIALS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={m.id === materialId}
                    onClick={() => setMaterialId(m.id)}
                    className={`card flex flex-col items-center gap-2 p-3 text-sm font-semibold sm:p-3 ${m.id === materialId ? 'border-forest-500 ring-2 ring-forest-500/30' : ''}`}
                  >
                    <IconChip icon={ICONS[m.id]} tone={m.tone} />
                    {m.label}
                  </button>
                ))}
              </div>

              <section aria-labelledby="material-title" className="card">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 id="material-title" className="text-base">Recyclable {material.label} Items</h2>
                  <Pill tone="green">{material.bin}</Pill>
                </div>
                <ul className="mb-4 flex flex-wrap gap-2">
                  {material.yes.map((item) => <li key={item} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{item}</li>)}
                </ul>
                <h3 className="mb-2 text-sm text-red-700">Not accepted</h3>
                <ul className="flex flex-wrap gap-2">
                  {material.no.map((item) => <li key={item} className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-800">{item}</li>)}
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="space-y-4">
          <section aria-labelledby="collection-title" className="card flex gap-3">
            <IconChip icon={CalendarDays} tone="green" />
            <div className="flex-1">
              <h2 id="collection-title" className="text-base">Collection Schedule</h2>
              <p className="text-slate-600">Next collection: <strong>{prettyDate(nextCollection(weekday))}</strong></p>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <span>My collection day</span>
                <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="input min-h-9 w-auto py-1">
                  {WEEKDAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}
                </select>
              </label>
            </div>
          </section>

          <ListCard>
            {DROP_OFFS.map((d) => (
              <li key={d.id}><ListRow icon={d.id === 'depot' ? Truck : Gift} tone={d.id === 'depot' ? 'purple' : 'red'} title={d.title} subtitle={d.detail} to={`/map?filter=${d.filter}`} /></li>
            ))}
          </ListCard>

          <Link to="/alerts#checklist" className="card card-link flex items-center gap-3 border-0 bg-forest-900 text-white no-underline">
            <ShieldAlert className="size-8 shrink-0 text-sprout" aria-hidden="true" />
            <span><span className="block font-bold">Prepare for a national disaster</span><span className="text-sm text-forest-100">Emergency checklist and contacts</span></span>
          </Link>
        </div>

        {wide && (
          <aside aria-label="Recycling guides">
            <RelatedGuides ids={['g3', 'g5']} title="Recycling guides" />
          </aside>
        )}
      </main>
    </>
  );
};

export default RecyclingPage;
