import { charterCrear, charterEditar, listaEntrada, tipoLista } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { exigirSesion } from '../../auth/guardas'
import { cargarCharter } from './acceso'
import {
  crearCharter,
  detalleCharter,
  editarCharter,
  eliminarCharter,
  listarMisCharters,
  reemplazarLista,
} from './servicio'

interface ConId {
  Params: { id: string }
}

/** Rutas de `/api/charters`. Todo acceso por id pasa por `cargarCharter`. */
export async function rutasCharters(app: FastifyInstance): Promise<void> {
  const { db } = app
  app.addHook('preHandler', exigirSesion)

  app.get('/', async (request) => listarMisCharters(db, request.usuario!.id))

  app.post('/', async (request, reply) => {
    const id = crearCharter(db, request.usuario!.id, charterCrear.parse(request.body))
    return reply.status(201).send({ id })
  })

  app.get<ConId>('/:id', async (request) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'lectura')
    return detalleCharter(db, fila, request.usuario!)
  })

  app.patch<ConId>('/:id', async (request) => {
    const datos = charterEditar.parse(request.body)
    // Reabrir es el único cambio permitido sobre un charter cerrado o cancelado.
    const soloReabre = Object.keys(datos).length === 1 && datos.estado === 'activo'
    const yo = request.usuario!
    const fila = await cargarCharter(
      db,
      request.params.id,
      yo,
      soloReabre ? 'reapertura' : 'escritura',
    )
    return detalleCharter(db, editarCharter(db, fila, datos), yo)
  })

  app.put<{ Params: { id: string; tipo: string } }>('/:id/listas/:tipo', async (request) => {
    const tipo = tipoLista.parse(request.params.tipo)
    const { items } = listaEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return reemplazarLista(db, fila.id, tipo, items)
  })

  app.delete<ConId>('/:id', async (request, reply) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'reapertura')
    eliminarCharter(db, fila.id)
    return reply.status(204).send()
  })
}
