import { Link } from 'react-router-dom';
import { Award, Droplet, Recycle, Wallet, Zap } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import IconChip from '../../components/ui/IconChip';
import Pill from '../../components/ui/Pill';
import ProgressBar from '../../components/ui/ProgressBar';
import MiniWidget from '../dashboard/MiniWidget';
import Photo from '../../components/Photo';
import { pageImages } from '../../assets/images';
import { lastDays, today } from '../green-wallet/totals';
import { DAILY_GOAL_L, litresByDate } from '../water/water';
import { SA_AVERAGE_TONNES } from '../../../shared/footprint';
import { useImpact } from '../impact/useImpact';
import GrowingPlant from './GrowingPlant';
import { useWide } from '../../hooks/useWide';
import WaterQuick from '../water/WaterQuick';
import RecyclingQuick from '../recycling/RecyclingQuick';
import RelatedGuides from '../guides/RelatedGuides';

// Weekly targets for the two action-based goals. Tune freely.
const WEEKLY = { home: 7, waste: 3 };

const Goal = ({ icon, tone, title, value, max, color, status, statusTone }) => (
  <li className="card p-4 sm:p-4">
    <div className="mb-2 flex items-center gap-3">
      <IconChip icon={icon} tone={tone} size="sm" />
      <span className="flex-1 font-semibold">{title}</span>
      <Pill tone={statusTone}>{status}</Pill>
    </div>
    <ProgressBar value={value} max={max} color={color} label={title} />
  </li>
);

// The mockup's Eco-Impact screen: footprint, goals, the plant, and links to
// the tools that feed them.
const EcoPage = () => {
  const { actionLogs, waterLogs, weekPoints, wilting, footprint, points } = useImpact();
  const week = new Set(lastDays(7));
  const thisWeek = (category) => actionLogs.filter((log) => week.has(log.date) && log.category === category).length;
  const water = litresByDate(waterLogs)[today()] ?? 0;
  const home = thisWeek('home');
  const waste = thisWeek('waste');
  const wide = useWide();

  return (
    <>
      <AppBar title="Eco-Impact" action={<Link to="/impact" aria-label="Your impact" className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10"><Award className="size-5" aria-hidden="true" /></Link>} />
      <main className="page grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <div className="space-y-5">
          <section aria-labelledby="footprint-title" className="relative isolate overflow-hidden rounded-3xl p-6 text-center shadow-md">
            <Photo image={pageImages.ecoHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-white/80" />
            <h2 id="footprint-title" className="text-sm font-bold tracking-widest text-forest-900 uppercase">Your carbon footprint</h2>
            {footprint ? (
              <>
                <p className="my-1"><span className="text-5xl font-bold text-forest-950">{footprint.total.toFixed(1)}</span> <span className="text-slate-600">t CO₂e / year</span></p>
                <p className="text-sm text-slate-600">SA average is about {SA_AVERAGE_TONNES} t per person.</p>
                <Link to="/eco/footprint" className="mt-3 inline-block text-sm font-semibold">Redo the questions</Link>
              </>
            ) : (
              <>
                <p className="my-3 text-slate-700">Five quick questions give you a rough yearly figure.</p>
                <Link to="/eco/footprint" className="btn">Work out my footprint</Link>
              </>
            )}
          </section>

          <section aria-labelledby="goals-title">
            <h2 id="goals-title" className="section-label">Your Goals</h2>
            <ul className="space-y-3">
              <Goal icon={Droplet} tone="blue" title="Water Usage" value={water} max={DAILY_GOAL_L} color="#3b82f6"
                status={water <= DAILY_GOAL_L ? 'On track' : 'Over goal'} statusTone={water <= DAILY_GOAL_L ? 'green' : 'amber'} />
              <Goal icon={Zap} tone="amber" title="Energy saving actions" value={home} max={WEEKLY.home} color="#f59e0b"
                status={`${home} of ${WEEKLY.home} this week`} statusTone={home >= WEEKLY.home ? 'green' : 'amber'} />
              <Goal icon={Recycle} tone="green" title="Recycling" value={waste} max={WEEKLY.waste} color="#10b981"
                status={waste > 0 ? 'Keep it up!' : 'Not yet this week'} statusTone={waste > 0 ? 'green' : 'gray'} />
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <GrowingPlant points={weekPoints} wilting={wilting} />
          <div className="grid grid-cols-2 gap-3">
            <MiniWidget to="/tracker" icon={Wallet} tone="green" title="Green Wallet" summary="Log actions, save rand" />
            <MiniWidget to="/eco/water" icon={Droplet} tone="blue" title="Water Usage" summary="Daily litres & weekly bars" />
            <MiniWidget to="/eco/recycling" icon={Recycle} tone="purple" title="Recycling Guide" summary="What goes in which bin" />
            <MiniWidget to="/impact" icon={Award} tone="amber" title="Your Impact" summary={`${points} eco-points`} />
          </div>
        </div>

        {/* Wide screens: log water and check a bin without leaving the page. */}
        {wide && (
          <aside aria-label="Quick tools" className="space-y-5">
            <WaterQuick />
            <RecyclingQuick />
            <RelatedGuides ids={['g1', 'g3']} />
          </aside>
        )}
      </main>
    </>
  );
};

export default EcoPage;
