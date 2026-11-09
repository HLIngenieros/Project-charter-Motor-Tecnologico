import type { FastifyInstance } from 'fastify'
import { exigirSesion } from '../../auth/guardas'
import { listarAreas, listarCategorias } from '../charters/servicio'

/** Lectura de catálogos (`/api/categorias`, `/api/areas`). La edición es del Admin (T7.2). */
export async function rutasCatalogos(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', exigirSesion)
  app.get('/categorias', async () => listarCategorias(app.db))
  app.get('/areas', async () => listarAreas(app.db))
}
