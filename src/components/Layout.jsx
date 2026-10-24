import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { navItems } from '../navItems';

// Shared frame for every page. <Outlet /> is where the current route renders.
const Layout = () => {
  return (
    <>
      <Header navigation={navItems} />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
