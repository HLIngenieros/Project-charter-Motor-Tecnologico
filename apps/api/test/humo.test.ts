import { describe, expect, it } from 'vitest'
import { construirApp } from '../src/app'
import { leerConfig } from '../src/config'

describe('api', () => {
  it('GET /api/salud responde ok', async () => {
    const app = await construirApp({ config: leerConfig({}) })
    const r = await app.inject({ method: 'GET', url: '/api/salud' })
    expect(r.statusCode).toBe(200)
    expect(r.json()).toEqual({ ok: true })
    await app.close()
  })
})
