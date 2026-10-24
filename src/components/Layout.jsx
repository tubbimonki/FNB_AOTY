import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { navItems } from '../navItems';

// Shared frame for every page. <Outlet /> is where the current route renders.
// flex-col + flex-1 on the content pushes the footer to the bottom on short pages.
const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header navigation={navItems} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
