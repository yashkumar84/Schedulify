import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true,
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Socket.io connections to the backend
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      }
    },
    hmr: {
      protocol: 'wss',
      host: 'schedulifynow.com',
      clientPort: 443,
    }
  }
})
