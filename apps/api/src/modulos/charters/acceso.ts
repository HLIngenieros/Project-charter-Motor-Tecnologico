import { eq } from 'drizzle-orm'
import type { UsuarioSesion } from '../../auth/sesiones'
import type { BaseDatos } from '../../db/conexion'
import { charter, type FilaCharter } from '../../db/esquema'
import { ErrorApi } from '../../errores'

export type ModoAcceso = 'lectura' | 'escritura' | 'reapertura'

const ESTADOS_CERRADOS = new Set<FilaCharter['estado']>(['cerrado', 'cancelado'])

/**
 * Único punto de control de acceso a un charter por id. Toda ruta que reciba un `:id`
 * de charter debe usarlo.
 * - Inexistente o ajeno (sin ser Admin): el mismo 404, para no revelar que existe.
 * - `lectura`: el dueño o un Admin.
 * - `escritura`: solo el dueño, y solo si no está cerrado ni cancelado.
 * - `reapertura`: solo el dueño, en cualquier estado.
 */
export async function cargarCharter(
  db: BaseDatos,
  id: string,
  usuario: UsuarioSesion,
  modo: ModoAcceso,
): Promise<FilaCharter> {
  const [fila] = await db.select().from(charter).where(eq(charter.id, id)).limit(1)
  const esDueno = fila?.propietarioId === usuario.id
  if (!fila || (!esDueno && !usuario.esAdmin)) {
    throw new ErrorApi(404, 'no_encontrado', 'No encontramos ese charter')
  }
  if (modo === 'lectura') return fila

  if (!esDueno) {
    throw new ErrorApi(
      403,
      'solo_lectura',
      'Como administrador solo puedes consultar este charter.',
    )
  }
  if (modo === 'escritura' && ESTADOS_CERRADOS.has(fila.estado)) {
    throw new ErrorApi(409, 'charter_cerrado', 'El charter está cerrado. Reábrelo para editarlo.')
  }
  return fila
}
