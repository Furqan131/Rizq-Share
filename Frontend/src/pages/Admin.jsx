import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import { EmptyState, LoadingButton, SkeletonGrid } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { displayStatus, fmtDate, fmtDay } from '../utils.js';

const STATUS_LABEL = {
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  AVAILABLE: 'Available',
  CLAIMED: 'Claimed',
  COLLECTED: 'Collected',
  EXPIRED: 'Expired',
};

// Loads data from an admin endpoint and handles loading and error states
function useAdminData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api(path));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, setData, error, reload: load };
}

function Failed({ error, onRetry }) {
  return (
    <EmptyState title="Couldn't load this section" text={error}>
      <button className="btn btn-primary" onClick={onRetry}>Try again</button>
    </EmptyState>
  );
}

/* ---------- Overview ---------- */
function Overview({ onUnread, onPending }) {
  const { data, error, reload } = useAdminData('/admin/stats');

  useEffect(() => {
    if (data) {
      onUnread(data.unreadMessages);
      onPending(data.pendingPosts);
    }
  }, [data, onUnread, onPending]);

  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return <SkeletonGrid count={2} />;

  const items = [
    [data.pendingPosts, 'Pending approval'], [data.users, 'Users'], [data.admins, 'Admins'], [data.posts, 'Food posts'],
    [data.available, 'Available now'], [data.claimed, 'Waiting for pickup'],
    [data.collected, 'Collected'], [data.unreadMessages, 'Unread messages'],
  ];
  return (
    <div className="stats" style={{ marginTop: 0 }}>
      {items.map(([n, label]) => (
        <div className="stat" key={label}><strong>{n}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}

/* ---------- Approvals ---------- */
function ApprovalsTab({ onPending }) {
  const toast = useToast();
  const { data, error, reload } = useAdminData('/admin/posts?approval=PENDING');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { if (data) onPending(data.length); }, [data, onPending]);

  const changed = () => {
    reload();
    window.dispatchEvent(new Event('admin:refresh')); // updates the number in the navbar
  };

  const approve = async (post) => {
    setBusyId(post.id);
    try {
      await api(`/admin/posts/${post.id}/approve`, 'PATCH');
      toast('Approved. The post is now live.');
      changed();
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusyId('');
  };

  const reject = async () => {
    setBusyId(rejecting.id);
    try {
      await api(`/admin/posts/${rejecting.id}/reject`, 'PATCH', { reason: reason.trim() });
      toast('Post rejected');
      changed();
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusyId('');
    setRejecting(null);
    setReason('');
  };

  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return <SkeletonGrid count={2} />;
  if (data.length === 0) {
    return <EmptyState title="Nothing waiting for approval" text="New food posts will show up here for you to review." />;
  }

  return (
    <>
      <div className="grid">
        {data.map((p) => {
          const expired = new Date(p.expiresAt) < new Date();
          return (
            <article className="card" key={p.id}>
              <div className="card-top">
                <div>
                  <h3>{p.title}</h3>
                  <span className="pill">{p.quantity}</span>
                </div>
                <span className="chip PENDING">Pending</span>
              </div>
              {p.description && <p className="desc">{p.description}</p>}
              <p className="meta">Pickup: {p.address}, {p.area}, {p.city}</p>
              <p className="meta">Best before: {fmtDate(p.expiresAt)}</p>
              <p className="meta">Posted by {p.donor.name} ({p.donor.email})</p>
              {expired && <p className="note-line bad">This post has already expired.</p>}
              <div className="spacer" />
              <div className="modal-actions" style={{ marginTop: 4 }}>
                <button className="btn btn-danger" onClick={() => setRejecting(p)} disabled={busyId === p.id}>Reject</button>
                <LoadingButton busy={busyId === p.id} busyText="Approving..." onClick={() => approve(p)}>Approve</LoadingButton>
              </div>
            </article>
          );
        })}
      </div>

      {rejecting && (
        <Modal onClose={() => setRejecting(null)}>
          <h2>Reject this post?</h2>
          <p className="muted">"{rejecting.title}" will not go live. You can tell the donor why (optional).</p>
          <label className="field"><span>Reason</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="For example: please add a clearer pickup address" autoFocus />
          </label>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--chili)' }} onClick={reject}>Reject post</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------- Food posts ---------- */
function PostsTab() {
  const toast = useToast();
  const { data, error, reload } = useAdminData('/admin/posts');
  const [toDelete, setToDelete] = useState(null);

  const remove = async () => {
    try {
      await api('/admin/posts/' + toDelete.id, 'DELETE');
      toast('Post deleted');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
    setToDelete(null);
  };

  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return <SkeletonGrid count={2} />;
  if (data.length === 0) {
    return <EmptyState title="No food posts yet" text="Posts will appear here as people share food." />;
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Food</th><th>Donor</th><th>Location</th><th>Status</th><th>Expires</th><th /></tr>
          </thead>
          <tbody>
            {data.map((p) => {
              const status = displayStatus(p);
              return (
                <tr key={p.id}>
                  <td><strong>{p.title}</strong><small>{p.quantity}</small></td>
                  <td>{p.donor.name}<small>{p.donor.email}</small></td>
                  <td>{p.area}, {p.city}</td>
                  <td>
                    <span className={`chip ${status}`}>{STATUS_LABEL[status]}</span>
                    {p.claimedBy && <small>by {p.claimedBy.name}</small>}
                  </td>
                  <td>{fmtDate(p.expiresAt)}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <Modal onClose={() => setToDelete(null)}>
          <h2>Delete this post?</h2>
          <p className="muted">"{toDelete.title}" will be removed for everyone. This can't be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setToDelete(null)}>Keep it</button>
            <button className="btn btn-primary" style={{ background: 'var(--chili)' }} onClick={remove}>Delete post</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------- Users ---------- */
function UsersTab() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, error, reload } = useAdminData('/admin/users');

  const changeRole = async (id, role) => {
    try {
      await api(`/admin/users/${id}/role`, 'PATCH', { role });
      toast('Role updated');
    } catch (err) {
      toast(err.message, 'error');
    }
    reload();
  };

  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return <SkeletonGrid count={2} />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>City</th><th>Activity</th><th>Joined</th></tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id}>
              <td><strong>{u.name}</strong><small>{u.email}</small></td>
              <td>
                <select
                  aria-label={`Role for ${u.name}`}
                  value={u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                  disabled={u.id === me.id}
                  title={u.id === me.id ? "You can't change your own role" : undefined}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>{u.city || '-'}</td>
              <td>{u._count.posts} posted<small>{u._count.claims} claimed</small></td>
              <td>{fmtDay(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Messages ---------- */
function MessagesTab({ onUnread }) {
  const toast = useToast();
  const { data, error, reload } = useAdminData('/admin/messages');

  useEffect(() => {
    if (data) onUnread(data.filter((m) => !m.isRead).length);
  }, [data, onUnread]);

  const act = async (path, method, successText) => {
    try {
      await api(path, method);
      if (successText) toast(successText);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return <SkeletonGrid count={2} />;
  if (data.length === 0) {
    return <EmptyState title="No messages yet" text="Messages from the Contact us page will show up here." />;
  }

  return data.map((m) => (
    <article key={m.id} className={'msg' + (m.isRead ? '' : ' unread')}>
      <div className="msg-head">
        <div><strong>{m.name}</strong> <a href={`mailto:${m.email}`}>{m.email}</a></div>
        <span className="muted">{fmtDate(m.createdAt)}</span>
      </div>
      {m.subject && <p><strong>{m.subject}</strong></p>}
      <p>{m.message}</p>
      <div className="msg-actions">
        <a className="btn btn-ghost btn-sm" href={`mailto:${m.email}`}>Reply by email</a>
        {!m.isRead && (
          <button className="btn btn-ghost btn-sm" onClick={() => act(`/admin/messages/${m.id}/read`, 'PATCH')}>
            Mark as read
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => act('/admin/messages/' + m.id, 'DELETE', 'Message deleted')}>
          Delete
        </button>
      </div>
    </article>
  ));
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);

  const tabs = [
    ['overview', 'Overview'],
    ['approvals', 'Approvals'],
    ['posts', 'Food posts'],
    ['users', 'Users'],
    ['messages', 'Messages'],
  ];

  return (
    <>
      <main className="container section">
        <div className="section-head">
          <div>
            <h2>Admin panel</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>Keep Rizq Share safe and running smoothly.</p>
          </div>
        </div>

        <div className="tabbar" role="tablist">
          {tabs.map(([key, label]) => (
            <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              {label}
              {key === 'messages' && unread > 0 && <span className="count-dot">{unread}</span>}
              {key === 'approvals' && pending > 0 && <span className="count-dot">{pending}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview onUnread={setUnread} onPending={setPending} />}
        {tab === 'approvals' && <ApprovalsTab onPending={setPending} />}
        {tab === 'posts' && <PostsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'messages' && <MessagesTab onUnread={setUnread} />}
      </main>
    </>
  );
}
