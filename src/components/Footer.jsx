import { Link } from 'react-router-dom';
import { useApiHealth } from '../hooks/useApiHealth';
import { APP_NAME } from '../brand';

// The info pages sit here instead of in the tabs.
const infoLinks = [
  { label: 'About', link: '/about' },
  { label: 'Features', link: '/features' },
  { label: 'Benefits', link: '/benefits' },
];

const Footer = () => {
  const apiStatus = useApiHealth();

  return (
    <footer className="mt-10 bg-forest-950 text-sm text-forest-200 sm:mt-16">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 sm:px-6">
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
