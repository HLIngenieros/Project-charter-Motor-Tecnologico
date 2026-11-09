import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/servidor.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  noExternal: ['@charter/shared'],
  clean: true,
})
