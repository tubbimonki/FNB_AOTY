import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CloudSun, HandHeart, Leaf, Map, Recycle, Sprout, Trees, Users, Wind, Zap, ArrowRight } from 'lucide-react';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';
import Photo from '../components/Photo';
import DriftingLeaves from '../components/ui/DriftingLeaves';
import Hills from '../components/ui/Hills';
import GrowingSprout from '../components/ui/GrowingSprout';
import { pageImages } from '../assets/images';
import { useAuth } from '../features/auth/useAuth';
import { guideItems } from '../features/guides/guideItems';
import { useParallax } from '../hooks/useParallax';
import { useCountUp } from '../hooks/useCountUp';
import { prefersReducedMotion } from '../hooks/motion';
import { APP_NAME, MISSION, TAGLINE } from '../brand';
import { featureList } from '../featureList';

// The splash screen from the mockup, then the public landing sections.
// The header logo always comes back here.
// Glide down to #features instead of jumping. Reduced-motion users get the jump.
const scrollToFeatures = (event) => {
  const target = document.getElementById('features');
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  // Keep #features in the address bar so the link can still be shared.
  window.history.replaceState(window.history.state, '', '#features');
};

// One icon and tint per feature, keyed by its page.
const FEATURE_LOOK = {
  '/alerts': { Icon: CloudSun, tint: 'bg-blue-100 text-blue-700' },
  '/map': { Icon: Map, tint: 'bg-cyan-100 text-cyan-700' },
  '/services': { Icon: Zap, tint: 'bg-amber-100 text-amber-700' },
  '/eco': { Icon: Leaf, tint: 'bg-emerald-100 text-emerald-700' },
  '/eco/recycling': { Icon: Recycle, tint: 'bg-violet-100 text-violet-700' },
};

const BENEFITS = [
  { text: 'Improved air and water quality leading to better public health.', Icon: Wind, tint: 'bg-blue-100 text-blue-700' },
  { text: 'Enhanced biodiversity and ecosystem resilience.', Icon: Trees, tint: 'bg-emerald-100 text-emerald-700' },
  { text: 'Increased community engagement in environmental conservation.', Icon: Users, tint: 'bg-violet-100 text-violet-700' },
  { text: 'Economic opportunities through sustainable practices and green industries.', Icon: HandHeart, tint: 'bg-amber-100 text-amber-700' },
];

// Live alert feeds: Open-Meteo forecast, SAWS warnings, air quality, EskomSePush.
const STATS = [
  { value: featureList.length, label: 'tools in one free app' },
  { value: 4, label: 'live alert feeds for your area' },
  { value: guideItems.length, label: 'practical climate guides' },
];

// One number that counts up when it scrolls into view.
const Stat = ({ value, label }) => {
  const [ref, shown] = useCountUp(value);
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <span ref={ref} className="text-3xl font-bold text-forest-800 tabular-nums sm:text-4xl">{shown}</span>
      <span className="text-sm text-forest-800/70">{label}</span>
    </div>
  );
};

const Home = () => {
  const { user, status } = useAuth();
  const hero = useRef(null);
  useParallax(hero, 0.35);

  return (
    <>
      {/* Splash: full-screen photo (drifting slower than the page), a dark wash so
          the lime text stays readable, falling leaves, and hills fading into the page.
          Each line rises in after the one before it (.rise with --i). */}
      <section
        ref={hero}
        className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-28 text-center lg:min-h-[calc(100dvh-3.75rem)]"
      >
        <Photo image={pageImages.homeHero} background className="hero-photo absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-forest-950/70 via-forest-950/50 to-forest-950/85" />
        <DriftingLeaves className="-z-10" />

        <span className="rise group mb-6 grid size-28 place-items-center rounded-full border-[6px] border-sprout/70 bg-forest-950/60 text-sprout shadow-2xl backdrop-blur-sm logo-glow" style={{ '--i': 0 }} aria-hidden="true">
          <Sprout className="sprout-sway size-14" strokeWidth={1.5} />
        </span>
        <h1 className="rise mb-2 text-4xl text-sprout sm:text-5xl" style={{ '--i': 1 }}>{APP_NAME}</h1>
        <p className="rise font-semibold text-sprout" style={{ '--i': 2 }}>{TAGLINE}</p>
        <p className="rise mb-10 text-sprout/90" style={{ '--i': 3 }}>{MISSION}</p>

        {/* The buttons wait for the session check; an invisible copy holds the space meanwhile. */}
        <div className="rise flex w-full max-w-xs flex-col gap-3" style={{ '--i': 4 }}>
          {status !== 'ready' ? (
            <span className="btn btn-sprout invisible" aria-hidden="true">Get started</span>
          ) : user ? (
            <Link to="/dashboard" className="btn btn-sprout text-lg">Open your dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-sprout text-lg">Get started</Link>
              <Link to="/login" className="btn btn-sprout text-lg">Log in</Link>
            </>
          )}
        </div>
        <a href="#features" onClick={scrollToFeatures} className="rise mt-8 inline-flex min-h-11 flex-col items-center text-sm text-forest-100 underline" style={{ '--i': 5 }}>
          Explore Features
          <ChevronDown className="size-5 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </a>

        <Hills />
      </section>

      <main className="page max-w-4xl">
        {/* Three numbers that count up as they come into view. */}
        <div data-reveal className="mb-12 grid grid-cols-3 gap-2 rounded-2xl border border-forest-950/5 bg-white/70 py-5 shadow-sm backdrop-blur-sm">
          {STATS.map((stat) => <Stat key={stat.label} {...stat} />)}
        </div>

        <section id="features" className="mb-12">
          <h2 className="section-title">Our Features</h2>
          <p className="mb-4">Everything a household needs to get through extreme weather and live a little greener:</p>
          {/* Each card opens its tool. data-tilt adds the small 3D tilt on hover. */}
          <ul className="grid gap-3 sm:grid-cols-2">
            {featureList.map((feature) => {
              const { Icon, tint } = FEATURE_LOOK[feature.link] ?? FEATURE_LOOK['/eco'];
              return (
                <li key={feature.name} className="flex">
                  <Link to={feature.link} data-tilt className="card card-link group flex w-full items-start gap-3 text-forest-950">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-(--motion-base) ease-organic group-hover:-rotate-6 group-hover:scale-110 ${tint}`} aria-hidden="true">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <strong className="text-forest-900">{feature.name}:</strong> {feature.text}
                    </span>
                    <ArrowRight className="ml-auto size-4 shrink-0 self-center text-(--accent) opacity-0 transition duration-(--motion-base) ease-organic group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="guides" className="mb-12">
          <h2 className="section-title">Useful Guides & Solutions</h2>
          <p className="mb-6">Short reads with steps you can follow this week, and the climate stories behind them. Log in to read the full guides and news on your dashboard.</p>
          <div className="grid gap-6 md:grid-cols-2">
            <NewsSection />
            <GuidesSection />
          </div>
        </section>

        <section id="benefits" className="mb-12">
          <h2 className="section-title">Communal Benefits of a Healthy Environment</h2>
          <p className="mb-4">The benefits of a clean and healthy environment extend beyond individual health to the well-being of entire communities. These benefits include:</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map(({ text, Icon, tint }) => (
              <li key={text} className="card flex items-center gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${tint}`} aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action, with a plant that grows as it scrolls in. */}
        <div data-reveal className="flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-forest-50 to-emerald-50 p-6 text-center sm:flex-row sm:text-left">
          <GrowingSprout className="h-32 w-24 shrink-0" />
          <div className="flex-1">
            <h2 className="mb-1 text-xl sm:text-2xl">Small actions grow into big change</h2>
            <p className="text-forest-800/80">Log a green habit, check today's alerts, or help a neighbour. Every bit counts.</p>
          </div>
          {status === 'ready' && !user && (
            <Link to="/register" className="btn shrink-0">Create your free account</Link>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
