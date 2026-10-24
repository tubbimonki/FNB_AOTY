import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="page text-center">
      <h2 className="page-title">Page not found</h2>
      <p className="page-intro mx-auto">That trail doesn't lead anywhere.</p>
      <Link to="/home" className="btn">Back to home</Link>
    </main>
  );
};

export default NotFound;
