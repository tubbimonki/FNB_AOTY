import { useState } from 'react';
import { Check, Lightbulb } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import Segmented from '../../components/ui/Segmented';
import IconChip from '../../components/ui/IconChip';
import Photo from '../../components/Photo';
import { pageImages } from '../../assets/images';
import { ProgressRings } from '../green-wallet/ProgressRings';
import { today } from '../green-wallet/totals';
import { useWaterLogs } from './useWaterLogs';
import WeeklyBars from './WeeklyBars';
import { useWide } from '../../hooks/useWide';
import RelatedGuides from '../guides/RelatedGuides';
import { DAILY_GOAL_L, SA_AVERAGE_L, WATER_USES, lastWeek, litresByDate } from './water';

const MyUsage = ({ logs, addWater, removeWater }) => {
  const [custom, setCustom] = useState('');
  const wide = useWide();
  const date = today();
  const used = litresByDate(logs)[date] ?? 0;
  const percent = Math.round((used / DAILY_GOAL_L) * 100);
  const todaysLogs = logs.filter((log) => log.date === date);

  const addCustom = (event) => {
    event.preventDefault();
    const litres = Number(custom);
    if (litres > 0 && litres <= 2000) addWater('other', litres, date);
    setCustom('');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      <div className="space-y-5">
        <section aria-label="Today's water" className="relative isolate overflow-hidden rounded-3xl p-5 shadow-md">
          <Photo image={pageImages.waterHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-white/85" />
          <div className="flex items-center gap-5">
            <ProgressRings rings={[{ key: 'water', value: used, goal: DAILY_GOAL_L, color: '#3b82f6' }]} size={130} stroke={10}>
              <span className="text-2xl font-bold text-forest-950">{used} L</span>
              <span className="text-xs text-slate-500">today</span>
            </ProgressRings>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Daily goal</p>
              <p className="text-3xl font-bold text-forest-950">{DAILY_GOAL_L} L</p>
              <p className="text-sm font-semibold text-blue-700">{percent}% of daily limit</p>
              <p className="text-sm text-slate-500">
                {used <= DAILY_GOAL_L ? `${DAILY_GOAL_L - used} L remaining for today` : `${used - DAILY_GOAL_L} L over today`}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="log-water-title" className="card">
          <h2 id="log-water-title" className="mb-3 text-base">Log water use</h2>
          <div className="flex flex-wrap gap-2">
            {WATER_USES.map((use) => (
              <button key={use.id} type="button" onClick={() => addWater(use.id, use.litres, date)} className="min-h-10 rounded-full bg-blue-50 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-100">
                + {use.label} <span className="font-normal">({use.litres} L)</span>
              </button>
            ))}
          </div>
          <form onSubmit={addCustom} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="custom-litres">Litres</label>
            <input id="custom-litres" type="number" min="1" max="2000" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Other amount (L)" className="input" />
            <button type="submit" className="btn shrink-0">Add</button>
          </form>
          {todaysLogs.length > 0 && (
            <ul aria-label="Logged today" className="mt-3 divide-y divide-slate-100 text-sm">
              {todaysLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-1.5">
                  <span>{WATER_USES.find((u) => u.id === log.use)?.label ?? 'Other'} · {log.litres} L</span>
                  <button type="button" onClick={() => removeWater(log.id)} aria-label={`Remove ${log.litres} L`} className="min-h-9 rounded px-2 text-bark hover:underline">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-5">
        <section aria-labelledby="weekly-title" className="card">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="weekly-title" className="text-base">Weekly Usage (litres)</h2>
            <p className="text-xs text-slate-500">Goal: {DAILY_GOAL_L} L/day</p>
          </div>
          <WeeklyBars days={lastWeek(logs)} goal={DAILY_GOAL_L} todayDate={date} />
        </section>

        <details className="card group">
          <summary className="flex cursor-pointer list-none items-center gap-3">
            <IconChip icon={Check} tone="green" />
            <span className="flex-1"><span className="block font-semibold">Leak Alerts</span><span className="text-sm text-emerald-700">No leaks reported · How to test</span></span>
            <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">›</span>
          </summary>
          <ol className="mt-3 ml-5 list-decimal space-y-1 text-sm text-slate-600">
            <li>Turn off every tap and don't flush for 30 minutes.</li>
            <li>Write down the reading on your water meter.</li>
            <li>Check it again after 30 minutes. If it moved, you have a leak.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">Automatic leak alerts need a smart meter feed, which isn't connected yet.</p>
        </details>

        <p className="card flex gap-3 border-forest-200 bg-forest-50 text-sm">
          <Lightbulb className="size-5 shrink-0 text-forest-700" aria-hidden="true" />
          <span><strong>Tip:</strong> a family of four using 100 L each a day saves over 1 000 litres a month by cutting just 10%.</span>
        </p>
      </div>

      {/* Wide screens: the comparison and the water guides sit alongside. */}
      {wide && (
        <aside aria-label="More on water" className="space-y-5">
          <Comparison logs={logs} />
          <RelatedGuides ids={['g1', 'g5']} title="Water guides" />
        </aside>
      )}
    </div>
  );
};

// Placeholder comparison until real area data exists.
const Comparison = ({ logs }) => {
  const week = lastWeek(logs);
  const logged = week.filter((d) => d.litres > 0);
  const average = logged.length ? Math.round(logged.reduce((s, d) => s + d.litres, 0) / logged.length) : 0;
  const rows = [
    { label: 'You (7-day average)', litres: average, color: '#3b82f6' },
    { label: 'Daily goal', litres: DAILY_GOAL_L, color: '#226842' },
    { label: 'South African average', litres: SA_AVERAGE_L, color: '#f59e0b' },
    { label: 'Cape Town Day Zero limit (2018)', litres: 50, color: '#94a3b8' },
  ];
  const top = Math.max(...rows.map((r) => r.litres));

  return (
    <section aria-labelledby="compare-title" className="card max-w-2xl">
      <h2 id="compare-title" className="mb-4 text-base">Litres per person per day</h2>
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex justify-between text-sm"><span>{r.label}</span><strong>{r.litres} L</strong></div>
            <div className="h-3 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(r.litres / top) * 100}%`, background: r.color }} /></div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">Neighbourhood averages need municipal meter data, which isn't connected yet.</p>
    </section>
  );
};

// The mockup's Water Usage screen.
const WaterPage = () => {
  const water = useWaterLogs();
  const [view, setView] = useState('mine');

  return (
    <>
      <AppBar title="Water Usage" back="/eco" />
      <main className="page space-y-5">
        <Segmented dark label="Show" value={view} onChange={setView} className="max-w-md" options={[{ id: 'mine', label: 'My Usage' }, { id: 'compare', label: 'Comparison' }]} />
        {view === 'mine' ? <MyUsage {...water} /> : <Comparison logs={water.logs} />}
      </main>
    </>
  );
};

export default WaterPage;
