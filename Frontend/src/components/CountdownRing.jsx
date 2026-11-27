import { useEffect, useState } from 'react';
import { useNow } from '../hooks/useNow.js';
import { formatLeft } from '../utils.js';

// The ring shrinks as the food nears its expiry, and changes color when time is short
export default function CountdownRing({ createdAt, expiresAt, sub = 'left' }) {
  const now = useNow();
  const [ready, setReady] = useState(false);

  // Two frames so the ring animates in from empty
  useEffect(() => {
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const start = new Date(createdAt).getTime();
  const end = new Date(expiresAt).getTime();
  const left = end - now;
  const fraction = Math.min(Math.max(left / Math.max(end - start, 1), 0), 1);

  let state = 'ok';
  if (left <= 0) state = 'expired';
  else if (left < 3600e3) state = 'urgent';
  else if (left < 3 * 3600e3) state = 'warn';

  return (
    <div className={`timer ${state}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle className="track" cx="22" cy="22" r="18" />
        <circle
          className="arc"
          cx="22"
          cy="22"
          r="18"
          pathLength="100"
          style={{ strokeDashoffset: ready ? 100 * (1 - fraction) : 100 }}
        />
      </svg>
      <div>
        <span className="t-label">{left <= 0 ? 'Expired' : `${formatLeft(left)} left`}</span>
        <span className="t-sub">{sub}</span>
      </div>
    </div>
  );
}
