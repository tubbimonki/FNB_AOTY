import { useEffect } from 'react';
import { prefersReducedMotion } from './motion';

// Writes how far the page has scrolled past `ref` into --parallax (in px),
// times `speed`. CSS then moves a background by it, so the photo drifts slower
// than the page: the "depth" effect. One update per frame, and none once the
// element is off screen.
export const useParallax = (ref, speed = 0.3) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, bottom } = el.getBoundingClientRect();
      if (bottom < 0) return; // scrolled away: nothing to move
      el.style.setProperty('--parallax', `${(-top * speed).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [ref, speed]);
};
