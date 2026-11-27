import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import CountdownRing from '../components/CountdownRing.jsx';
import { PinIcon, UserIcon } from '../components/icons.jsx';
import PostFoodModal from '../components/PostFoodModal.jsx';
import { EmptyState, SkeletonGrid } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { displayStatus, fmtDate } from '../utils.js';

const statusLabel = (status, mode) => ({
  AVAILABLE: 'Available',
  CLAIMED: mode === 'posts' ? 'Waiting for pickup' : 'To collect',
  COLLECTED: 'Collected',
  EXPIRED: 'Expired',
}[status]);

function DashCard({ post, mode, onCollect }) {
  const [busy, setBusy] = useState(false);
  const status = displayStatus(post);
  const other = mode === 'posts' ? post.claimedBy : post.donor;
  const showTimer = status === 'AVAILABLE' || status === 'CLAIMED';

  const collect = async () => {
    setBusy(true);
    const ok = await onCollect(post.id);
    if (!ok) setBusy(false);
  };

  return (
    <article className="card">
      <div className="card-top">
        <div>
          <h3>{post.title}</h3>
          <span className="pill">{post.quantity}</span>
        </div>
        <span className={`chip ${status}`}>{statusLabel(status, mode)}</span>
      </div>
      {showTimer
        ? <CountdownRing createdAt={post.createdAt} expiresAt={post.expiresAt} />
        : <p className="meta muted">Expires {fmtDate(post.expiresAt)}</p>}
      <p className="meta"><PinIcon /><span>{post.address}, {post.area}, {post.city}</span></p>
      {other && (
        <p className="meta">
          <UserIcon />
          <span>
            {mode === 'posts' ? 'Claimed by' : 'Shared by'} {other.name}
            {other.phone && <> · <a href={`tel:${other.phone}`}>{other.phone}</a></>}
          </span>
        </p>
      )}
      <div className="spacer" />
      {mode === 'posts' && status === 'CLAIMED' && (
        <button className="btn btn-primary btn-block" onClick={collect} disabled={busy}>
          {busy ? 'Saving...' : 'Mark as collected'}
        </button>
      )}
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('posts');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(params.get('post') === '1');

  // Remove ?post=1 from the address once the form has opened
  useEffect(() => {
    if (params.get('post') === '1') setParams({}, { replace: true });
  }, [params, setParams]);

  const load = useCallback(async () => {
    try {
      const [posts, claims] = await Promise.all([api('/posts/my/posts'), api('/posts/my/claims')]);
      setData({ posts, claims });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const collect = async (id) => {
    try {
      await api(`/posts/${id}/collect`, 'PATCH');
      toast('Marked as collected');
      load();
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  };

  const count = (status) => (data ? data.posts.filter((p) => displayStatus(p) === status).length : 0);
  const stats = [
    [count('AVAILABLE'), 'Posts available'],
    [count('CLAIMED'), 'Waiting for pickup'],
    [count('COLLECTED'), 'Posts collected'],
    [data ? data.claims.filter((p) => p.status === 'CLAIMED').length : 0, 'Claims to collect'],
  ];

  const list = data ? data[tab] : null;

  return (
    <>
      <main className="container section">
        <div className="section-head">
          <div>
            <h2>Welcome, {user.name.split(' ')[0]}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>Food you've shared and food you've claimed, all in one place.</p>
          </div>
          <button className="btn btn-accent" onClick={() => setPosting(true)}>Post food</button>
        </div>

        <div className="stats">
          {stats.map(([n, label]) => (
            <div className="stat" key={label}><strong>{n}</strong><span>{label}</span></div>
          ))}
        </div>

        <div className="tabbar" role="tablist">
          <button className={tab === 'posts' ? 'on' : ''} onClick={() => setTab('posts')}>
            My posts{data ? ` (${data.posts.length})` : ''}
          </button>
          <button className={tab === 'claims' ? 'on' : ''} onClick={() => setTab('claims')}>
            My claims{data ? ` (${data.claims.length})` : ''}
          </button>
        </div>

        {error ? (
          <EmptyState title="Couldn't load your dashboard" text={error}>
            <button className="btn btn-primary" onClick={load}>Try again</button>
          </EmptyState>
        ) : !list ? (
          <SkeletonGrid count={2} />
        ) : list.length === 0 ? (
          tab === 'posts' ? (
            <EmptyState title="You haven't posted any food yet" text="Got extra food today? Share it in under a minute.">
              <button className="btn btn-primary" onClick={() => setPosting(true)}>Post food</button>
            </EmptyState>
          ) : (
            <EmptyState title="You haven't claimed any food yet" text="Browse what's available near you and claim a meal.">
              <Link className="btn btn-primary" to="/browse">Browse food</Link>
            </EmptyState>
          )
        ) : (
          <div className="grid">
            {list.map((p) => <DashCard key={p.id} post={p} mode={tab} onCollect={collect} />)}
          </div>
        )}
      </main>


      {posting && (
        <PostFoodModal
          onClose={() => setPosting(false)}
          onPosted={() => { setTab('posts'); load(); }}
        />
      )}
    </>
  );
}
