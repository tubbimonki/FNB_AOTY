import { useEffect } from 'react';
import { prefersReducedMotion } from './motion';

// What fades in by itself. Any element can join with data-reveal,
// or opt out with data-reveal="off".
const SELECTOR = '[data-reveal], .card, .section-title, .section-label';

// Soft fade-in for every page, so no page needs its own code.
// How it works:
//   1. Look for cards and titles inside `ref`.
//   2. Anything already on screen is left alone (the page fade covers it).
//   3. Anything below the fold gets data-reveal="wait" (hidden, see index.css)
//      and an IntersectionObserver watches it.
//   4. When it scrolls into view it becomes data-reveal="in" and plays the
//      rise-in animation. Several at once get a small stagger.
// A MutationObserver repeats step 1 when content arrives later (API data).
// Browsers without IntersectionObserver (and Vitest's jsdom) skip all of it,
// and so do visitors who prefer reduced motion.
export const useScrollReveal = (ref, key) => {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;

    const seen = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          el.style.setProperty('--reveal-delay', `${Math.min(order++, 6) * 70}ms`);
          el.dataset.reveal = 'in';
          observer.unobserve(el);
        }
      },
      // Start a little before the element is fully in view.
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );

    const scan = () => {
      const below = window.innerHeight;
      for (const el of root.querySelectorAll(SELECTOR)) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.dataset.reveal === 'off') continue;
        // Inside something that already fades in: the parent carries it.
        if (el.parentElement?.closest('[data-reveal="wait"], [data-reveal="in"]')) continue;
        if (el.getBoundingClientRect().top < below) continue; // on screen or above it
        el.dataset.reveal = 'wait';
        observer.observe(el);
      }
    };

    scan();
    // New content (loaded news, events...) is checked once per frame at most.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [ref, key]);
};
