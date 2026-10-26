import { Link, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { isActive } from '../navItems';
import { APP_NAME } from '../brand';

// Desktop header (lg and up): logo, the five tabs and the account button.
// On phones it is hidden; BottomNav and each page's AppBar take over.
const Header = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 hidden bg-forest-950 text-white shadow lg:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5">
        <Link to="/home" className="flex items-center gap-2 text-lg font-bold text-white no-underline hover:no-underline">
          <span className="grid size-8 place-items-center rounded-full bg-sprout/20 text-sprout" aria-hidden="true">
            <Sprout className="size-5" />
          </span>
          {APP_NAME}
        </Link>

        <nav id="main-nav" aria-label="Main">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.link}>
                  <Link
                    to={item.link}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm no-underline transition-colors hover:bg-white/10 hover:no-underline ${
                      active ? 'bg-white/15 font-semibold text-white' : 'text-forest-100'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user ? (
          <button type="button" onClick={logout} className="btn btn-light min-h-0 py-1.5 text-sm">Log out ({user.name})</button>
        ) : (
          <Link to="/login" className="btn btn-light min-h-0 py-1.5 text-sm">Log in</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
