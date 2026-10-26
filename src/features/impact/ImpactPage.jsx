import { Award, Bus, ClipboardList, Droplet, Footprints, Leaf, Recycle, Zap, Check } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import IconChip from '../../components/ui/IconChip';
import Pill from '../../components/ui/Pill';
import ProgressBar from '../../components/ui/ProgressBar';
import { useAuth } from '../auth/useAuth';
import { useImpact } from './useImpact';

const BADGE_LOOK = {
  'water-saver': { icon: Droplet, tone: 'blue' },
  'recycling-champ': { icon: Recycle, tone: 'green' },
  'green-commuter': { icon: Bus, tone: 'amber' },
  prepared: { icon: ClipboardList, tone: 'red' },
  footprint: { icon: Footprints, tone: 'purple' },
};

const CATEGORY_LOOK = {
  travel: { icon: Bus, tone: 'amber' },
  home: { icon: Zap, tone: 'amber' },
  food: { icon: Leaf, tone: 'green' },
  waste: { icon: Recycle, tone: 'blue' },
};

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const shortDate = (date) => new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

// The mockup's "Your Impact" page: level, eco-points, badges and history.
// Points are worked out in this browser for now (see useImpact).
const ImpactPage = () => {
  const { user } = useAuth();
  const impact = useImpact();
  const levelStart = impact.nextAt - 500;
  const recent = impact.actionLogs.slice(0, 10);

  return (
    <>
      <AppBar title="Your Impact" back="/more" />
      <main className="page grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <section aria-label="Profile" className="card flex items-center gap-4">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-forest-500 to-forest-800 text-xl font-bold text-white ring-4 ring-forest-100">
              {initials(user?.name)}
            </span>
            <div>
              <h2 className="text-lg">{user?.name}</h2>
              <div className="mt-1 flex flex-wrap gap-2">
                <Pill tone="green"><Award className="size-3.5" aria-hidden="true" />{impact.title}</Pill>
                <Pill tone="amber">Level {impact.level}</Pill>
              </div>
            </div>
          </section>

          <section aria-labelledby="points-title" className="card">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 id="points-title" className="text-base">Eco-Points Earned</h2>
              <p className="font-bold">{impact.points} / {impact.nextAt} points</p>
            </div>
            <ProgressBar value={impact.points - levelStart} max={500} label="Points to next level" color="#226842" />
            <p className="mt-2 text-sm text-slate-500">
              {impact.nextTitle ? `${impact.nextAt - impact.points} points to reach ${impact.nextTitle}` : 'Top level reached. Legend!'}
            </p>
          </section>

          <section aria-labelledby="badges-title">
            <h2 id="badges-title" className="section-label">Badges</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {impact.badges.map((b) => {
                const look = BADGE_LOOK[b.id];
                return (
                  <li key={b.id} className={`card flex flex-col items-center gap-2 p-3 text-center sm:p-3 ${b.unlocked ? '' : 'opacity-60 grayscale'}`} title={b.hint}>
                    <IconChip icon={look.icon} tone={look.tone} size="lg" className="rounded-full" />
                    <p className="text-sm font-semibold">{b.label}</p>
                    <p className={`text-xs ${b.unlocked ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}>{b.unlocked ? 'Active' : `${b.have} / ${b.need}`}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section aria-labelledby="actions-title">
          <h2 id="actions-title" className="section-label">Your Actions</h2>
          {recent.length === 0 ? (
            <p className="card text-slate-600">Nothing yet. Every action you log in Green Wallet earns 10 points.</p>
          ) : (
            <ul className="card divide-y divide-slate-100 p-0 sm:p-0">
              {recent.map((log) => {
                const look = CATEGORY_LOOK[log.category] ?? { icon: Check, tone: 'green' };
                return (
                  <li key={log.id} className="flex items-center gap-3 px-4 py-3">
                    <IconChip icon={look.icon} tone={look.tone} size="sm" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{log.label}</span><span className="text-xs text-slate-500">{shortDate(log.date)}</span></span>
                    <span className="font-bold text-emerald-700">+{log.points} pts</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">Points: 10 per action, 20 per day under your water goal, 50 for the emergency checklist, 100 for your footprint.</p>
        </section>
      </main>
    </>
  );
};

export default ImpactPage;
