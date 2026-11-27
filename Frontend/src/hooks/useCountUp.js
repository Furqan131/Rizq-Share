import { useEffect, useState } from 'react';

// Counts from 0 up to the target number once
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target || 0);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const step = (now) => {
      const k = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
