// Small wrapper around localStorage that never throws (private mode,
// full storage or bad JSON just fall back to the default value).

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: the app keeps working, the data just won't survive a refresh.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore, as above.
  }
}
