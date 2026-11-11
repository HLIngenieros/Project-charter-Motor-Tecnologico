import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/servidor.ts', 'src/vercel.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  noExternal: ['@charter/shared'],
  // PGlite solo se usa en desarrollo: nunca dentro de la función de Vercel.
  external: ['@electric-sql/pglite'],
  clean: true,
})
