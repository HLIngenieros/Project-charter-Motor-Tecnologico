import {
  MAX_NIVELES,
  construirArbol,
  terminacionesPorHoja,
  type ActividadEntrada,
  type AvancesPorHoja,
  type CronogramaEntrada,
  type CronogramaRespuesta,
  type NodoArbol,
} from '@charter/shared'
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm'
import type { BaseDatos } from '../../db/conexion'
import {
  actividad,
  actividadResponsable,
  avance,
  charter,
  corte,
  type FilaCharter,
} from '../../db/esquema'
import { ErrorApi } from '../../errores'

const ERRORES_ARBOL = new Set(['id_duplicado', 'padre_inexistente', 'ciclo'])

/** Recorre el árbol en preorden: el orden en que se lee el cronograma. */
function aplanar(raices: NodoArbol[]): NodoArbol[] {
  const lista: NodoArbol[] = []
  const visitar = (n: NodoArbol) => {
    lista.push(n)
    n.hijos.forEach(visitar)
  }
  raices.forEach(visitar)
  return lista
}

function arbolValido(actividades: ActividadEntrada[]): NodoArbol[] {
  let raices: NodoArbol[]
  try {
    raices = construirArbol(actividades)
  } catch (e) {
    const codigo = e instanceof Error ? e.message : ''
    if (ERRORES_ARBOL.has(codigo)) throw new ErrorApi(400, codigo, 'El cronograma no es válido.')
    throw e
  }
  if (aplanar(raices).some((n) => n.nivel > MAX_NIVELES)) {
    throw new ErrorApi(
      400,
      'demasiados_niveles',
      `El cronograma admite hasta ${MAX_NIVELES} niveles.`,
    )
  }
  return raices
}

/** Avances del último corte, con la fecha en que cada hoja llegó al 100 %. */
function ultimoCorte(db: BaseDatos, charterId: string): CronogramaRespuesta['ultimoCorte'] {
  const cortes = db
    .select({ id: corte.id, fecha: corte.fecha })
    .from(corte)
    .where(eq(corte.charterId, charterId))
    .orderBy(desc(corte.fecha))
    .all()
  if (cortes.length === 0) return null

  const filas = db
    .select({ corteId: avance.corteId, actividadId: avance.actividadId, pct: avance.pctReal })
    .from(avance)
    .where(
      inArray(
        avance.corteId,
        cortes.map((c) => c.id),
      ),
    )
    .all()
  const porCorte = cortes.map((c) => ({
    fecha: c.fecha,
    avances: filas.filter((f) => f.corteId === c.id),
  }))
  const terminadas = terminacionesPorHoja(porCorte)
  const ultimo = porCorte[0]!
  const avances: AvancesPorHoja = Object.fromEntries(
    ultimo.avances.map((a) => [
      a.actividadId,
      { pct: a.pct, terminadaEn: terminadas[a.actividadId] ?? null },
    ]),
  )
  return { fecha: ultimo.fecha, avances }
}

export function leerCronograma(db: BaseDatos, fila: FilaCharter): CronogramaRespuesta {
  const filas = db.select().from(actividad).where(eq(actividad.charterId, fila.id)).all()
  const responsables = db
    .select()
    .from(actividadResponsable)
    .where(
      inArray(
        actividadResponsable.actividadId,
        filas.map((f) => f.id),
      ),
    )
    .orderBy(asc(actividadResponsable.orden))
    .all()

  const entradas: ActividadEntrada[] = filas.map((f) => ({
    id: f.id,
    padreId: f.padreId,
    orden: f.orden,
    nombre: f.nombre,
    entregable: f.entregable,
    peso: f.peso,
    inicio: f.inicio,
    fin: f.fin,
    responsables: responsables.filter((r) => r.actividadId === f.id).map((r) => r.nombre),
  }))
  const porId = new Map(entradas.map((e) => [e.id, e]))

  return {
    version: fila.cronogramaVersion,
    actividades: aplanar(construirArbol(entradas)).map((n) => porId.get(n.id)!),
    ultimoCorte: ultimoCorte(db, fila.id),
  }
}

/** Reemplaza el árbol completo en una transacción. Los avances de los cortes no se tocan. */
export function guardarCronograma(
  db: BaseDatos,
  fila: FilaCharter,
  entrada: CronogramaEntrada,
): CronogramaRespuesta {
  if (entrada.version !== fila.cronogramaVersion) {
    throw new ErrorApi(
      409,
      'cronograma_desactualizado',
      'El cronograma cambió en otra pestaña. Recarga para ver la última versión.',
    )
  }
  // En preorden cada padre se inserta antes que sus hijas (clave foránea de padre_id).
  const enOrden = aplanar(arbolValido(entrada.actividades))

  const ids = entrada.actividades.map((a) => a.id)
  if (ids.length > 0) {
    const ajena = db
      .select({ id: actividad.id })
      .from(actividad)
      .where(and(inArray(actividad.id, ids), ne(actividad.charterId, fila.id)))
      .get()
    if (ajena) throw new ErrorApi(400, 'id_invalido', 'El cronograma no es válido.')
  }

  const actualizada = db.transaction((tx) => {
    tx.delete(actividad).where(eq(actividad.charterId, fila.id)).run()
    if (entrada.actividades.length > 0) {
      tx.insert(actividad)
        .values(
          enOrden.map((a) => ({
            id: a.id,
            charterId: fila.id,
            padreId: a.padreId,
            orden: a.orden,
            nombre: a.nombre,
            entregable: a.entregable ?? null,
            peso: a.peso ?? null,
            inicio: a.inicio ?? null,
            fin: a.fin ?? null,
          })),
        )
        .run()
      const responsables = entrada.actividades.flatMap((a) =>
        (a.responsables ?? []).map((nombre, orden) => ({ actividadId: a.id, nombre, orden })),
      )
      if (responsables.length > 0) tx.insert(actividadResponsable).values(responsables).run()
    }
    return tx
      .update(charter)
      .set({
        cronogramaVersion: fila.cronogramaVersion + 1,
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(charter.id, fila.id))
      .returning()
      .get()!
  })

  return leerCronograma(db, actualizada)
}
