import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { construirApp } from '../src/app'
import { cargarEntorno, leerConfig } from '../src/config'
import { crearDb } from '../src/db/conexion'

describe('confiar en el proxy', () => {
  it('por defecto no confía en X-Forwarded-For', () => {
    expect(leerConfig({}).confiarProxy).toBe(false)
    expect(leerConfig({ CONFIAR_PROXY: 'true' }).confiarProxy).toBe(true)
  })

  it('con CONFIAR_PROXY=true, el límite de login es por IP real del cliente', async () => {
    const app = await construirApp({
      db: crearDb(':memory:'),
      config: leerConfig({ CONFIAR_PROXY: 'true' }),
    })
    // Todas las peticiones llegan desde el proxy (127.0.0.1) con IPs de cliente distintas.
    for (let i = 0; i < 12; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-requested-with': 'charter', 'x-forwarded-for': `10.1.0.${i}` },
        payload: { correo: `u${i}@hlingenieros.com`, clave: 'mala-clave-xx' },
      })
      expect(r.statusCode, `intento ${i + 1}`).toBe(401)
    }
    await app.close()
  })
})

describe('cargarEntorno', () => {
  it('lee el .env si existe y no pisa variables ya definidas', () => {
    const carpeta = mkdtempSync(join(tmpdir(), 'charter-env-'))
    const archivo = join(carpeta, '.env')
    writeFileSync(archivo, 'COOKIE_SEGURA=true\nPUERTO=4000\n')
    const entorno: Record<string, string | undefined> = { PUERTO: '5000' }
    expect(cargarEntorno(archivo, entorno)).toBe(true)
    expect(entorno.COOKIE_SEGURA).toBe('true')
    expect(entorno.PUERTO).toBe('5000')
  })

  it('no falla si el .env no existe', () => {
    expect(cargarEntorno(join(tmpdir(), 'no-existe-charter.env'), {})).toBe(false)
  })
})
