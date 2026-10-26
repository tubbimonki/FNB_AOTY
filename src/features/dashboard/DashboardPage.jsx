import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { BookOpen, CloudRain, Droplet, Leaf, Map as MapIcon, Newspaper, Sprout, Wallet, Bell } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useNews } from '../news/useNews';
import { guideItems, latestGuides } from '../guides/guideItems';
import { useLogs } from '../green-wallet/useLogs';
import { calculateTodayTotals } from '../green-wallet/totals';
import { useWeather } from '../weather/useWeather';
import { describeWeather } from '../weather/weather';
import { useAlerts } from '../alerts/useAlerts';
import { useWide } from '../../hooks/useWide';
import WaterQuick from '../water/WaterQuick';
import PowerQuick from '../services/PowerQuick';
import EventsQuick from '../community/EventsQuick';
import WalletSummary from '../green-wallet/WalletSummary';
import AlertCard from '../alerts/AlertCard';
import Photo from '../../components/Photo';
import { pageImages } from '../../assets/images';
import { APP_NAME } from '../../brand';
import MiniWidget from './MiniWidget';
import { greeting } from './greeting';

// Photo header: app name, a bell for alerts, the greeting and today's weather.
const Hero = ({ name, place, weather, status, alertCount }) => {
  const now = weather && describeWeather(weather.current.code, weather.current.isDay);
  const today = weather?.days[0];

  return (
    <section className="relative isolate overflow-hidden rounded-b-3xl text-white shadow-md lg:mt-6 lg:rounded-3xl">
      <Photo image={pageImages.dashboardHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-forest-950/60 to-forest-900/90" />

      <div className="px-5 pt-5 pb-6 sm:px-8 sm:pt-7 sm:pb-8">
        <div className="mb-8 flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold"><Sprout className="size-5 text-sprout" aria-hidden="true" />{APP_NAME}</p>
          <Link to="/alerts" aria-label={`Alerts (${alertCount})`} className="relative grid size-11 place-items-center rounded-full text-white hover:bg-white/10">
            <Bell className="size-5" aria-hidden="true" />
            {alertCount > 0 && <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-amber-400 ring-2 ring-forest-900" />}
          </Link>
        </div>

        <h1 className="text-2xl text-white sm:text-3xl">{greeting()}{name ? `, ${name}` : ''}!</h1>
        <p className="mb-5 text-forest-100">Stay prepared. Make sustainable choices.</p>

        <Link
          to="/alerts"
          aria-label={`Today in ${place.name}`}
          className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-white no-underline backdrop-blur-sm hover:bg-white/15 hover:no-underline"
        >
          {weather ? (
            <>
              <span className="text-4xl" aria-hidden="true">{now.icon}</span>
              <span className="flex-1">
                <span className="block text-xs font-semibold tracking-widest text-forest-100 uppercase">{place.name}</span>
                <span className="block text-3xl font-bold">{Math.round(weather.current.tempC)}°C</span>
                <span className="block text-forest-100">{now.label}</span>
              </span>
              {today && <span className="text-sm text-forest-100">H: {Math.round(today.maxC)}° L: {Math.round(today.minC)}°</span>}
            </>
          ) : (
            <span className="py-2 text-forest-100">{status === 'error' ? 'Weather unavailable. Tap for details.' : `Loading weather for ${place.name}…`}</span>
          )}
        </Link>
      </div>
    </section>
  );
};

// A card with a short list that scrolls inside a height limit, plus a link to the full page.
const ScrollWidget = ({ id, title, more, children }) => (
  <section aria-labelledby={`${id}-title`} className="card">
    <div className="mb-2 flex items-baseline justify-between">
      <h2 id={`${id}-title`} className="text-base font-bold">{title}</h2>
      <Link to={more} className="text-sm font-semibold">See all →</Link>
    </div>
    <ul className="scroll-box max-h-64 space-y-3 divide-y divide-slate-100 sm:max-h-72 [&>li]:pt-3 [&>li:first-child]:pt-0" tabIndex={0} aria-label={`${title} list`}>
      {children}
    </ul>
  </section>
);

// The page you land on after logging in (the mockup's "Home Dash").
const DashboardPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const weather = useWeather();
  const { alerts } = useAlerts(weather);
  const { logs } = useLogs();
  const today = calculateTodayTotals(logs);
  const { items: newsItems } = useNews();
  const guides = latestGuides(guideItems);
  const [newestGuide] = guides;
  const wide = useWide();

  // Old links like /dashboard?view=guides go to the dedicated page.
  const oldView = searchParams.get('view');
  if (oldView === 'news' || oldView === 'guides') {
    return <Navigate replace to={`/dashboard/${oldView}`} />;
  }

  // 2xl+ (wide desktops): the page gains a right column of live quick widgets,
  // so the extra width holds something useful instead of empty margins.
  return (
    <main className="wrap lg:px-6 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:gap-x-6 3xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
        <Hero name={user?.name} alertCount={alerts.length} {...weather} />

        <div className="space-y-7 px-4 py-5 sm:px-6 lg:px-0">
          {alerts[0] && <AlertCard alert={alerts[0]} compact />}

          <section aria-labelledby="quick-title">
            <h2 id="quick-title" className="section-label">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <MiniWidget to="/alerts" icon={CloudRain} tone="blue" title="Weather Alerts" summary="Check local warnings" />
              <MiniWidget to="/services" icon={Droplet} tone="cyan" title="Essential Services" summary="Water, power & transport" />
              <MiniWidget to="/eco" icon={Leaf} tone="green" title="Eco-Impact" summary="Track your progress" />
              <MiniWidget to="/map" icon={MapIcon} tone="purple" title="Community Map" summary="Find facilities & report" />
            </div>
          </section>

          <section aria-labelledby="shortcuts-title">
            <h2 id="shortcuts-title" className="section-label">Shortcuts</h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <MiniWidget to="/dashboard/news" icon={Newspaper} tone="gray" title="Climate news" summary={`${newsItems.length} stories`} />
              <MiniWidget
                to="/dashboard/guides"
                icon={BookOpen}
                tone="amber"
                title="Guides"
                summary={newestGuide ? `New: ${newestGuide.topic}, ${newestGuide.minutes} min` : 'Coming soon'}
              />
              <MiniWidget
                to="/tracker"
                icon={Wallet}
                tone="green"
                title="Green Wallet"
                summary={`${today.co2Kg.toFixed(1)} kg CO2 · R${today.rand.toFixed(2)} today`}
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <ScrollWidget id="latest-news" title="Latest News" more="/dashboard/news">
              {newsItems.slice(0, 12).map((story) => (
                <li key={story.id}>
                  <a href={story.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest-950">{story.title}</a>
                  <p className="text-xs text-slate-500">{story.source}{story.date && ` · ${story.date}`}</p>
                </li>
              ))}
            </ScrollWidget>
            <ScrollWidget id="latest-guides" title="Latest Guides" more="/dashboard/guides">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link to={`/dashboard/guides#guide-${guide.id}`} className="font-semibold text-forest-950">{guide.title}</Link>
                  <p className="text-xs text-slate-500">{guide.topic} · {guide.minutes} min · {guide.links.length} sources</p>
                </li>
              ))}
            </ScrollWidget>
          </div>
        </div>
      </div>

      {wide && (
        <aside aria-labelledby="glance-title" className="space-y-4 pt-6">
          <h2 id="glance-title" className="section-label">At a glance</h2>
          <PowerQuick />
          <WaterQuick />
          <WalletSummary />
          <EventsQuick />
        </aside>
      )}
    </main>
  );
};

export default DashboardPage;
