import { Link } from 'react-router-dom';
import { ChevronDown, Sprout } from 'lucide-react';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';
import Photo from '../components/Photo';
import { pageImages } from '../assets/images';
import { useAuth } from '../features/auth/useAuth';
import { APP_NAME, MISSION, TAGLINE } from '../brand';
import { featureList } from '../featureList';

// The splash screen from the mockup, then the public landing sections.
// The header logo always comes back here.
// Glide down to #features instead of jumping. Reduced-motion users get the jump.
const scrollToFeatures = (event) => {
  const target = document.getElementById('features');
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  // Keep #features in the address bar so the link can still be shared.
  window.history.replaceState(window.history.state, '', '#features');
};

const Home = () => {
  const { user, status } = useAuth();

  return (
    <>
      {/* Splash: full-screen photo, a dark wash so the lime text stays readable. */}
      <section className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16 text-center lg:min-h-[calc(100dvh-3.75rem)]">
        <Photo image={pageImages.homeHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-forest-950/70 via-forest-950/50 to-forest-950/85" />

        <span className="mb-6 grid size-28 place-items-center rounded-full border-[6px] border-sprout/70 bg-forest-950/60 text-sprout shadow-2xl backdrop-blur-sm" aria-hidden="true">
          <Sprout className="size-14" strokeWidth={1.5} />
        </span>
        <h1 className="mb-2 text-4xl text-sprout sm:text-5xl">{APP_NAME}</h1>
        <p className="font-semibold text-sprout">{TAGLINE}</p>
        <p className="mb-10 text-sprout/90">{MISSION}</p>

        {/* The buttons wait for the session check; an invisible copy holds the space meanwhile. */}
        <div className="flex w-full max-w-xs flex-col gap-3">
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
        <a href="#features" onClick={scrollToFeatures} className="mt-8 inline-flex min-h-11 flex-col items-center text-sm text-forest-100 underline">
          Explore Features
          <ChevronDown className="size-5 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </a>
      </section>

      <main className="page max-w-4xl">
        <section id="features" className="mb-12">
          <h2 className="section-title">Our Features</h2>
          <p className="mb-4">Everything a household needs to get through extreme weather and live a little greener:</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {featureList.map((feature) => (
              <li key={feature.name} className="card">
                <strong className="text-forest-900">{feature.name}:</strong> {feature.text}
              </li>
            ))}
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

        <section id="benefits">
          <h2 className="section-title">Communal Benefits of a Healthy Environment</h2>
          <p className="mb-4">The benefits of a clean and healthy environment extend beyond individual health to the well-being of entire communities. These benefits include:</p>
          <ul className="leaf-list">
            <li>Improved air and water quality leading to better public health.</li>
            <li>Enhanced biodiversity and ecosystem resilience.</li>
            <li>Increased community engagement in environmental conservation.</li>
            <li>Economic opportunities through sustainable practices and green industries.</li>
          </ul>
        </section>
      </main>
    </>
  );
};

export default Home;
