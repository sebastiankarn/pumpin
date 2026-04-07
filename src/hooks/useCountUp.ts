import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const animFrom = useRef(0);

  useEffect(() => {
    const start = animFrom.current;
    animFrom.current = target;

    if (start === target) {
      setValue(target);
      return;
    }

    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Reset so StrictMode's second run re-animates from start
      animFrom.current = start;
    };
  }, [target, duration]);

  return value;
}
