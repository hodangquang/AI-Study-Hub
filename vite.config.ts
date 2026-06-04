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
        target: 'https://ai-study-hub-zk1m.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/documents': {
        target: 'https://ai-study-hub-zk1m.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/categories': {
        target: 'https://ai-study-hub-zk1m.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
    watch: {
      ignored: ['**/zip/**', '**/ai-study-hub/**'],
    },
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
