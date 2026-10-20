import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.error(
              `[Vite Proxy Error] Unable to connect to backend API at http://localhost:5000 (${err.message}). Is the backend server running? Start both with 'npm run dev:all'.`
            );
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  message:
                    'HTTP 502 Bad Gateway: Backend server is not running on http://localhost:5000. Please start the backend service using "npm run dev:all".',
                  error: 'BACKEND_NOT_RUNNING'
                })
              );
            }
          });
        },
      },
    },
  },
})

