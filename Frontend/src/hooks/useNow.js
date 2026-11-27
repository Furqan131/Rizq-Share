import { useEffect, useState } from 'react';

// One shared 30-second timer for every countdown ring on the page
const listeners = new Set();
let timerId = null;

export function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const listener = () => setNow(Date.now());
    listeners.add(listener);
    if (!timerId) {
      timerId = setInterval(() => listeners.forEach((fn) => fn()), 30000);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        clearInterval(timerId);
        timerId = null;
      }
    };
  }, []);

  return now;
}
