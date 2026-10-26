import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // During `npm run dev`, any request to /api/... is forwarded to the
    // Express server, so the frontend never hardcodes localhost:4000.
    proxy: {
      '/api': 'http://localhost:4000',
    },
    // The Karate tests write reports and a Chrome profile into karate/target
    // while they run. Without this, Vite sees those files change and reloads
    // the page in the middle of a test. data/ is the local database (PGlite),
    // which writes files all the time.
    watch: {
      ignored: ['**/karate/**', '**/data/**'],
    },
  },
  // Vitest settings (https://vitest.dev/config/). jsdom gives tests a fake browser.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js', 'shared/**/*.test.js'],
    // The first API test in a file starts an in-memory Postgres (PGlite),
    // which takes a few seconds, so allow more than the default 5 s.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
