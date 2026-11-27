import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Pages that need a logged-in user
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

// Pages only for admins (the server checks this too)
export function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
