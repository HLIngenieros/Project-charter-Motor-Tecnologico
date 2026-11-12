import {
  valorRubro,
  type CharterDetalle,
  type Indicador,
  type IndicadoresEntrada,
  type PresupuestoEntrada,
  type Riesgo,
  type RiesgosEntrada,
  type Rubro,
} from '@charter/shared'
import { and, asc, eq, inArray, ne, notInArray, sql, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { BaseDatos } from '../../db/conexion'
import { charter, indicador, riesgo, rubro, rubroDetalle } from '../../db/esquema'
import { ErrorApi } from '../../errores'

type Transaccion = Parameters<Parameters<BaseDatos['transaction']>[0]>[0]

/** Indicadores, riesgos y rubros (con sus líneas) del charter, en su orden. */
export async function leerComplementos(
  db: BaseDatos,
  charterId: string,
): Promise<Pick<CharterDetalle, 'indicadores' | 'riesgos' | 'rubros'>> {
  const [inds, ries, rubs] = await Promise.all([
    db
      .select()
      .from(indicador)
      .where(eq(indicador.charterId, charterId))
      .orderBy(asc(indicador.orden)),
    db.select().from(riesgo).where(eq(riesgo.charterId, charterId)).orderBy(asc(riesgo.orden)),
    db.select().from(rubro).where(eq(rubro.charterId, charterId)).orderBy(asc(rubro.orden)),
  ])
  const lineas =
    rubs.length === 0
      ? []
      : await db
          .select()
          .from(rubroDetalle)
          .where(
            inArray(
              rubroDetalle.rubroId,
              rubs.map((r) => r.id),
            ),
          )
          .orderBy(asc(rubroDetalle.orden))

  return {
    indicadores: inds.map(aIndicador),
    riesgos: ries.map(aRiesgo),
    rubros: rubs.map((r) => ({
      id: r.id,
      descripcion: r.descripcion,
      valor: r.valor,
      lineas: lineas
        .filter((l) => l.rubroId === r.id)
        .map((l) => ({
          id: l.id,
          concepto: l.concepto,
          cantidad: l.cantidad,
          valorUnitario: l.valorUnitario,
        })),
    })),
  }
}

const aIndicador = (f: typeof indicador.$inferSelect): Indicador => ({
  id: f.id,
  nombre: f.nombre,
  formula: f.formula,
  metaOperador: f.metaOperador,
  metaValor: f.metaValor,
  metaUnidad: f.metaUnidad,
  observaciones: f.observaciones,
})

const aRiesgo = (f: typeof riesgo.$inferSelect): Riesgo => ({
  id: f.id,
  riesgo: f.riesgo,
  causa: f.causa,
  mitigacion: f.mitigacion,
  probabilidad: f.probabilidad,
  impacto: f.impacto,
})

// ── Reemplazo de colecciones ────────────────────────────────────────────

function sinRepetidos(ids: string[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new ErrorApi(400, 'id_duplicado', 'Hay identificadores repetidos.')
  }
}

const errorAjeno = () => new ErrorApi(400, 'id_ajeno', 'Un identificador pertenece a otro charter.')

/** `SET col = excluded.col` para el upsert (los nombres vienen del esquema, no del usuario). */
function desdeExcluido(columnas: Record<string, PgColumn>): Record<string, SQL> {
  return Object.fromEntries(
    Object.entries(columnas).map(([k, c]) => [k, sql.raw(`excluded."${c.name}"`)]),
  )
}

/**
 * Reemplaza las filas del charter en una tabla con `charter_id`: rechaza ids de otro charter,
 * borra las que no vienen y hace upsert de las demás (conserva lo que cuelga de ellas).
 */
async function reemplazarFilas<T extends typeof indicador | typeof riesgo | typeof rubro>(
  tx: Transaccion,
  tabla: T,
  charterId: string,
  filas: (T['$inferInsert'] & { id: string })[],
  actualizar: Record<string, PgColumn>,
): Promise<void> {
  const ids = filas.map((f) => f.id)
  if (ids.length > 0) {
    const ajenas = await tx
      .select({ id: tabla.id })
      // El tipo genérico no pasa la comprobación de `from`; cualquier tabla del grupo sirve igual.
      .from(tabla as PgTable)
      .where(and(inArray(tabla.id, ids), ne(tabla.charterId, charterId)))
      .limit(1)
    if (ajenas.length > 0) throw errorAjeno()
  }
  await tx
    .delete(tabla)
    .where(
      ids.length > 0
        ? and(eq(tabla.charterId, charterId), notInArray(tabla.id, ids))
        : eq(tabla.charterId, charterId),
    )
  if (filas.length > 0) {
    await tx
      .insert(tabla)
      .values(filas as never)
      .onConflictDoUpdate({
        target: tabla.id,
        set: { ...desdeExcluido(actualizar), actualizadoEn: sql`excluded.actualizado_en` },
      })
  }
}

/** Cambiar un complemento también cuenta como editar el charter (orden del portafolio). */
async function tocarCharter(tx: Transaccion, charterId: string): Promise<void> {
  await tx
    .update(charter)
    .set({ actualizadoEn: new Date().toISOString() })
    .where(eq(charter.id, charterId))
}

export async function reemplazarIndicadores(
  db: BaseDatos,
  charterId: string,
  items: IndicadoresEntrada['items'],
): Promise<Indicador[]> {
  sinRepetidos(items.map((i) => i.id))
  await db.transaction(async (tx) => {
    await reemplazarFilas(
      tx,
      indicador,
      charterId,
      items.map((i, orden) => ({ ...i, charterId, orden })),
      {
        nombre: indicador.nombre,
        formula: indicador.formula,
        metaOperador: indicador.metaOperador,
        metaValor: indicador.metaValor,
        metaUnidad: indicador.metaUnidad,
        observaciones: indicador.observaciones,
        orden: indicador.orden,
      },
    )
    await tocarCharter(tx, charterId)
  })
  return items
}

export async function reemplazarRiesgos(
  db: BaseDatos,
  charterId: string,
  items: RiesgosEntrada['items'],
): Promise<Riesgo[]> {
  sinRepetidos(items.map((i) => i.id))
  await db.transaction(async (tx) => {
    await reemplazarFilas(
      tx,
      riesgo,
      charterId,
      items.map((i, orden) => ({ ...i, charterId, orden })),
      {
        riesgo: riesgo.riesgo,
        causa: riesgo.causa,
        mitigacion: riesgo.mitigacion,
        probabilidad: riesgo.probabilidad,
        impacto: riesgo.impacto,
        orden: riesgo.orden,
      },
    )
    await tocarCharter(tx, charterId)
  })
  return items
}

/** Guarda los rubros con su desglose; el valor de un rubro con líneas es el calculado. */
export async function reemplazarPresupuesto(
  db: BaseDatos,
  charterId: string,
  rubros: PresupuestoEntrada['rubros'],
): Promise<Rubro[]> {
  sinRepetidos(rubros.map((r) => r.id))
  const lineas = rubros.flatMap((r) => r.lineas.map((l, orden) => ({ ...l, rubroId: r.id, orden })))
  sinRepetidos(lineas.map((l) => l.id))
  const guardados = rubros.map((r) => ({ ...r, valor: valorRubro(r) }))

  await db.transaction(async (tx) => {
    // Una línea que ya existe debe ser de un rubro de este charter.
    if (lineas.length > 0) {
      const ajenas = await tx
        .select({ id: rubroDetalle.id })
        .from(rubroDetalle)
        .innerJoin(rubro, eq(rubro.id, rubroDetalle.rubroId))
        .where(
          and(
            inArray(
              rubroDetalle.id,
              lineas.map((l) => l.id),
            ),
            ne(rubro.charterId, charterId),
          ),
        )
        .limit(1)
      if (ajenas.length > 0) throw errorAjeno()
    }

    await reemplazarFilas(
      tx,
      rubro,
      charterId,
      guardados.map(({ id, descripcion, valor }, orden) => ({
        id,
        charterId,
        descripcion,
        valor,
        orden,
      })),
      { descripcion: rubro.descripcion, valor: rubro.valor, orden: rubro.orden },
    )

    // Los rubros borrados se llevan sus líneas (cascade); de los que quedan, sobran las que no vienen.
    const ids = guardados.map((r) => r.id)
    if (ids.length > 0) {
      await tx.delete(rubroDetalle).where(
        lineas.length > 0
          ? and(
              inArray(rubroDetalle.rubroId, ids),
              notInArray(
                rubroDetalle.id,
                lineas.map((l) => l.id),
              ),
            )
          : inArray(rubroDetalle.rubroId, ids),
      )
    }
    if (lineas.length > 0) {
      await tx
        .insert(rubroDetalle)
        .values(lineas)
        .onConflictDoUpdate({
          target: rubroDetalle.id,
          set: {
            ...desdeExcluido({
              rubroId: rubroDetalle.rubroId,
              concepto: rubroDetalle.concepto,
              cantidad: rubroDetalle.cantidad,
              valorUnitario: rubroDetalle.valorUnitario,
              orden: rubroDetalle.orden,
            }),
            actualizadoEn: sql`excluded.actualizado_en`,
          },
        })
    }
    await tocarCharter(tx, charterId)
  })
  return guardados
}
