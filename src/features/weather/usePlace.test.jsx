import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { getPlace, movedPlace, REFRESH_MS, setPlace, useLocationRefresh, usePlace } from './usePlace';

const gps = { id: 'gps', name: 'My location', lat: -26.2, lon: 28.05 };
const coords = (lat, lon) => ({ latitude: lat, longitude: lon });

// A fake navigator.geolocation that answers with whatever `next` holds.
function fakeGeolocation(next) {
  const geo = {
    getCurrentPosition: vi.fn((ok, fail) => (next.error ? fail(next.error) : ok({ coords: next.coords }))),
  };
  vi.stubGlobal('navigator', { ...navigator, geolocation: geo });
  return geo;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
});

describe('the shared place', () => {
  it('starts in Johannesburg, survives bad storage and keeps one object per value', () => {
    expect(getPlace().name).toBe('Johannesburg');
    localStorage.setItem('weather:place', '{not json');
    expect(getPlace().name).toBe('Johannesburg');
    setPlace(gps);
    expect(getPlace()).toBe(getPlace());
    expect(getPlace()).toEqual(gps);
  });

  it('moves every user of it together', () => {
    const a = renderHook(() => usePlace());
    const b = renderHook(() => usePlace());
    act(() => a.result.current[1](gps));
    expect(b.result.current[0]).toEqual(gps);
  });
});

describe('movedPlace', () => {
  it('ignores GPS jitter, follows real moves, and never overrides a picked city', () => {
    expect(movedPlace(gps, coords(-26.2001, 28.0501))).toBeNull(); // about 15 m
    expect(movedPlace(gps, coords(-26.21, 28.05))).toMatchObject({ id: 'gps', lat: -26.21 }); // about 1.1 km
    expect(movedPlace({ id: 'cpt', name: 'Cape Town', lat: -33.92, lon: 18.42 }, coords(-26.2, 28.05))).toBeNull();
  });
});

describe('useLocationRefresh', () => {
  it('re-reads the location every 10 minutes while "My location" is chosen', () => {
    vi.useFakeTimers();
    setPlace(gps);
    const next = { coords: coords(-26.2, 28.05) };
    const geo = fakeGeolocation(next);
    renderHook(() => useLocationRefresh());
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);

    next.coords = coords(-26.25, 28.05); // moved about 5 km
    act(() => vi.advanceTimersByTime(REFRESH_MS));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getPlace().lat).toBe(-26.25);
  });

  it('asks again when the tab comes back, but not twice in a minute', () => {
    vi.useFakeTimers();
    setPlace(gps);
    const geo = fakeGeolocation({ coords: coords(-26.2, 28.05) });
    renderHook(() => useLocationRefresh());
    act(() => window.dispatchEvent(new Event('focus')));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2 * 60 * 1000));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('stops after the person denies location, and leaves picked cities alone', () => {
    vi.useFakeTimers();
    setPlace(gps);
    const geo = fakeGeolocation({ error: { code: 1 } });
    renderHook(() => useLocationRefresh());
    act(() => vi.advanceTimersByTime(3 * REFRESH_MS));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getPlace()).toEqual(gps);

    setPlace({ id: 'dbn', name: 'Durban', lat: -29.86, lon: 31.03 });
    const city = fakeGeolocation({ coords: coords(-26.2, 28.05) });
    renderHook(() => useLocationRefresh());
    act(() => vi.advanceTimersByTime(REFRESH_MS));
    expect(city.getCurrentPosition).not.toHaveBeenCalled();
  });
});
