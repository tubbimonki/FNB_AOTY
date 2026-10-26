import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import Photo from '../../components/Photo';
import DriftingLeaves from '../../components/ui/DriftingLeaves';
import { pageImages } from '../../assets/images';
import { APP_NAME, TAGLINE } from '../../brand';

// The frame around the login and sign-up forms: the splash photo behind a
// white card, so they feel like the next step after "Get started".
// The logo and the card rise in one after the other (.rise with --i), and
// the same leaves drift past as on the splash.
const AuthShell = ({ title, children, footer }) => (
  <main className="relative isolate flex min-h-dvh items-start justify-center overflow-hidden px-4 py-10 sm:items-center lg:min-h-[calc(100dvh-3.75rem)]">
    <Photo image={pageImages.homeHero} background className="hero-photo absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="absolute inset-0 -z-10 bg-forest-950/75" />
    <DriftingLeaves className="-z-10" />

    <div className="w-full max-w-sm">
      <Link to="/home" className="rise group mb-6 flex flex-col items-center gap-2 text-sprout no-underline hover:no-underline" style={{ '--i': 0 }}>
        <span className="logo-glow grid size-16 place-items-center rounded-full border-4 border-sprout/70 bg-forest-950/60" aria-hidden="true">
          <Sprout className="sprout-sway size-8" strokeWidth={1.5} />
        </span>
        <span className="text-xl font-bold">{APP_NAME}</span>
        <span className="text-sm">{TAGLINE}</span>
      </Link>

      <div className="card rise p-6 sm:p-7" data-reveal="off" style={{ '--i': 1 }}>
        <h1 className="page-title mb-5 text-center">{title}</h1>
        {children}
      </div>
      {footer && <p className="rise mt-4 text-center text-sm text-forest-100" style={{ '--i': 2 }}>{footer}</p>}
    </div>
  </main>
);

export default AuthShell;
