import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Backend origin used by the dev proxy (override with VITE_PROXY_TARGET). */
const backendTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    // The frontend never needs the backend URL: everything goes through /api
    // so the same relative paths work in dev, preview and production.
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
