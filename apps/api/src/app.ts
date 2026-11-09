import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyInstance } from 'fastify'
import { exigirCabeceraCsrf } from './auth/guardas'
import { rutasAuth } from './auth/rutas'
import type { Config } from './config'
import { crearDb, type BaseDatos } from './db/conexion'
import { ErrorApi, registrarErrores } from './errores'

export interface OpcionesApp {
  /** Por defecto, una base en memoria (útil en pruebas). */
  db?: BaseDatos
  config: Config
}

export async function construirApp({ db, config }: OpcionesApp): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: config.confiarProxy })
  app.decorate('config', config)
  app.decorate('db', db ?? crearDb(':memory:'))
  app.decorateRequest('usuario', undefined)

  registrarErrores(app)
  await app.register(cookie)
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () =>
      new ErrorApi(429, 'demasiados_intentos', 'Demasiados intentos. Espera unos minutos.'),
  })
  app.addHook('onRequest', exigirCabeceraCsrf)

  await app.register(
    async (api) => {
      api.get('/salud', async () => ({ ok: true }))
      await api.register(rutasAuth, { prefix: '/auth' })
    },
    { prefix: '/api' },
  )

  return app
}
