import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <Link to="/home" className="hover:underline">Back to home</Link>
    </main>
  );
};

export default NotFound;
