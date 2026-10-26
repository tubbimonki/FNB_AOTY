import { useEffect, useSyncExternalStore } from 'react';
import { saveJSON } from '../../services/storage';
import { distanceKm } from '../../../shared/geo.js';
import { PLACES, validPlace } from './weather';

// The one saved place behind weather, alerts, services and the map.
// A tiny store (not React state) so every page using it moves together when
// the place changes, including from another tab (the "storage" event).
const PLACE_KEY = 'weather:place';
export const REFRESH_MS = 10 * 60 * 1000; // re-read the device location this often
export const MIN_MOVE_KM = 0.5; // GPS jitters by tens of metres: ignore moves smaller than this

const listeners = new Set();
let last = { raw: undefined, place: PLACES[0] };

// Returns the same object until the stored text changes (useSyncExternalStore needs that).
export function getPlace() {
  let raw = null;
  try {
    raw = localStorage.getItem(PLACE_KEY);
  } catch {
    // storage blocked: use the default
  }
  if (raw !== last.raw) {
    let place = null;
    try {
      place = JSON.parse(raw);
    } catch {
      // bad JSON: fall back below
    }
    last = { raw, place: validPlace(place) };
  }
  return last.place;
}

export function setPlace(next) {
  saveJSON(PLACE_KEY, next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export const usePlace = () => [useSyncExternalStore(subscribe, getPlace), setPlace];

export const gpsPlace = ({ latitude, longitude }) => ({ id: 'gps', name: 'My location', lat: latitude, lon: longitude });

// A new fix -> the place to save, or null to keep the current one: only when
// the person chose "My location" (a city they picked stays put) and moved far enough.
export function movedPlace(place, coords) {
  if (place.id !== 'gps') return null;
  const next = gpsPlace(coords);
  return distanceKm(place, next) >= MIN_MOVE_KM ? next : null;
}

// Keeps "My location" current: reads the device location every 10 minutes
// and when the tab comes back into view. Polling getCurrentPosition, not
// watchPosition, because a watch keeps the GPS on and drains phone batteries.
// A "denied" answer stops it until the page reloads; the picker still works.
export function useLocationRefresh() {
  useEffect(() => {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;
    if (!geo) return undefined;
    let denied = false;
    let askedAt = -Infinity;

    const read = () => {
      // focus and visibilitychange often fire together: one ask a minute at most
      if (denied || document.hidden || getPlace().id !== 'gps' || Date.now() - askedAt < 60 * 1000) return;
      askedAt = Date.now();
      geo.getCurrentPosition(
        ({ coords }) => {
          const next = movedPlace(getPlace(), coords);
          if (next) setPlace(next);
        },
        (err) => {
          if (err.code === 1) denied = true; // PERMISSION_DENIED
        },
        { timeout: 15000, maximumAge: 5 * 60 * 1000 },
      );
    };

    read();
    const timer = setInterval(read, REFRESH_MS);
    window.addEventListener('focus', read);
    document.addEventListener('visibilitychange', read);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', read);
      document.removeEventListener('visibilitychange', read);
    };
  }, []);
}
