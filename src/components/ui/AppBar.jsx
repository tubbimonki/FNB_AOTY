import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// The dark green bar at the top of each page: back arrow, centred title and
// an optional action on the right. Sticky on phones; on desktop the main
// header is already sticky, so this becomes a plain title band.
const AppBar = ({ title, back, action }) => (
  <div className="sticky top-0 z-30 bg-forest-900 text-white shadow-sm lg:static lg:shadow-none">
    <div className="mx-auto grid min-h-14 max-w-6xl grid-cols-[3rem_1fr_3rem] items-center px-2 sm:px-4 lg:min-h-16">
      {back ? (
        <Link to={back} aria-label="Back" className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
      <h1 className="truncate text-center text-base font-semibold text-white sm:text-lg">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </div>
  </div>
);

// A round icon button for the right side of the bar.
export const AppBarButton = ({ icon: Icon, label, ...rest }) => (
  <button type="button" aria-label={label} className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10" {...rest}>
    <Icon className="size-5" aria-hidden="true" />
  </button>
);

export default AppBar;
