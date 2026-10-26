import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './motion';

// Counts from 0 up to `target` once the element scrolls into view.
// Returns [ref, value]: put the ref on the element that shows the number.
// No IntersectionObserver or reduced motion: shows the target straight away.
export const useCountUp = (target, duration = 1200) => {
  const ref = useRef(null);
  const animate = typeof IntersectionObserver !== 'undefined' && !prefersReducedMotion();
  const [value, setValue] = useState(animate ? 0 : target);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;

    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        // Ease out: fast at first, settling gently on the number.
        setValue(Math.round(target * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, duration, animate]);

  return [ref, value];
};
