import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/agent-api': {
        target: 'https://api.laogou8.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-api/, ''),
      },
    },
  },
})
