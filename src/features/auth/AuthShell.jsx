import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import Photo from '../../components/Photo';
import { pageImages } from '../../assets/images';
import { APP_NAME, TAGLINE } from '../../brand';

// The frame around the login and sign-up forms: the splash photo behind a
// white card, so they feel like the next step after "Get started".
const AuthShell = ({ title, children, footer }) => (
  <main className="relative isolate flex min-h-dvh items-start justify-center px-4 py-10 sm:items-center lg:min-h-[calc(100dvh-3.75rem)]">
    <Photo image={pageImages.homeHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="absolute inset-0 -z-10 bg-forest-950/75" />

    <div className="w-full max-w-sm">
      <Link to="/home" className="mb-6 flex flex-col items-center gap-2 text-sprout no-underline hover:no-underline">
        <span className="grid size-16 place-items-center rounded-full border-4 border-sprout/70 bg-forest-950/60" aria-hidden="true">
          <Sprout className="size-8" strokeWidth={1.5} />
        </span>
        <span className="text-xl font-bold">{APP_NAME}</span>
        <span className="text-sm">{TAGLINE}</span>
      </Link>

      <div className="card p-6 sm:p-7">
        <h1 className="page-title mb-5 text-center">{title}</h1>
        {children}
      </div>
      {footer && <p className="mt-4 text-center text-sm text-forest-100">{footer}</p>}
    </div>
  </main>
);

export default AuthShell;
