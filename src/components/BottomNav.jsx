import { Link, useLocation } from 'react-router-dom';
import { isActive } from '../navItems';

// The phone tab bar fixed to the bottom of the screen (hidden from lg up,
// where the header shows the same tabs). The safe-area padding keeps it above the
// iPhone home indicator.
const BottomNav = ({ navigation }) => {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid h-tabbar max-w-lg grid-cols-5">
        {navigation.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.link}>
              <Link
                to={item.link}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs no-underline hover:no-underline ${
                  active ? 'font-semibold text-forest-800' : 'text-slate-500'
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? 'bg-forest-100' : ''}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
