import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { navItems } from '../navItems';

// Pages without the phone tab bar (the splash and the login forms).
const NO_TABS = ['/home', '/login', '/register'];

// Shared frame for every page; <Outlet /> is where the current route renders.
// pb-tabbar leaves room for the phone tab bar so it never covers content.
// min-h-dvh, not min-h-screen: on phones 100vh includes the space behind the address bar.
const Layout = () => {
  const { pathname } = useLocation();
  const tabs = !NO_TABS.includes(pathname);

  return (
    <div className={`flex min-h-dvh flex-col ${tabs ? 'pb-tabbar lg:pb-0' : ''}`}>
      <Header navigation={navItems} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      {tabs && <BottomNav navigation={navItems} />}
    </div>
  );
};

export default Layout;
