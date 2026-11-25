import type { RolCharter } from '@charter/shared'
import { and, eq } from 'drizzle-orm'
import type { UsuarioSesion } from '../../auth/sesiones'
import type { BaseDatos } from '../../db/conexion'
import { charter, charterAcceso, type FilaCharter } from '../../db/esquema'
import { ErrorApi } from '../../errores'

export type ModoAcceso = 'lectura' | 'escritura' | 'reapertura'

const ESTADOS_CERRADOS = new Set<FilaCharter['estado']>(['cerrado', 'cancelado'])

/** Rol de `usuario` sobre el charter, o nulo si no tiene acceso. Un acceso compartido pesa más que ser Admin. */
export async function rolEn(
  db: BaseDatos,
  fila: FilaCharter,
  usuario: UsuarioSesion,
): Promise<RolCharter | null> {
  if (fila.propietarioId === usuario.id) return 'dueno'
  const [acceso] = await db
    .select({ rol: charterAcceso.rol })
    .from(charterAcceso)
    .where(and(eq(charterAcceso.charterId, fila.id), eq(charterAcceso.correo, usuario.correo)))
    .limit(1)
  if (acceso) return acceso.rol
  return usuario.esAdmin ? 'admin' : null
}

/**
 * Único punto de control de acceso a un charter por id. Toda ruta que reciba un `:id`
 * de charter debe usarlo.
 * - Inexistente o sin acceso: el mismo 404, para no revelar que existe.
 * - `lectura`: el dueño, quien lo tenga compartido o un Admin.
 * - `escritura`: el dueño o un editor, y solo si no está cerrado ni cancelado.
 * - `reapertura`: solo el dueño, en cualquier estado (reabrir, eliminar y compartir).
 */
export async function cargarCharter(
  db: BaseDatos,
  id: string,
  usuario: UsuarioSesion,
  modo: ModoAcceso,
): Promise<FilaCharter> {
  const [fila] = await db.select().from(charter).where(eq(charter.id, id)).limit(1)
  const rol = fila ? await rolEn(db, fila, usuario) : null
  if (!fila || !rol) {
    throw new ErrorApi(404, 'no_encontrado', 'No encontramos ese charter')
  }
  if (modo === 'lectura') return fila

  const puede = rol === 'dueno' || (modo === 'escritura' && rol === 'editor')
  if (!puede) {
    if (rol === 'admin') {
      throw new ErrorApi(
        403,
        'solo_lectura',
        'Como administrador solo puedes consultar este charter.',
      )
    }
    if (rol === 'lector') {
      throw new ErrorApi(403, 'solo_lectura', 'Tienes acceso de solo lectura a este charter.')
    }
    throw new ErrorApi(403, 'solo_dueno', 'Solo el dueño del charter puede hacer esto.')
  }
  if (modo === 'escritura' && ESTADOS_CERRADOS.has(fila.estado)) {
    throw new ErrorApi(409, 'charter_cerrado', 'El charter está cerrado. Reábrelo para editarlo.')
  }
  return fila
}
