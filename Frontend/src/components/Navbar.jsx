import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonate } from '../hooks/useDonate.js';
import { roleLabel } from '../utils.js';
import { Logo, MenuIcon } from './icons.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const donate = useDonate();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close menus when the page changes
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close the profile menu when clicking elsewhere or pressing Escape
  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link className="brand" to="/"><Logo />Rizq Share</Link>

        <div className={'nav-menu' + (menuOpen ? ' open' : '')}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/browse">Browse food</NavLink>
          <NavLink to="/about">About us</NavLink>
          <NavLink to="/contact">Contact us</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </div>

        <div className="nav-actions">
          <button className="btn btn-accent btn-sm" onClick={donate}>Donate now</button>

          {user ? (
            <div className="profile" ref={profileRef}>
              <button
                className="avatar-btn"
                aria-label="My account"
                aria-haspopup="true"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              <div className={'menu-pop' + (profileOpen ? ' open' : '')} role="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <span className="role-tag">{roleLabel(user.role)}</span>
                </div>
                <Link to="/profile" role="menuitem">My profile</Link>
                <Link to="/dashboard" role="menuitem">Dashboard</Link>
                {isAdmin && <Link to="/admin" role="menuitem">Admin panel</Link>}
                <button className="danger" role="menuitem" onClick={handleLogout}>Log out</button>
              </div>
            </div>
          ) : (
            <Link className="btn btn-ghost btn-sm" to="/auth">Log in</Link>
          )}

          <button
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </nav>
  );
}
