import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { loadJSON, saveJSON } from '../../services/storage';
import { PLACES, validPlace } from './weather';

const PLACE_KEY = 'weather:place';

// The chosen place (remembered in localStorage) and its weather from our own
// API, which caches Open-Meteo. status is 'loading' | 'ready' | 'error'.
export function useWeather() {
  const [place, setPlaceState] = useState(() => validPlace(loadJSON(PLACE_KEY, PLACES[0])));
  const [attempt, setAttempt] = useState(0); // bump to retry
  const [result, setResult] = useState({ key: null, status: 'loading', weather: null });

  const setPlace = useCallback((next) => {
    setPlaceState(next);
    saveJSON(PLACE_KEY, next);
  }, []);

  // Each request has a key. A result for an older key (a previous place or
  // attempt) doesn't count, so the page shows "loading" without a setState here.
  const key = `${place.lat},${place.lon},${attempt}`;

  useEffect(() => {
    let ignore = false; // the place changed before the answer arrived
    apiGet(`/weather?lat=${place.lat}&lon=${place.lon}`)
      .then((weather) => !ignore && setResult({ key, status: 'ready', weather }))
      .catch(() => !ignore && setResult({ key, status: 'error', weather: null }));
    return () => {
      ignore = true;
    };
  }, [key, place.lat, place.lon]);

  const current = result.key === key;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    place,
    setPlace,
    status: current ? result.status : 'loading',
    weather: current ? result.weather : null,
    retry,
  };
}
