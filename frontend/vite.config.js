import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 4001,
    allowedHosts: ['panemail.amiigo.in'],
  },
  server: {
    port: 5001,
  },
})
