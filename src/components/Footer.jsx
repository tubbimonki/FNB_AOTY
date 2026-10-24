import { useApiHealth } from '../hooks/useApiHealth';

const Footer = () => {
  const apiStatus = useApiHealth();

  return (
    <footer className="mt-12 p-6 text-sm text-gray-600 border-t">
      <p>&copy; 2026 Climate Awareness App. All rights reserved.</p>
      <p>Support organizations working on climate solutions.</p>
      <p>API: {apiStatus}</p>
    </footer>
  );
};

export default Footer;
