import { useEffect } from 'react';
import { prefersReducedMotion } from './motion';

// One listener for the whole page: as the pointer moves over a .card-link or
// [data-tilt] card, write its position into CSS variables on that card.
//   --mx / --my  where the soft glow sits (index.css draws it)
//   --rx / --ry  a tiny 3D tilt, only on [data-tilt] cards
// Touch screens have no hover, so they never see it.
export const usePointerGlow = (ref, key) => {
  useEffect(() => {
    const root = ref.current;
    if (!root || !window.matchMedia?.('(hover: hover)').matches) return;
    const tilt = !prefersReducedMotion();

    const move = (event) => {
      const card = event.target.closest?.('.card-link, [data-tilt]');
      if (!card || !root.contains(card)) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width; // 0 (left) to 1 (right)
      const y = (event.clientY - box.top) / box.height;
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (tilt && card.hasAttribute('data-tilt')) {
        card.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`);
      }
    };
    // Settle the tilt back when the pointer leaves a card.
    const leave = (event) => {
      const card = event.target.closest?.('[data-tilt]');
      if (card && !card.contains(event.relatedTarget)) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    };

    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerout', leave, { passive: true });
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerout', leave);
    };
  }, [ref, key]);
};
