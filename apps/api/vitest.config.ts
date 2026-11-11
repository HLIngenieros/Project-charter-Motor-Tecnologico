import { defineConfig } from 'vitest/config'

// PGlite tarda en arrancar (plantilla por archivo + un clon por caso); con varios archivos
// en paralelo, 5 s no alcanzan.
export default defineConfig({
  test: { testTimeout: 30_000, hookTimeout: 30_000 },
})
