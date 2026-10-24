import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

// NavLink is Link plus an `isActive` flag, so the current page's tab can look different.
// min-h-11 (44px) is the smallest comfortable finger target on a phone.
const navClass = ({ isActive }) =>
  `flex min-h-11 items-center rounded-md px-3 text-base no-underline transition-colors hover:bg-forest-800 hover:no-underline lg:min-h-0 lg:py-1.5 lg:text-sm ${
    isActive ? 'bg-forest-800 text-white' : 'text-forest-100'
  }`;

// Mobile first: the plain classes are the phone layout, and the lg: classes
// take over from 1024px up. Below lg the links hide behind a menu button;
// from lg they sit in one row and the button disappears.
const Header = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-forest-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 px-4 py-2 sm:px-6 lg:py-3">
        <Link to="/home" onClick={closeMenu} className="py-2 text-lg font-bold text-white no-underline hover:no-underline">
          🌿 <span className="hidden sm:inline">Climate Change Awareness App</span>
          <span className="sm:hidden">Climate App</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-md text-2xl hover:bg-forest-800 lg:hidden"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* One list for both layouts: on phones it is a full-width column shown
            only while menuOpen; lg:flex always shows it as a row. */}
        <nav id="main-nav" className={`${menuOpen ? 'block' : 'hidden'} w-full pb-3 lg:block lg:w-auto lg:pb-0`}>
          <ul className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center">
            {navigation.map((item) => (
              <li key={item.link}>
                <NavLink to={item.link} onClick={closeMenu} className={navClass}>{item.label}</NavLink>
              </li>
            ))}
            <li className="mt-2 lg:mt-0 lg:ml-2">
              {user ? (
                <button onClick={() => { closeMenu(); logout(); }} className="btn btn-light w-full text-sm lg:w-auto lg:min-h-0 lg:py-1.5">Log out ({user.name})</button>
              ) : (
                <Link to="/login" onClick={closeMenu} className="btn btn-light w-full text-sm lg:w-auto lg:min-h-0 lg:py-1.5">Log in</Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
