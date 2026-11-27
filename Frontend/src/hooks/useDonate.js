import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// What the "Donate now" buttons do
export function useDonate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return () => navigate(user ? '/dashboard?post=1' : '/auth?mode=signup');
}
