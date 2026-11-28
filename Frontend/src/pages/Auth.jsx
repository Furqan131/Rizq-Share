import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { LoadingButton, LoadingOverlay } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once logged in (or if already logged in), go to the page the person wanted
  if (user) {
    const destination = (location.state && location.state.from && location.state.from.pathname) || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const signup = mode === 'signup';

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const body = { email: form.email.trim(), password: form.password };
    if (signup) {
      if (!form.name.trim()) { setError('Please enter your name.'); return; }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      Object.assign(body, { name: form.name.trim(), city: form.city.trim(), phone: form.phone.trim() });
    }

    setBusy(true);
    const started = Date.now();
    try {
      const data = await api('/auth/' + mode, 'POST', body);
      // Keep the loading screen up for a moment so it is noticeable even on a fast server
      const remaining = 700 - (Date.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      login(data);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <aside className="auth-side">
        <h2>Every meal you share is one less wasted.</h2>
        <p>Join people across Pakistan who are getting surplus food to others who need it.</p>
      </aside>

      <section className="auth-main">
        <div className="auth-box">
          <div className="seg" data-mode={mode}>
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')}>Log in</button>
            <button type="button" className={signup ? 'on' : ''} onClick={() => switchMode('signup')}>Sign up</button>
          </div>

          <form onSubmit={submit} noValidate>
            <div className={'reveal' + (signup ? ' open' : '')}>
              <div inert={signup ? undefined : ''}>
                <label className="field"><span>Full name</span>
                  <input value={form.name} onChange={set('name')} autoComplete="name" />
                </label>
                <div className="row">
                  <label className="field"><span>City</span>
                    <input value={form.city} onChange={set('city')} autoComplete="address-level2" />
                  </label>
                  <label className="field"><span>Phone</span>
                    <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                  </label>
                </div>
              </div>
            </div>

            <label className="field"><span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            <label className="field"><span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete={signup ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
              />
            </label>

            {!signup && (
              <p className="forgot"><Link to="/forgot-password" className="more-link">Forgot your password?</Link></p>
            )}

            <p className="error-text" role="alert">{error}</p>
            <LoadingButton className="btn btn-primary btn-block" type="submit" busy={busy} busyText={signup ? 'Creating account...' : 'Logging in...'}>
              {signup ? 'Create account' : 'Log in'}
            </LoadingButton>
          </form>
        </div>
      </section>
      {busy && (
        <LoadingOverlay
          title={signup ? 'Creating your account...' : 'Logging you in...'}
          text="Just a moment"
        />
      )}
    </main>
  );
}
