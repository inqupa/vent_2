// vite.config.js
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  server: {
    https: true,
    port: 3000,
    open: true,
    proxy: {
      // Forward any request starting with /api to Wrangler
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        auth: 'skeleton/auth_placeholder.html',
        profile: 'skeleton/profile_placeholder.html',
        problem: 'skeleton/problem_placeholder.html'
      }
    }
  }
});