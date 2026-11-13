import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyInstance } from 'fastify'
import { exigirCabeceraCsrf } from './auth/guardas'
import { rutasAuth } from './auth/rutas'
import type { Config } from './config'
import type { BaseDatos } from './db/conexion'
import { ErrorApi, registrarErrores } from './errores'
import { rutasCatalogos } from './modulos/catalogos/rutas'
import { rutasCharters } from './modulos/charters/rutas'
import { rutasAdmin } from './modulos/admin/rutas'
import { rutasCortes } from './modulos/cortes/rutas'
import { rutasCronograma } from './modulos/cronograma/rutas'

export interface OpcionesApp {
  db: BaseDatos
  config: Config
}

export async function construirApp({ db, config }: OpcionesApp): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: config.confiarProxy })
  app.decorate('config', config)
  app.decorate('db', db)
  app.decorateRequest('usuario', undefined)

  registrarErrores(app)
  await app.register(cookie)
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () =>
      new ErrorApi(429, 'demasiados_intentos', 'Demasiados intentos. Espera unos minutos.'),
  })
  app.addHook('onRequest', async (_request, reply) => {
    // Datos personales: ni el navegador ni un proxy los guardan; el resto de cabeceras, en vercel.json.
    reply.header('cache-control', 'no-store').header('x-content-type-options', 'nosniff')
  })
  app.addHook('onRequest', exigirCabeceraCsrf)

  await app.register(
    async (api) => {
      api.get('/salud', async () => ({ ok: true }))
      await api.register(rutasAuth, { prefix: '/auth' })
      await api.register(rutasCatalogos)
      await api.register(rutasCharters, { prefix: '/charters' })
      await api.register(rutasCronograma, { prefix: '/charters' })
      await api.register(rutasCortes, { prefix: '/charters' })
      await api.register(rutasAdmin, { prefix: '/admin' })
    },
    { prefix: '/api' },
  )

  return app
}
