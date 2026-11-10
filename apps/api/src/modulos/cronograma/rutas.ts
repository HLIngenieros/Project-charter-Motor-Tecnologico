import { cronogramaEntrada } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { exigirSesion } from '../../auth/guardas'
import { cargarCharter } from '../charters/acceso'
import { guardarCronograma, leerCronograma } from './servicio'

interface ConId {
  Params: { id: string }
}

/** Rutas de `/api/charters/:id/cronograma`. */
export async function rutasCronograma(app: FastifyInstance): Promise<void> {
  const { db } = app
  app.addHook('preHandler', exigirSesion)

  app.get<ConId>('/:id/cronograma', async (request) => {
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'lectura')
    return leerCronograma(db, fila)
  })

  app.put<ConId>('/:id/cronograma', async (request) => {
    const entrada = cronogramaEntrada.parse(request.body)
    const fila = await cargarCharter(db, request.params.id, request.usuario!, 'escritura')
    return guardarCronograma(db, fila, entrada)
  })
}
