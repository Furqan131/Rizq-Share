export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="52 17" strokeLinecap="round" transform="rotate(-90 14 14)" />
      <circle cx="14" cy="14" r="4" fill="#f2b01e" />
    </svg>
  );
}

export const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const SuccessMark = () => (
  <div className="success-mark">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </div>
);
