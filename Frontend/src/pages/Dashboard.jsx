import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import CountdownRing from '../components/CountdownRing.jsx';
import { PinIcon, UserIcon } from '../components/icons.jsx';
import PostFoodModal from '../components/PostFoodModal.jsx';
import { EmptyState, LoadingButton, SkeletonGrid } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { displayStatus, fmtDate } from '../utils.js';

const statusLabel = (status, mode) => ({
  PENDING: 'Pending approval',
  REJECTED: 'Not approved',
  AVAILABLE: 'Available',
  CLAIMED: mode === 'posts' ? 'Waiting for pickup' : 'To collect',
  COLLECTED: 'Collected',
  EXPIRED: 'Expired',
}[status]);

// Posts nobody is collecting can be cancelled or deleted by their owner
const REMOVABLE = ['PENDING', 'AVAILABLE', 'REJECTED', 'EXPIRED'];

function DashCard({ post, mode, onCollect, onAsk }) {
  const [busy, setBusy] = useState(false);
  const status = displayStatus(post);
  const other = mode === 'posts' ? post.claimedBy : post.donor;
  const showTimer = status === 'AVAILABLE' || status === 'CLAIMED' || status === 'PENDING';

  const collect = async () => {
    setBusy(true);
    const ok = await onCollect(post.id);
    if (!ok) setBusy(false);
  };

  return (
    <article className="card">
      {post.imageUrl && <img className="card-img" src={post.imageUrl} alt={post.title} loading="lazy" />}
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
      {status === 'PENDING' && (
        <p className="note-line">An admin will review this before it goes live.</p>
      )}
      {status === 'REJECTED' && (
        <p className="note-line bad">Not approved{post.rejectionReason ? `: ${post.rejectionReason}` : '.'}</p>
      )}
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

      <div className="card-actions">
        {mode === 'posts' && status === 'CLAIMED' && (
          <>
            <LoadingButton className="btn btn-primary btn-block" busy={busy} busyText="Saving..." onClick={collect}>
              Mark as collected
            </LoadingButton>
            <button className="btn btn-ghost btn-block" onClick={() => onAsk('release', post, mode)}>
              Receiver not coming? Release claim
            </button>
          </>
        )}
        {mode === 'claims' && status === 'CLAIMED' && (
          <button className="btn btn-ghost btn-block" onClick={() => onAsk('release', post, mode)}>
            I can't collect this
          </button>
        )}
        {mode === 'posts' && REMOVABLE.includes(status) && (
          <button className="btn btn-ghost btn-block" onClick={() => onAsk('cancel', post, mode)}>
            {status === 'REJECTED' || status === 'EXPIRED' ? 'Delete post' : 'Cancel post'}
          </button>
        )}
      </div>
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
  const [posting, setPosting] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind: 'cancel' | 'release', post, mode }

  // "Donate now" sends people here with ?post=1, also when they are already on this page.
  // Open the form, then tidy the address.
  useEffect(() => {
    if (params.get('post') === '1') {
      setPosting(true);
      setParams({}, { replace: true });
    }
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

  // Each action returns true when it worked
  const act = async (path, method, successText) => {
    try {
      await api(path, method);
      toast(successText);
      load();
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  };

  const collect = (id) => act(`/posts/${id}/collect`, 'PATCH', 'Marked as collected');

  const confirmConfig = () => {
    const { kind, post, mode } = confirm;
    if (kind === 'cancel') {
      const gone = ['REJECTED', 'EXPIRED'].includes(displayStatus(post));
      return {
        title: gone ? 'Delete this post?' : 'Cancel this post?',
        text: 'It will be removed, and nobody will be able to claim it.',
        confirmText: gone ? 'Yes, delete it' : 'Yes, cancel post',
        busyText: 'Removing...',
        danger: true,
        run: () => act(`/posts/${post.id}`, 'DELETE', 'Post removed'),
      };
    }
    return mode === 'posts'
      ? {
          title: 'Release this claim?',
          text: 'The receiver loses the reservation, and the food goes back on the Browse page for someone else.',
          confirmText: 'Yes, release it',
          busyText: 'Releasing...',
          run: () => act(`/posts/${post.id}/release`, 'PATCH', 'Released. The food is available again.'),
        }
      : {
          title: 'Give this food back?',
          text: 'It goes back on the Browse page so someone else can claim it.',
          confirmText: 'Yes, give it back',
          busyText: 'Releasing...',
          run: () => act(`/posts/${post.id}/release`, 'PATCH', 'Done. The food is available again.'),
        };
  };

  const count = (status) => (data ? data.posts.filter((p) => displayStatus(p) === status).length : 0);
  const stats = [
    [count('PENDING'), 'Awaiting approval'],
    [count('AVAILABLE'), 'Posts available'],
    [count('CLAIMED'), 'Waiting for pickup'],
    [count('COLLECTED'), 'Posts collected'],
    [data ? data.claims.filter((p) => p.status === 'CLAIMED').length : 0, 'Claims to collect'],
  ];

  const list = data ? data[tab] : null;
  const cfg = confirm ? confirmConfig() : null;

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
            {list.map((p) => (
              <DashCard
                key={p.id}
                post={p}
                mode={tab}
                onCollect={collect}
                onAsk={(kind, post, mode) => setConfirm({ kind, post, mode })}
              />
            ))}
          </div>
        )}
      </main>

      {posting && (
        <PostFoodModal
          onClose={() => setPosting(false)}
          onPosted={() => { setTab('posts'); load(); }}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={cfg.title}
          text={cfg.text}
          confirmText={cfg.confirmText}
          busyText={cfg.busyText}
          danger={cfg.danger}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const ok = await cfg.run();
            if (ok) setConfirm(null);
            return ok;
          }}
        />
      )}
    </>
  );
}
