import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { SuccessMark } from '../components/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Put your real contact email here (for example 'hello@yourdomain.com') to show it on this page
const CONTACT_EMAIL = '';

const SUBJECTS = ['General question', 'Report a post', 'Feedback or idea', 'Partnership or NGO', 'Something else'];

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    setBusy(true);
    try {
      await api('/contact', 'POST', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setSentTo(form.email.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <div className="container">
          <h1>Tell us what's on your mind.</h1>
          <p>Feedback, a problem with a post, or an idea for working together: we read every message.</p>
        </div>
      </header>

      <main className="section container">
        <div className="two-col stretch">
          <div className="form-card">
            {sentTo ? (
              <>
                <SuccessMark />
                <h2>Message sent</h2>
                <p className="muted">Thanks for writing to us. We'll reply to {sentTo}.</p>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setSentTo(''); setBusy(false); setForm({ ...form, message: '' }); }}
                >
                  Send another message
                </button>
              </>
            ) : (
              <>
                <h2>Send a message</h2>
                <form onSubmit={submit} noValidate>
                  <div className="row">
                    <label className="field"><span>Your name</span>
                      <input value={form.name} onChange={set('name')} autoComplete="name" />
                    </label>
                    <label className="field"><span>Email</span>
                      <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                    </label>
                  </div>
                  <label className="field"><span>What is this about?</span>
                    <select value={form.subject} onChange={set('subject')}>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>Message</span>
                    <textarea rows={6} maxLength={2000} value={form.message} onChange={set('message')} placeholder="Write your message here" />
                  </label>
                  <p className="error-text" role="alert">{error}</p>
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    {busy ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </>
            )}
          </div>

          <aside className="side-stack">
            <div className="side-card">
              <h3>Good things to include</h3>
              <ul>
                <li>For a post problem, the food title, area and donor name.</li>
                <li>For a bug, what you clicked and what you expected to happen.</li>
                <li>For a partnership, your organisation and the city you work in.</li>
              </ul>
            </div>

            <div className="side-card white">
              <h3>Looking for a quick answer?</h3>
              <p>Many questions are already answered on our About page, such as how claiming works and what happens to expired food.</p>
              <Link className="btn btn-ghost btn-sm" to="/about">Read the questions people ask</Link>
              {CONTACT_EMAIL && (
                <p style={{ marginTop: 14 }}>You can also email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
              )}
            </div>

            <div className="side-card dark">
              <h3>What happens to your message</h3>
              <ol>
                <li>It goes straight to the Rizq Share admin team.</li>
                <li>We look into it, and remove posts that break the rules.</li>
                <li>If you asked a question, we reply to the email you gave.</li>
              </ol>
            </div>
          </aside>
        </div>
      </main>

    </>
  );
}
