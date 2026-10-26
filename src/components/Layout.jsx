import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { navItems, activeTab } from '../navItems';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { usePointerGlow } from '../hooks/usePointerGlow';
import { useLocationRefresh } from '../features/weather/usePlace';

// Pages without the phone tab bar (the splash and the login forms).
const NO_TABS = ['/home', '/login', '/register'];

// Shared frame for every page; <Outlet /> is where the current route renders.
// pb-tabbar leaves room for the phone tab bar so it never covers content.
// min-h-dvh, not min-h-screen: on phones 100vh includes the space behind the address bar.
// data-accent gives the whole page its tab's colour (see index.css).
// The key restarts the fade-in when you move to another section, but not
// when you open a page inside the same one (so its state survives).
// useScrollReveal fades cards and titles in as they scroll into view, and
// usePointerGlow lights up linked cards under the mouse, on every page.
// useLocationRefresh keeps "My location" current while the app is open.
const Layout = () => {
  const { pathname } = useLocation();
  const tabs = !NO_TABS.includes(pathname);
  const section = pathname.split('/')[1];
  const page = useRef(null);
  useScrollReveal(page, section);
  usePointerGlow(page, section);
  useLocationRefresh();

  return (
    <div data-accent={activeTab(pathname)?.accent} className={`flex min-h-dvh flex-col ${tabs ? 'pb-tabbar lg:pb-0' : ''}`}>
      <Header navigation={navItems} />
      <div key={section} ref={page} className="flex-1 motion-safe:animate-page-in">
        <Outlet />
      </div>
      <Footer />
      {tabs && <BottomNav navigation={navItems} />}
    </div>
  );
};

export default Layout;
