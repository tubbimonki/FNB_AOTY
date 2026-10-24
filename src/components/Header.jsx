import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

// NavLink is Link plus an `isActive` flag, so the current page's tab can look different.
const navClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm no-underline transition-colors hover:bg-forest-800 hover:no-underline ${
    isActive ? 'bg-forest-800 text-white' : 'text-forest-100'
  }`;

const Header = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-forest-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/home" className="text-lg font-bold text-white no-underline hover:no-underline">
          🌿 Climate Change Awareness App
        </Link>
        <nav>
          <ul className="flex flex-wrap items-center gap-1">
            {navigation.map((item) => (
              <li key={item.link}>
                <NavLink to={item.link} className={navClass}>{item.label}</NavLink>
              </li>
            ))}
            <li className="ml-2">
              {user ? (
                <button onClick={logout} className="btn btn-light py-1.5 text-sm">Log out ({user.name})</button>
              ) : (
                <Link to="/login" className="btn btn-light py-1.5 text-sm">Log in</Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
