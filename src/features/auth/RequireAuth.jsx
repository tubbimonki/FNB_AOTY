import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Wrap a route's element in this to make it members-only.
// Logged-out visitors go to /login, which sends them back afterwards.
//
// This only decides what to SHOW. It is not security: the API checks the
// session on every request (api/middleware/requireAuth.js).
const RequireAuth = ({ children }) => {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p className="p-6">Checking your session…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export default RequireAuth;
