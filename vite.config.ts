import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_PORT = Number(process.env.API_PORT) || 3000;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
      },
      '/account': {
        target: 'http://103.140.249.210:5285',
        changeOrigin: true,
        secure: false,
      },
      '/documents': {
        target: 'http://103.140.249.210:5285',
        changeOrigin: true,
        secure: false,
      },
      '/categories': {
        target: 'http://103.140.249.210:5285',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://103.140.249.210:5285',
        changeOrigin: true,
        secure: false,
      },
      '/shared': {
        target: 'http://103.140.249.210:5285',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: ['**/zip/**', '**/ai-study-hub/**'],
    },
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
