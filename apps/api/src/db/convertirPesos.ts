import { aPesosRelativos } from '@charter/shared'
import { eq, sql } from 'drizzle-orm'
import type { BaseDatos } from './conexion'
import { actividad, charter } from './esquema'

/**
 * Pasa a pesos relativos los cronogramas de los charters anteriores a ese cambio
 * (`pesos_relativos = false`). El global de cada hoja se conserva, así que el avance no cambia;
 * las fotos de los cortes no se tocan. Idempotente: devuelve cuántos charters convirtió.
 */
export async function convertirPesosRelativos(db: BaseDatos): Promise<number> {
  const pendientes = await db
    .select({ id: charter.id })
    .from(charter)
    .where(eq(charter.pesosRelativos, false))

  for (const { id } of pendientes) {
    await db.transaction(async (tx) => {
      const filas = await tx.select().from(actividad).where(eq(actividad.charterId, id))
      const convertidas = aPesosRelativos(filas.map((f) => ({ ...f, responsables: [] })))
      for (const c of convertidas) {
        const antes = filas.find((f) => f.id === c.id)!
        if ((c.peso ?? null) !== antes.peso) {
          await tx
            .update(actividad)
            .set({ peso: c.peso ?? null })
            .where(eq(actividad.id, c.id))
        }
      }
      await tx
        .update(charter)
        .set({ pesosRelativos: true, cronogramaVersion: sql`${charter.cronogramaVersion} + 1` })
        .where(eq(charter.id, id))
    })
  }
  return pendientes.length
}
