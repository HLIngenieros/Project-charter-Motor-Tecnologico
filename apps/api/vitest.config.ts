import { defineConfig } from 'vitest/config'

// PGlite tarda en arrancar (plantilla por archivo + un clon por caso); con varios archivos
// en paralelo, 5 s no alcanzan. TZ=UTC: así las pruebas de «hoy en Bogotá» fallan si el
// código depende de la zona del servidor (este PC ya está en Bogotá).
export default defineConfig({
  test: { testTimeout: 30_000, hookTimeout: 30_000, env: { TZ: 'UTC' } },
})
