import Fastify, { type FastifyInstance } from 'fastify'
import type { Config } from './config'
import { crearDb, type BaseDatos } from './db/conexion'

export interface OpcionesApp {
  /** Por defecto, una base en memoria (útil en pruebas). */
  db?: BaseDatos
  config: Config
}

export async function construirApp({ db, config }: OpcionesApp): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.decorate('config', config)
  app.decorate('db', db ?? crearDb(':memory:'))

  await app.register(
    async (api) => {
      api.get('/salud', async () => ({ ok: true }))
    },
    { prefix: '/api' },
  )

  return app
}
