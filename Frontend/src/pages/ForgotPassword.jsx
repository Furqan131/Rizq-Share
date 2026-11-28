import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { SuccessMark } from '../components/icons.jsx';
import { LoadingButton } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    try {
      await api('/auth/forgot-password', 'POST', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <main className="container section narrow">
      <div className="form-card">
        {sent ? (
          <>
            <SuccessMark />
            <h2>Check your email</h2>
            <p className="muted">
              If an account with <strong>{email.trim()}</strong> exists, we've sent a link to reset the password. The link works for one hour. Check your spam folder too.
            </p>
            <Link className="btn btn-ghost" to="/auth">Back to log in</Link>
          </>
        ) : (
          <>
            <h2>Forgot your password?</h2>
            <p className="muted">Enter the email you signed up with, and we'll send you a link to choose a new password.</p>
            <form onSubmit={submit} noValidate>
              <label className="field"><span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
              </label>
              <p className="error-text" role="alert">{error}</p>
              <LoadingButton type="submit" className="btn btn-primary btn-block" busy={busy} busyText="Sending...">
                Send reset link
              </LoadingButton>
            </form>
            <p style={{ marginTop: 16 }}><Link to="/auth" className="more-link">Back to log in</Link></p>
          </>
        )}
      </div>
    </main>
  );
}
