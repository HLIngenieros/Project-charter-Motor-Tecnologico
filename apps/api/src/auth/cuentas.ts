import { normalizarCorreo } from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { BaseDatos } from '../db/conexion'
import { usuario } from '../db/esquema'

/** Da o quita el perfil Admin. Lanza 'usuario_inexistente' si el correo no está registrado. */
export async function promoverAdmin(db: BaseDatos, correo: string, valor: boolean): Promise<void> {
  const r = db
    .update(usuario)
    .set({ esAdmin: valor })
    .where(eq(usuario.correo, normalizarCorreo(correo)))
    .run()
  if (r.changes === 0) throw new Error('usuario_inexistente')
}
