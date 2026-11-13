/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Las librerías cambian poco: en archivos aparte, el navegador las conserva entre despliegues.
        manualChunks: {
          react: [
            'react',
            'react-dom',
            'react-dom/client',
            'react-router',
            '@tanstack/react-query',
          ],
          motion: ['motion'],
          zod: ['zod'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Las pruebas E2E apuntan a su propia API con API_URL.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3100' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/preparar.ts'],
  },
})
