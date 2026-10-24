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
    // the page in the middle of a test.
    watch: {
      ignored: ['**/karate/**'],
    },
  },
  // Vitest settings (https://vitest.dev/config/). jsdom gives tests a fake browser.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
  },
})
