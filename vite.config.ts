import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Định nghĩa URL của Backend (Nếu chạy local thì dùng 127.0.0.1:5285)
// Nếu muốn chạy với server online, bạn đổi thành 'http://103.140.249.210:5285'
const BACKEND_URL = 'http://127.0.0.1:5285';

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
      '/account': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/api/gemini': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/documents': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/categories': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/shared': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/folders': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/chat': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: BACKEND_URL,
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
