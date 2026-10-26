import { Link, useLocation } from 'react-router-dom';
import { isActive } from '../navItems';

// The phone tab bar fixed to the bottom of the screen (hidden from lg up,
// where the header shows the same tabs). The safe-area padding keeps it above the
// iPhone home indicator. Each tab carries its own colour (.tab-link in index.css).
const BottomNav = ({ navigation }) => {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid h-tabbar max-w-lg grid-cols-5">
        {navigation.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.link}>
              <Link
                to={item.link}
                data-accent={item.accent}
                aria-current={active ? 'page' : undefined}
                className="tab-link"
              >
                <span className="tab-pill">
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
