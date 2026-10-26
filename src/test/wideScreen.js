// jsdom has no matchMedia, so useWide() is false in tests (phone/laptop layout).
// Call this to pretend the screen is 1536px or wider; undo with `delete window.matchMedia`.
export function wideScreen() {
  window.matchMedia = (query) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} });
}
