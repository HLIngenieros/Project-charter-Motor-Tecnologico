import { defineConfig, devices } from '@playwright/test'
import { PUERTO_API, PUERTO_WEB } from './e2e/datos'

// API y web propias (3300 y 5300): no chocan con el `npm run dev` (3100 y 5173).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
  outputDir: './e2e/.resultados',
  webServer: [
    {
      command: 'npx tsx e2e/servidor.ts',
      url: `http://localhost:${PUERTO_API}/api/auth/yo`,
      reuseExistingServer: true,
      stdout: 'pipe',
      timeout: 60_000,
    },
    {
      command: `npm run dev -w apps/web -- --port ${PUERTO_WEB} --strictPort`,
      url: `http://localhost:${PUERTO_WEB}`,
      env: { API_URL: `http://localhost:${PUERTO_API}` },
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
