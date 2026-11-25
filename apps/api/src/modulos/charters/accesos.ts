import { esCorreoPermitido, type AccesoCharter, type AccesoEntrada } from '@charter/shared'
import { and, asc, eq } from 'drizzle-orm'
import type { BaseDatos } from '../../db/conexion'
import { charterAcceso, usuario, type FilaCharter } from '../../db/esquema'
import { ErrorApi } from '../../errores'

/** Personas con acceso al charter; `nombre` nulo = aún sin cuenta con ese correo. */
export async function listarAccesos(db: BaseDatos, charterId: string): Promise<AccesoCharter[]> {
  return db
    .select({ correo: charterAcceso.correo, rol: charterAcceso.rol, nombre: usuario.nombre })
    .from(charterAcceso)
    .leftJoin(usuario, eq(usuario.correo, charterAcceso.correo))
    .where(eq(charterAcceso.charterId, charterId))
    .orderBy(asc(charterAcceso.creadoEn), asc(charterAcceso.correo))
}

/** Crea el acceso o cambia su rol. Devuelve la lista actualizada. */
export async function compartir(
  db: BaseDatos,
  fila: FilaCharter,
  { correo, rol }: AccesoEntrada,
  dominio: string,
): Promise<AccesoCharter[]> {
  if (!esCorreoPermitido(correo, dominio)) {
    throw new ErrorApi(400, 'datos_invalidos', 'Revisa los datos', {
      correo: `Solo puedes compartir con correos @${dominio}`,
    })
  }
  const [dueno] = await db
    .select({ correo: usuario.correo })
    .from(usuario)
    .where(eq(usuario.id, fila.propietarioId))
    .limit(1)
  if (dueno?.correo === correo) {
    throw new ErrorApi(400, 'datos_invalidos', 'Revisa los datos', {
      correo: 'Ese es el correo del dueño del charter',
    })
  }
  await db
    .insert(charterAcceso)
    .values({ charterId: fila.id, correo, rol })
    .onConflictDoUpdate({
      target: [charterAcceso.charterId, charterAcceso.correo],
      set: { rol, actualizadoEn: new Date().toISOString() },
    })
  return listarAccesos(db, fila.id)
}

export async function quitarAcceso(db: BaseDatos, charterId: string, correo: string) {
  await db
    .delete(charterAcceso)
    .where(
      and(
        eq(charterAcceso.charterId, charterId),
        eq(charterAcceso.correo, correo.trim().toLowerCase()),
      ),
    )
  return listarAccesos(db, charterId)
}
