import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// API tests run in Node (no window), so only set up the browser bits for UI tests.
if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // No API runs during UI tests, so make fetch fail the same way it does offline.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
}
