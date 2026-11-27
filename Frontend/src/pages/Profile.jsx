import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDonate } from '../hooks/useDonate.js';
import { displayStatus, fmtDay } from '../utils.js';

export default function Profile() {
  const { login } = useAuth();
  const toast = useToast();
  const donate = useDonate();
  const [activity, setActivity] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', city: '', phone: '' });
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const fill = (u) => {
    setProfile(u);
    setForm({ name: u.name, city: u.city || '', phone: u.phone || '' });
  };

  const load = () => {
    setLoadError('');
    api('/me').then(fill).catch((err) => setLoadError(err.message));
  };

  useEffect(load, []);

  // Small summary shown beside the form (if it fails, the card simply stays hidden)
  useEffect(() => {
    Promise.all([api('/posts/my/posts'), api('/posts/my/claims')])
      .then(([posts, claims]) => setActivity({
        shared: posts.length,
        collected: posts.filter((x) => displayStatus(x) === 'COLLECTED').length,
        claimed: claims.length,
      }))
      .catch(() => {});
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/me', 'PATCH', {
        name: form.name.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      });
      login(data); // updates the name in the navbar too
      fill({ ...profile, ...data.user });
      toast('Profile saved');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <main className="container section">
        <div className="two-col">
        <div className="form-card">
          {loadError ? (
            <>
              <h2>Couldn't load your profile</h2>
              <p className="muted">{loadError}</p>
              <button className="btn btn-primary" onClick={load}>Try again</button>
            </>
          ) : !profile ? (
            <div className="skeleton" style={{ minHeight: 260 }} />
          ) : (
            <>
              <div className="profile-top">
                <div className="big-avatar">{profile.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{profile.name}</h2>
                  <span className="muted">Member since {fmtDay(profile.createdAt)}</span>
                </div>
              </div>

              <form onSubmit={save} noValidate>
                <label className="field"><span>Full name</span>
                  <input value={form.name} onChange={set('name')} autoComplete="name" />
                </label>
                <label className="field"><span>Email</span>
                  <input value={profile.email} readOnly />
                </label>
                <div className="row">
                  <label className="field"><span>City</span>
                    <input value={form.city} onChange={set('city')} />
                  </label>
                  <label className="field"><span>Phone</span>
                    <input type="tel" value={form.phone} onChange={set('phone')} />
                  </label>
                </div>
                <p className="muted">
                  Account type: <strong>{profile.role === 'ADMIN' ? 'Administrator' : 'Member'}</strong>. The same account can donate and receive food.
                </p>
                <p className="error-text" role="alert">{error}</p>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </>
          )}
        </div>

        <aside className="side-stack">
          <div className="side-card">
            <h3>Your activity</h3>
            {activity ? (
              <div className="mini-stats">
                <div><strong>{activity.shared}</strong><span>Posts shared</span></div>
                <div><strong>{activity.collected}</strong><span>Collected</span></div>
                <div><strong>{activity.claimed}</strong><span>Claimed</span></div>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Loading your activity...</p>
            )}
            <p style={{ margin: '14px 0 0' }}><Link to="/dashboard" className="more-link">Open your dashboard</Link></p>
          </div>
          <div className="side-card dark">
            <h3>Got food to share?</h3>
            <p>Post it in under a minute and someone nearby can collect it before it spoils.</p>
            <button className="btn btn-accent btn-sm" onClick={donate}>Donate now</button>
          </div>
        </aside>
        </div>
      </main>
    </>
  );
}
