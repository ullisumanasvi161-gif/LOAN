import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/researchers': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/microscopes': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/loans': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
