import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Makes a route members-only: logged-out visitors go to /login and come back
// afterwards. Display only; the API checks the session on every request.
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
