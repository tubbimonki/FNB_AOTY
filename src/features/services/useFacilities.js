import { useEffect } from 'react';
import { loadJSON, saveJSON } from '../../services/storage';
import { useApiData } from '../../hooks/useApiData';
import { placeKey } from '../../../shared/geo.js';
import { usePlace } from '../weather/usePlace';

// The last good answer per rounded place (about 1 km), newest first, so the
// page shows facilities at once and still has them when the API is down.
const CACHE_KEY = 'facilities:cache';
const KEEP_PLACES = 5;

export const loadCachedFacilities = (key) => {
  const saved = loadJSON(CACHE_KEY, []);
  return (Array.isArray(saved) && saved.find((entry) => entry?.key === key)) || null;
};

export function saveCachedFacilities(key, data, savedAt = Date.now()) {
  const saved = loadJSON(CACHE_KEY, []);
  const others = Array.isArray(saved) ? saved.filter((entry) => entry?.key !== key) : [];
  saveJSON(CACHE_KEY, [{ key, data, savedAt }, ...others].slice(0, KEEP_PLACES));
}

// Facilities near a place: the one passed in (the map), else the shared place
// (Johannesburg until one is picked). The API rounds the coordinates, so the
// exact spot never leaves the server.
// Stale-while-revalidate: while the API answers (or if it fails) the saved
// copy is shown with cached: true and savedAt; a fresh answer replaces it.
export function useFacilities(near) {
  const [shared] = usePlace();
  const place = near ?? shared;
  const key = placeKey(place.lat, place.lon);
  const api = useApiData(`/services/facilities?lat=${place.lat}&lon=${place.lon}`);
  const live = api.status === 'ready' && api.data.facilities?.length > 0 ? api.data : null;

  useEffect(() => {
    if (live) saveCachedFacilities(key, live);
  }, [key, live]);

  if (api.status !== 'ready' || !live) {
    const copy = loadCachedFacilities(key);
    if (copy && (api.status !== 'ready' || !api.data.facilities?.length)) {
      return { place, status: 'ready', data: copy.data, cached: true, savedAt: copy.savedAt, apiStatus: api.status };
    }
  }
  return { place, status: api.status, data: api.data, cached: false, savedAt: null, apiStatus: api.status };
}
