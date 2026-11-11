import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { crearManejador } from '../src/vercel'
import { nuevaApp } from './ayudas'

let servidor: Server | undefined

afterEach(() => new Promise<void>((listo) => (servidor ? servidor.close(() => listo()) : listo())))

/** Monta el manejador en un puerto libre y cuenta cuántas veces se inicia la app. */
async function montar() {
  let inicios = 0
  const manejador = crearManejador(async () => {
    inicios++
    return (await nuevaApp()).app
  })
  servidor = createServer((req, res) => void manejador(req, res))
  await new Promise<void>((listo) => servidor!.listen(0, '127.0.0.1', listo))
  const { port } = servidor.address() as AddressInfo
  return {
    pedir: (ruta: string) => fetch(`http://127.0.0.1:${port}${ruta}`),
    inicios: () => inicios,
  }
}

describe('adaptador de Vercel', () => {
  it('si el arranque falla, la siguiente petición vuelve a intentarlo', async () => {
    let intentos = 0
    const manejador = crearManejador(async () => {
      if (++intentos === 1) throw new Error('base caída')
      return (await nuevaApp()).app
    })
    servidor = createServer((req, res) => {
      manejador(req, res).catch(() => res.writeHead(500).end())
    })
    await new Promise<void>((listo) => servidor!.listen(0, '127.0.0.1', listo))
    const { port } = servidor.address() as AddressInfo
    expect((await fetch(`http://127.0.0.1:${port}/api/salud`)).status).toBe(500)
    expect((await fetch(`http://127.0.0.1:${port}/api/salud`)).status).toBe(200)
  })

  it('reenvía la petición a Fastify', async () => {
    const { pedir } = await montar()
    const r = await pedir('/api/salud')
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true })
  })

  it('inicia la app una sola vez para peticiones seguidas', async () => {
    const { pedir, inicios } = await montar()
    await pedir('/api/salud')
    await pedir('/api/salud')
    expect(inicios()).toBe(1)
  })

  it('en frío, dos peticiones simultáneas comparten el mismo arranque', async () => {
    const { pedir, inicios } = await montar()
    const respuestas = await Promise.all([pedir('/api/salud'), pedir('/api/no-existe')])
    expect(respuestas.map((r) => r.status)).toEqual([200, 404])
    expect(inicios()).toBe(1)
  })
})
