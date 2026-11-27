import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonate } from '../hooks/useDonate.js';
import { Logo } from './icons.jsx';

export default function Footer() {
  const { user, isAdmin } = useAuth();
  const donate = useDonate();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand" to="/"><Logo />Rizq Share</Link>
          <p>Post surplus food, find it near you, and collect it before it spoils.</p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/browse">Browse food</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4>Your account</h4>
          <ul>
            <li><button className="footer-link" onClick={donate}>Donate now</button></li>
            {user ? (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/profile">My profile</Link></li>
                {isAdmin && <li><Link to="/admin">Admin panel</Link></li>}
              </>
            ) : (
              <>
                <li><Link to="/auth">Log in</Link></li>
                <li><Link to="/auth?mode=signup">Sign up</Link></li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h4>Good to know</h4>
          <p>Check food yourself before eating it. Rizq Share connects people, but it cannot inspect food.</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>&copy; {new Date().getFullYear()} Rizq Share</span>
        <span>Sharing surplus food in Pakistan.</span>
      </div>
    </footer>
  );
}
