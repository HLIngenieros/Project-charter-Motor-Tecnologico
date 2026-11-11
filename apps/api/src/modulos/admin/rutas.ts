import type { FastifyInstance } from 'fastify'
import { exigirAdmin, exigirSesion } from '../../auth/guardas'
import { guardarReglas, leerParametros } from './parametros'

/** Rutas de `/api/admin`: solo para el perfil Admin. */
export async function rutasAdmin(app: FastifyInstance): Promise<void> {
  const { db } = app
  app.addHook('preHandler', exigirSesion)
  app.addHook('preHandler', exigirAdmin)

  app.get('/parametros', async () => leerParametros(db))
  app.put('/parametros', async (request) => guardarReglas(db, request.usuario!.id, request.body))
}
