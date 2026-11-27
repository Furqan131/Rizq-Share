import { createPortal } from 'react-dom';

export function SkeletonGrid({ count = 3 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

// Small spinning circle, used inside buttons
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

// A button that shows a spinner and different text while busy
export function LoadingButton({ busy, busyText, children, className = 'btn btn-primary', disabled, ...props }) {
  return (
    <button className={className} disabled={busy || disabled} {...props}>
      {busy && <Spinner />}
      {busy && busyText ? busyText : children}
    </button>
  );
}

// Full-screen loading message, for actions the person is waiting on (login, signup)
export function LoadingOverlay({ title, text }) {
  return createPortal(
    <div className="busy-overlay" role="status" aria-live="polite">
      <div className="busy-card">
        <svg className="ring-loader" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#dce5e0" strokeWidth="6" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#0e3b2f" strokeWidth="6" strokeLinecap="round" strokeDasharray="60 104" />
        </svg>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
      </div>
    </div>,
    document.body
  );
}
