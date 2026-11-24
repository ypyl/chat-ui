import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Demo app: `npm run dev` / `npm run build:demo`. The library has its own config, vite.lib.config.ts.
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the demo as a project site at /chat-ui/; dev and preview stay at /.
  base: process.env.DEMO_BASE ?? "/",
  build: {
    outDir: 'demo-dist',
  },
  server: {
    proxy: {
      '/agent': {
        target: 'http://localhost:5059',
        changeOrigin: true,
        headers: {
          Connection: "Keep-Alive"
        }
      },
    },
  },
})
