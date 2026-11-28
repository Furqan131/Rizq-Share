import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { SuccessMark } from '../components/icons.jsx';
import { LoadingButton } from '../components/ui.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      await api('/auth/reset-password', 'POST', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <main className="container section narrow">
        <div className="form-card">
          <h2>This link is incomplete</h2>
          <p className="muted">The reset link is missing its code. Please open the link from your email again, or request a new one.</p>
          <Link className="btn btn-primary" to="/forgot-password">Request a new link</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container section narrow">
      <div className="form-card">
        {done ? (
          <>
            <SuccessMark />
            <h2>Password changed</h2>
            <p className="muted">Your password has been updated. You can log in with it now.</p>
            <Link className="btn btn-primary" to="/auth">Log in</Link>
          </>
        ) : (
          <>
            <h2>Choose a new password</h2>
            <form onSubmit={submit} noValidate>
              <label className="field"><span>New password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" autoFocus />
              </label>
              <label className="field"><span>Confirm new password</span>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </label>
              <p className="error-text" role="alert">
                {error}
                {error.includes('expired') && <> <Link to="/forgot-password" className="more-link">Request a new link</Link></>}
              </p>
              <LoadingButton type="submit" className="btn btn-primary btn-block" busy={busy} busyText="Saving...">
                Change password
              </LoadingButton>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
