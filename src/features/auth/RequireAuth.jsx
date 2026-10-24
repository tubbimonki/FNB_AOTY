import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Wrap a route's element in this to make it members-only.
// Logged-out visitors go to /login, which sends them back afterwards.
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export default RequireAuth;
