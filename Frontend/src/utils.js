export function formatLeft(ms) {
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export const fmtDay = (iso) => new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });

// A post that is still AVAILABLE but past its time is shown as expired
export const displayStatus = (p) =>
  p.status === 'AVAILABLE' && new Date(p.expiresAt) < new Date() ? 'EXPIRED' : p.status;

// One account type for everyone. Only admins are special.
export const roleLabel = (role) => (role === 'ADMIN' ? 'Admin' : 'Member');
