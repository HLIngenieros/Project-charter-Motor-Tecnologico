import { corteEntrada, fechaISO } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { exigirSesion } from '../../auth/guardas'
import { cargarCharter } from '../charters/acceso'
import { detalleCorte, eliminarCorte, guardarCorte, listarCortes } from './servicio'

interface ConFecha {
  Params: { id: string; fecha: string }
}

/** Rutas de `/api/charters/:id/cortes`. */
export async function rutasCortes(app: FastifyInstance): Promise<void> {
  const { db } = app
  app.addHook('preHandler', exigirSesion)

  app.get<{ Params: { id: string } }>('/:id/cortes', async (request) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'lectura')
    return listarCortes(db, fila)
  })

  app.get<ConFecha>('/:id/cortes/:fecha', async (request) => {
    const fecha = fechaISO.parse(request.params.fecha)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'lectura')
    return detalleCorte(db, fila, fecha)
  })

  app.put<ConFecha>('/:id/cortes/:fecha', async (request, reply) => {
    const fecha = fechaISO.parse(request.params.fecha)
    const entrada = corteEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    const { corte, creado } = await guardarCorte(db, fila, fecha, entrada)
    return reply.status(creado ? 201 : 200).send(corte)
  })

  app.delete<ConFecha>('/:id/cortes/:fecha', async (request, reply) => {
    const fecha = fechaISO.parse(request.params.fecha)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    await eliminarCorte(db, fila, fecha)
    return reply.status(204).send()
  })
}
