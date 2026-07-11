import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: 'ripple',
  server: {
    proxy: {
      '/api': {
        target: 'https://resonance.flatgrass.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('User-Agent', 'Valve/Steam HTTP Client 1.0 GMod/13')

            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization)
            }
          })
        },
      },
    },
  },
})
