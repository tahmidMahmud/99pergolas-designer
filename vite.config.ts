import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API runs separately in dev: `npm run dev:api` (scripts/dev-api.mjs on :8787), or
// `npm run preview:cf` (wrangler, real Pages Functions) after a build.
const api = 'http://localhost:8787'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: api, changeOrigin: false },
      '^/d/[^/]+$': { target: api, changeOrigin: false },
      '^/og/[^/]+$': { target: api, changeOrigin: false },
    },
  },
})
