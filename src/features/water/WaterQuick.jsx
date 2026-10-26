import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import { ProgressRings } from '../green-wallet/ProgressRings';
import { today } from '../green-wallet/totals';
import { useWaterLogs } from './useWaterLogs';
import { DAILY_GOAL_L, WATER_USES, litresByDate } from './water';

// The three most common uses, as one-tap buttons.
const QUICK = WATER_USES.filter((use) => ['shower', 'toilet', 'drink'].includes(use.id));

// Small "Water today" card for the wide-screen side columns: today's litres
// on a ring plus quick log buttons. Same logs as the Water Usage page.
const WaterQuick = ({ className = '' }) => {
  const titleId = useId();
  const { logs, addWater } = useWaterLogs();
  const date = today();
  const used = litresByDate(logs)[date] ?? 0;

  return (
    <section aria-labelledby={titleId} className={`card ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-2 text-base"><Droplet className="size-4 text-blue-600" aria-hidden="true" />Water today</h2>
        <Link to="/eco/water" className="text-sm font-semibold">Open →</Link>
      </div>
      <div className="flex items-center gap-4">
        <ProgressRings rings={[{ key: 'water', value: used, goal: DAILY_GOAL_L, color: '#3a7fa0' }]} size={80} stroke={10}>
          <span className="text-base font-bold text-forest-950">{used} L</span>
        </ProgressRings>
        <p className="text-sm text-slate-600">
          {used <= DAILY_GOAL_L ? `${DAILY_GOAL_L - used} L left of your ${DAILY_GOAL_L} L daily goal.` : `${used - DAILY_GOAL_L} L over your ${DAILY_GOAL_L} L goal today.`}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((use) => (
          <button key={use.id} type="button" onClick={() => addWater(use.id, use.litres, date)} className="min-h-9 rounded-full bg-blue-50 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-100">
            + {use.label} <span className="font-normal">({use.litres} L)</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default WaterQuick;
