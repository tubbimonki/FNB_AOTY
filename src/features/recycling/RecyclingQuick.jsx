import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import Pill from '../../components/ui/Pill';
import { ALL_ITEMS, MATERIALS } from './recyclingData';
import { nextCollection, useCollectionDay } from './collection';

const prettyDate = (date) => new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' });

// Small recycling card for the wide-screen side columns: next collection day,
// a "Can I recycle…?" box and the bin for one material (plastic by default,
// e-waste next to the pollution guide).
const RecyclingQuick = ({ material = 'plastic', className = '' }) => {
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [weekday] = useCollectionDay();
  const m = MATERIALS.find((x) => x.id === material) ?? MATERIALS[0];
  const q = query.trim().toLowerCase();
  const results = q ? ALL_ITEMS.filter((r) => r.item.toLowerCase().includes(q)).slice(0, 4) : [];

  return (
    <section aria-labelledby={titleId} className={`card ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-2 text-base"><Recycle className="size-4 text-emerald-700" aria-hidden="true" />Recycling</h2>
        <Link to="/eco/recycling" className="text-sm font-semibold">Guide →</Link>
      </div>
      <p className="text-sm text-slate-600">Next collection: <strong>{prettyDate(nextCollection(weekday))}</strong></p>
      <p className="mt-1 text-sm text-slate-600">{m.label}: <strong>{m.bin}</strong></p>
      <label className="mt-3 block">
        <span className="sr-only">Can I recycle it?</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Can I recycle… (e.g. cans)" className="input min-h-10 rounded-full py-1.5 text-sm" />
      </label>
      {q && (
        <ul aria-label="Recycling answers" className="mt-2 divide-y divide-slate-100 text-sm">
          {results.length === 0 && <li className="py-1.5 text-slate-600">No match. When in doubt, leave it out.</li>}
          {results.map((r) => (
            <li key={`${r.material}-${r.item}`} className="flex items-center justify-between gap-2 py-1.5">
              <span>{r.item}</span>
              <Pill tone={r.accepted ? 'green' : 'red'}>{r.accepted ? 'Yes' : 'No'}</Pill>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RecyclingQuick;
