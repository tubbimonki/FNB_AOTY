import { Link } from 'react-router-dom';
import { Award, BookOpen, ClipboardList, CloudRain, Droplet, Info, LogIn, LogOut, Newspaper, Recycle, Sparkles, Sprout, Wallet, Zap } from 'lucide-react';
import AppBar from '../components/ui/AppBar';
import ListRow, { ListCard } from '../components/ui/ListRow';
import IconChip from '../components/ui/IconChip';
import { useAuth } from '../features/auth/useAuth';
import { APP_NAME } from '../brand';

const GROUPS = [
  {
    title: 'You',
    rows: [
      { icon: Award, tone: 'amber', title: 'Your Impact', subtitle: 'Level, points and badges', to: '/impact' },
      { icon: Wallet, tone: 'green', title: 'Green Wallet', subtitle: 'Log actions, see CO2 and rand saved', to: '/tracker' },
    ],
  },
  {
    title: 'Stay safe',
    rows: [
      { icon: CloudRain, tone: 'blue', title: 'Weather & Climate Alerts', subtitle: 'Forecast and warnings', to: '/alerts' },
      { icon: ClipboardList, tone: 'red', title: 'Emergency Checklist', subtitle: 'Be ready before the storm', to: '/alerts#checklist' },
      { icon: Zap, tone: 'cyan', title: 'Essential Services', subtitle: 'Water, power, transport, waste', to: '/services' },
    ],
  },
  {
    title: 'Live greener',
    rows: [
      { icon: Droplet, tone: 'blue', title: 'Water Usage', subtitle: 'Daily litres and weekly bars', to: '/eco/water' },
      { icon: Recycle, tone: 'purple', title: 'Recycling & Waste Guide', subtitle: 'What goes in which bin', to: '/eco/recycling' },
      { icon: Newspaper, tone: 'gray', title: 'Climate News', subtitle: 'Stories that matter in SA', to: '/dashboard/news' },
      { icon: BookOpen, tone: 'amber', title: 'Guides', subtitle: 'Practical how-tos', to: '/dashboard/guides' },
    ],
  },
  {
    title: `About ${APP_NAME}`,
    rows: [
      { icon: Info, tone: 'gray', title: 'About', to: '/about' },
      { icon: Sparkles, tone: 'gray', title: 'Features', to: '/features' },
      { icon: Sprout, tone: 'gray', title: 'Benefits', to: '/benefits' },
    ],
  },
];

// The "More" tab: every page that isn't one of the other four tabs, plus the account.
const More = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <AppBar title="More" />
      <main className="page grid gap-5 md:grid-cols-2">
        <section aria-label="Account" className="card flex items-center gap-3 md:col-span-2">
          <IconChip icon={user ? LogOut : LogIn} tone="green" />
          <p className="flex-1">{user ? <>Logged in as <strong>{user.name}</strong></> : 'Log in to save reports and see your impact.'}</p>
          {user ? (
            <button type="button" onClick={logout} className="btn btn-light border border-forest-200">Log out</button>
          ) : (
            <Link to="/login" state={{ from: '/more' }} className="btn">Log in</Link>
          )}
        </section>
        {GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h2 className="section-label">{group.title}</h2>
            <ListCard>
              {group.rows.map((row) => <li key={row.title}><ListRow {...row} /></li>)}
            </ListCard>
          </section>
        ))}
      </main>
    </>
  );
};

export default More;
