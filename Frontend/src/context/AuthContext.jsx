import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readUser() : null));

  // Saves a { token, user } response from the backend (login, signup, profile update)
  const login = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // api.js fires this when the server says the token is no longer valid
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAdmin: !!user && user.role === 'ADMIN', login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
