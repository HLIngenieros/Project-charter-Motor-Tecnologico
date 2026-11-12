import type { FastifyInstance } from 'fastify'
import { exigirAdmin, exigirSesion } from '../../auth/guardas'
import { editarCuenta, listarCuentas, restablecerClave } from './cuentas'
import { guardarReglas, leerParametros } from './parametros'

type ConId = { Params: { id: string } }

/** Rutas de `/api/admin`: solo para el perfil Admin. */
export async function rutasAdmin(app: FastifyInstance): Promise<void> {
  const { db } = app
  app.addHook('preHandler', exigirSesion)
  app.addHook('preHandler', exigirAdmin)

  app.get('/parametros', async () => leerParametros(db))
  app.put('/parametros', async (request) => guardarReglas(db, request.usuario!.id, request.body))

  app.get('/cuentas', async () => listarCuentas(db))
  app.post<ConId>('/cuentas/:id/restablecer-clave', async (request) =>
    restablecerClave(db, request.params.id),
  )
  app.patch<ConId>('/cuentas/:id', async (request) =>
    editarCuenta(db, request.usuario!.id, request.params.id, request.body),
  )
}
