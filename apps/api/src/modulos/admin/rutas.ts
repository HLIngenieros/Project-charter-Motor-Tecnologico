import type { FastifyInstance } from 'fastify'
import { exigirAdmin, exigirSesion } from '../../auth/guardas'
import {
  crearArea,
  crearCategoria,
  editarArea,
  editarCategoria,
  eliminarArea,
  eliminarCategoria,
  listarAreasAdmin,
  listarCategoriasAdmin,
} from './catalogos'
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

  app.get('/catalogos/categorias', async () => listarCategoriasAdmin(db))
  app.post('/catalogos/categorias', async (request, reply) =>
    reply.status(201).send(await crearCategoria(db, request.body)),
  )
  app.patch<ConId>('/catalogos/categorias/:id', async (request) =>
    editarCategoria(db, request.params.id, request.body),
  )
  app.delete<ConId>('/catalogos/categorias/:id', async (request, reply) => {
    await eliminarCategoria(db, request.params.id)
    return reply.status(204).send()
  })

  app.get('/catalogos/areas', async () => listarAreasAdmin(db))
  app.post('/catalogos/areas', async (request, reply) =>
    reply.status(201).send(await crearArea(db, request.body)),
  )
  app.patch<ConId>('/catalogos/areas/:id', async (request) =>
    editarArea(db, request.params.id, request.body),
  )
  app.delete<ConId>('/catalogos/areas/:id', async (request, reply) => {
    await eliminarArea(db, request.params.id)
    return reply.status(204).send()
  })
}
