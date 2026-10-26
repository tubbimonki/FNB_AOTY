import { Award, Bus, ClipboardList, Crown, Droplet, Footprints, Gift, Leaf, Recycle, Zap, Check } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import IconChip from '../../components/ui/IconChip';
import Pill from '../../components/ui/Pill';
import ProgressBar from '../../components/ui/ProgressBar';
import { useAuth } from '../auth/useAuth';
import { POINTS, POINTS_PER_LEVEL } from '../../../shared/impact';
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
const awardWorth = (a) => [a.points && `+${a.points} pts`, a.premiumDays && `+${a.premiumDays} days Premium`].filter(Boolean).join(' · ');

// "Your Impact": level, eco-points, badges, rewards and recent actions.
// Members' points come from the server once their logs are saved (see useImpact).
// Rewards are everything in impact_awards: events, reactions and reports.
const ImpactPage = () => {
  const { user } = useAuth();
  const impact = useImpact();
  const levelStart = impact.nextAt - POINTS_PER_LEVEL;
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
                {impact.premiumUntil && (
                  <Pill tone="purple"><Crown className="size-3.5" aria-hidden="true" />Premium until {new Date(impact.premiumUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Pill>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="points-title" className="card">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 id="points-title" className="text-base">Eco-Points Earned</h2>
              <p className="font-bold">{impact.points} / {impact.nextAt} points</p>
            </div>
            <ProgressBar value={impact.points - levelStart} max={POINTS_PER_LEVEL} label="Points to next level" color="#226842" />
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

        <div className="space-y-5">
          {impact.awards.length > 0 && (
            <section aria-labelledby="rewards-title">
              <h2 id="rewards-title" className="section-label">Rewards</h2>
              <ul className="card divide-y divide-slate-100 p-0 sm:p-0">
                {impact.awards.map((a) => (
                  <li key={a.source} className="flex items-center gap-3 px-4 py-3">
                    <IconChip icon={Gift} tone="amber" size="sm" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{a.label}</span><span className="text-xs text-slate-500">{shortDate(a.createdAt.slice(0, 10))}</span></span>
                    <span className="text-right font-bold text-emerald-700">{awardWorth(a)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="actions-title">
            <h2 id="actions-title" className="section-label">Your Actions</h2>
            {recent.length === 0 ? (
              <p className="card text-slate-600">Nothing yet. Every action you log in Green Wallet earns {POINTS.action} points.</p>
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
            <p className="mt-3 text-xs text-slate-500">Points: {POINTS.action} per action, {POINTS.waterDay} per day under your water goal, {POINTS.checklist} for the emergency checklist, {POINTS.footprint} for your footprint, {POINTS.reaction} per reaction and {POINTS.report} per report, plus rewards for going to community events.</p>
          </section>
        </div>
      </main>
    </>
  );
};

export default ImpactPage;
