import { Link } from 'react-router-dom';
import { useApiHealth } from '../hooks/useApiHealth';
import { APP_NAME } from '../brand';
import Vine from './ui/Vine';

// The info pages sit here instead of in the tabs.
const infoLinks = [
  { label: 'About', link: '/about' },
  { label: 'Features', link: '/features' },
  { label: 'Benefits', link: '/benefits' },
];

const Footer = () => {
  const apiStatus = useApiHealth();

  return (
    <footer className="relative mt-10 overflow-hidden bg-forest-950 text-sm text-forest-200 sm:mt-16">
      {/* Two faint vines trailing along the top edge. */}
      <Vine className="pointer-events-none absolute -top-1 left-0 h-10 text-forest-700 opacity-60" />
      <Vine className="pointer-events-none absolute -top-1 right-0 h-10 -scale-x-100 text-forest-700 opacity-60" />
      <div className="relative mx-auto max-w-6xl space-y-1 px-4 pt-12 pb-8 sm:px-6">
        <ul className="mb-3 flex flex-wrap gap-x-4">
          {infoLinks.map((item) => (
            <li key={item.link}>
              <Link to={item.link} className="inline-flex min-h-11 items-center text-forest-100">{item.label}</Link>
            </li>
          ))}
        </ul>
        <p>&copy; 2026 {APP_NAME}. All rights reserved.</p>
        <p>Support organizations working on climate solutions.</p>
        <p className="text-forest-400">API: {apiStatus}</p>
      </div>
    </footer>
  );
};

export default Footer;
