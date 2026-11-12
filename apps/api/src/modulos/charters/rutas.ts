import {
  charterCrear,
  charterEditar,
  indicadoresEntrada,
  listaEntrada,
  presupuestoEntrada,
  riesgosEntrada,
  tipoLista,
} from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { exigirSesion } from '../../auth/guardas'
import { cargarCharter } from './acceso'
import { reemplazarIndicadores, reemplazarPresupuesto, reemplazarRiesgos } from './complementos'
import { exportarCharter } from './exportar'
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
    const id = await crearCharter(db, request.usuario!.id, charterCrear.parse(request.body))
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
    return detalleCharter(db, await editarCharter(db, fila, datos), yo)
  })

  app.put<{ Params: { id: string; tipo: string } }>('/:id/listas/:tipo', async (request) => {
    const tipo = tipoLista.parse(request.params.tipo)
    const { items } = listaEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return reemplazarLista(db, fila.id, tipo, items)
  })

  app.put<ConId>('/:id/indicadores', async (request) => {
    const { items } = indicadoresEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return reemplazarIndicadores(db, fila.id, items)
  })

  app.put<ConId>('/:id/riesgos', async (request) => {
    const { items } = riesgosEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return reemplazarRiesgos(db, fila.id, items)
  })

  app.put<ConId>('/:id/presupuesto', async (request) => {
    const { rubros } = presupuestoEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return reemplazarPresupuesto(db, fila.id, rubros)
  })

  app.get<ConId & { Querystring: { corte?: string } }>('/:id/exportar', async (request) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'lectura')
    return exportarCharter(db, fila, request.usuario!, request.query.corte || undefined)
  })

  app.delete<ConId>('/:id', async (request, reply) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'reapertura')
    await eliminarCharter(db, fila.id)
    return reply.status(204).send()
  })
}
