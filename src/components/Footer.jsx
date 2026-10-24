import { useApiHealth } from '../hooks/useApiHealth';

const Footer = () => {
  const apiStatus = useApiHealth();

  return (
    <footer className="mt-16 bg-forest-950 text-sm text-forest-200">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 sm:px-6">
        <p>&copy; 2026 Climate Awareness App. All rights reserved.</p>
        <p>Support organizations working on climate solutions.</p>
        <p className="text-forest-400">API: {apiStatus}</p>
      </div>
    </footer>
  );
};

export default Footer;
