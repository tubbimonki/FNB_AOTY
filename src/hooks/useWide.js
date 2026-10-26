import { useSyncExternalStore } from 'react';

// True on big desktop screens (Tailwind's 2xl, 1536px and up). Pages use it to
// add the extra quick widgets only where there is room, so phones and laptops
// don't load data they never show. Matches the 2xl: classes in the markup.
export const WIDE_QUERY = '(min-width: 96rem)';

const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(WIDE_QUERY) : null);

function subscribe(onChange) {
  const query = media();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

export const useWide = () => useSyncExternalStore(subscribe, () => media()?.matches ?? false, () => false);
