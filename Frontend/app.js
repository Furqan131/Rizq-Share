// When you deploy the backend, change this to your live API address
const API = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

// Escapes text so user-entered content can't inject HTML
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();

  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An expired token means the person must log in again
    if (res.status === 401 && getToken()) {
      localStorage.clear();
    }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

function logout() {
  localStorage.clear();
  location.href = 'auth.html';
}

/* ---------- Navigation ---------- */
const LOGO = `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
  <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="52 17" stroke-linecap="round" transform="rotate(-90 14 14)"/>
  <circle cx="14" cy="14" r="4" fill="#f2b01e"/></svg>`;

function renderNav(active) {
  const user = getUser();
  const link = (href, label, key) =>
    `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;

  document.getElementById('nav').className = 'nav';
  document.getElementById('nav').innerHTML = `
    <div class="container nav-inner">
      <a class="brand" href="index.html">${LOGO}Rizq Share</a>
      <div class="nav-links">
        ${link('index.html', 'Browse food', 'browse')}
        ${user
          ? `${link('dashboard.html', 'Dashboard', 'dashboard')}
             <button class="link-btn" onclick="logout()">Log out</button>
             <span class="avatar" title="${esc(user.name)}">${esc(user.name.charAt(0).toUpperCase())}</span>`
          : `${link('auth.html', 'Log in', 'auth')}`}
      </div>
    </div>`;
}

/* ---------- Toasts ---------- */
function toast(message, type = 'ok') {
  let box = document.querySelector('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = message;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

/* ---------- Modal ---------- */
function onEscape(e) { if (e.key === 'Escape') closeModal(); }

function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onEscape);
  return overlay.querySelector('.modal');
}

function closeModal() {
  document.querySelectorAll('.overlay').forEach((o) => o.remove());
  document.removeEventListener('keydown', onEscape);
}

/* ---------- Countdown ring ---------- */
function timerHTML(post, sub = 'left to collect') {
  return `
    <div class="timer" data-timer data-start="${esc(post.createdAt)}" data-end="${esc(post.expiresAt)}">
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle class="track" cx="22" cy="22" r="18"/>
        <circle class="arc" cx="22" cy="22" r="18" pathLength="100"/>
      </svg>
      <div><span class="t-label">&nbsp;</span><span class="t-sub">${esc(sub)}</span></div>
    </div>`;
}

function formatLeft(ms) {
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

function tickTimers() {
  const now = Date.now();
  document.querySelectorAll('[data-timer]').forEach((el) => {
    const start = new Date(el.dataset.start).getTime();
    const end = new Date(el.dataset.end).getTime();
    const left = end - now;
    const fraction = Math.min(Math.max(left / Math.max(end - start, 1), 0), 1);

    el.querySelector('.arc').style.strokeDashoffset = String(100 * (1 - fraction));
    el.classList.remove('ok', 'warn', 'urgent', 'expired');
    if (left <= 0) el.classList.add('expired');
    else if (left < 3600e3) el.classList.add('urgent');
    else if (left < 3 * 3600e3) el.classList.add('warn');
    else el.classList.add('ok');

    el.querySelector('.t-label').textContent = left <= 0 ? 'Expired' : formatLeft(left) + ' left';
  });
}

let timerInterval;
function startTimers() {
  // Two frames so the rings animate in from empty
  requestAnimationFrame(() => requestAnimationFrame(tickTimers));
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimers, 30000);
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const ICON_PIN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
const ICON_USER = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`;