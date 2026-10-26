import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '../../components/ui/AppBar';
import { DEFAULT_ANSWERS, DIETS, SA_AVERAGE_TONNES, estimateFootprint } from '../../../shared/footprint';
import { useFootprint } from './useFootprint';

const PARTS = [
  { key: 'home', label: 'Home electricity', color: '#f59e0b' },
  { key: 'car', label: 'Car', color: '#ef4444' },
  { key: 'bus', label: 'Bus & taxi', color: '#8b5cf6' },
  { key: 'flights', label: 'Flights', color: '#3b82f6' },
  { key: 'food', label: 'Food', color: '#10b981' },
];

const NumberQuestion = ({ label, hint, value, onChange, max }) => (
  <label className="flex flex-col">
    <span className="label">{label}</span>
    <input type="number" min="0" max={max} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className="input" />
    {hint && <span className="mt-1 text-xs text-slate-500">{hint}</span>}
  </label>
);

// The carbon footprint questionnaire. The result updates as you type, using
// the same shared/footprint.js the server uses.
const FootprintPage = () => {
  const { saved, save } = useFootprint();
  const [answers, setAnswers] = useState(saved?.answers ?? DEFAULT_ANSWERS);
  const [done, setDone] = useState(false);
  const set = (key) => (value) => setAnswers({ ...answers, [key]: value });
  const { total, breakdown } = estimateFootprint(answers);

  return (
    <>
      <AppBar title="Carbon Footprint" back="/eco" />
      <main className="page grid gap-5 lg:grid-cols-2">
        <form
          className="card flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save(answers);
            setDone(true);
          }}
        >
          <NumberQuestion label="Electricity per month (kWh)" hint="On your municipal bill or prepaid slips. 350 kWh is typical." value={answers.kwhPerMonth} onChange={set('kwhPerMonth')} max={10000} />
          <NumberQuestion label="People in your home" value={answers.householdSize} onChange={set('householdSize')} max={20} />
          <NumberQuestion label="Kilometres by car per week" value={answers.carKmPerWeek} onChange={set('carKmPerWeek')} max={5000} />
          <NumberQuestion label="Kilometres by bus or taxi per week" value={answers.busKmPerWeek} onChange={set('busKmPerWeek')} max={5000} />
          <NumberQuestion label="Return flights per year" hint="Count domestic trips like Johannesburg to Cape Town and back." value={answers.flightsPerYear} onChange={set('flightsPerYear')} max={100} />
          <fieldset>
            <legend className="label">What do you usually eat?</legend>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DIETS).map(([id, diet]) => (
                <label key={id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 ${answers.diet === id ? 'border-forest-500 bg-forest-50' : 'border-slate-200'}`}>
                  <input type="radio" name="diet" value={id} checked={answers.diet === id} onChange={() => set('diet')(id)} className="accent-forest-700" />
                  {diet.label}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn">Save my footprint</button>
          {done && <p role="status" className="text-sm text-forest-700">Saved. <Link to="/eco">Back to Eco-Impact</Link></p>}
        </form>

        <section aria-labelledby="result-title" className="card h-fit lg:sticky lg:top-24">
          <h2 id="result-title" className="text-sm font-bold tracking-widest text-slate-500 uppercase">Your estimate</h2>
          <p className="my-2"><span className="text-5xl font-bold">{total.toFixed(1)}</span> <span className="text-slate-600">t CO₂e / year</span></p>
          <p className="mb-4 text-sm text-slate-600">
            {total < SA_AVERAGE_TONNES ? 'Below' : 'Above'} the South African average of about {SA_AVERAGE_TONNES} t per person.
          </p>
          {/* One stacked bar, then the same numbers as a list. */}
          <div aria-hidden="true" className="mb-4 flex h-4 overflow-hidden rounded-full">
            {PARTS.map((p) => <div key={p.key} style={{ width: `${(breakdown[p.key] / total) * 100}%`, background: p.color }} />)}
          </div>
          <ul className="space-y-1.5 text-sm">
            {PARTS.map((p) => (
              <li key={p.key} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full" style={{ background: p.color }} />
                <span className="flex-1">{p.label}</span>
                <strong>{breakdown[p.key].toFixed(2)} t</strong>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">A rough estimate from average emission factors. It leaves out things like shopping and waste.</p>
        </section>
      </main>
    </>
  );
};

export default FootprintPage;
