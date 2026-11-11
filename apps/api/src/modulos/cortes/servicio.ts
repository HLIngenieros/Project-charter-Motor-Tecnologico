import { reglasDeCharter } from '../admin/parametros'
import {
  construirArbol,
  hojasProgramadas,
  pesosCompletos,
  terminacionesPorHoja,
  totalesDeFoto,
  type CorteDetalle,
  type CorteEntrada,
  type CorteResumen,
  type FechaISO,
  type FilaFoto,
  type Reglas,
} from '@charter/shared'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { v7 } from 'uuid'
import type { BaseDatos } from '../../db/conexion'
import { actividad, avance, charter, corte, type FilaCharter } from '../../db/esquema'
import { ErrorApi } from '../../errores'
import { hoyISO } from '../../util/hoy'
import { leerCronograma } from '../cronograma/servicio'

interface CorteConFoto {
  id: string
  fecha: FechaISO
  nota: string
  foto: FilaFoto[]
}

/** Todos los cortes del charter con su foto, por fecha ascendente. */
async function cortesConFoto(db: BaseDatos, charterId: string): Promise<CorteConFoto[]> {
  const cortes = await db
    .select()
    .from(corte)
    .where(eq(corte.charterId, charterId))
    .orderBy(asc(corte.fecha))
  if (cortes.length === 0) return []
  const filas = await db
    .select()
    .from(avance)
    .where(
      inArray(
        avance.corteId,
        cortes.map((c) => c.id),
      ),
    )
  return cortes.map((c) => ({
    id: c.id,
    fecha: c.fecha,
    nota: c.nota,
    foto: filas
      .filter((f) => f.corteId === c.id)
      .map((f) => ({
        actividadId: f.actividadId,
        item: f.item,
        nombre: f.nombre,
        pct: f.pctReal,
        peso: f.peso,
        inicio: f.inicio,
        fin: f.fin,
      }))
      .sort((a, b) => a.item.localeCompare(b.item, 'es', { numeric: true })),
  }))
}

/** Totales y estado de un corte con su foto y las terminaciones hasta su fecha. */
function resumir(c: CorteConFoto, todos: CorteConFoto[], reglas: Reglas): CorteResumen {
  const hastaAqui = todos
    .filter((o) => o.fecha <= c.fecha)
    .map((o) => ({ fecha: o.fecha, avances: o.id === c.id ? c.foto : o.foto }))
  const r = totalesDeFoto(c.foto, c.fecha, terminacionesPorHoja(hastaAqui), reglas)
  return {
    fecha: c.fecha,
    nota: c.nota,
    pv: r.pv,
    ev: r.ev,
    desv: r.desv,
    estado: r.estado,
    vencidas: r.vencidas,
  }
}

const pesosIncompletos = () =>
  new ErrorApi(
    409,
    'pesos_incompletos',
    'Los pesos de las actividades deben sumar 100 % para registrar un corte.',
  )

export async function listarCortes(db: BaseDatos, fila: FilaCharter): Promise<CorteResumen[]> {
  const todos = await cortesConFoto(db, fila.id)
  return todos.map((c) => resumir(c, todos, reglasDeCharter(fila)))
}

export async function detalleCorte(
  db: BaseDatos,
  fila: FilaCharter,
  fecha: FechaISO,
): Promise<CorteDetalle> {
  const todos = await cortesConFoto(db, fila.id)
  const c = todos.find((o) => o.fecha === fecha)
  if (!c) throw new ErrorApi(404, 'no_encontrado', 'No hay un corte en esa fecha.')
  const actuales = await db
    .select({ id: actividad.id })
    .from(actividad)
    .where(eq(actividad.charterId, fila.id))
  const vigentes = new Set(actuales.map((a) => a.id))
  return {
    ...resumir(c, todos, reglasDeCharter(fila)),
    avances: c.foto.map((f) => ({ ...f, eliminada: !vigentes.has(f.actividadId) })),
  }
}

const actividadInvalida = () =>
  new ErrorApi(400, 'actividad_invalida', 'El corte incluye una actividad que no se puede medir.')

/**
 * Crea el corte (foto de la línea base vigente) o, si ya hay uno en esa fecha, cambia sus
 * % y su nota sin tocar la foto. En ambos casos recalcula los totales guardados.
 */
export async function guardarCorte(
  db: BaseDatos,
  fila: FilaCharter,
  fecha: FechaISO,
  entrada: CorteEntrada,
): Promise<{ corte: CorteDetalle; creado: boolean }> {
  const todos = await cortesConFoto(db, fila.id)
  const existente = todos.find((c) => c.fecha === fecha)
  const pcts = new Map(entrada.avances.map((a) => [a.actividadId, a.pct]))
  const reglas = reglasDeCharter(fila)

  let nuevo: CorteConFoto
  if (existente) {
    const enFoto = new Set(existente.foto.map((f) => f.actividadId))
    if ([...pcts.keys()].some((id) => !enFoto.has(id))) throw actividadInvalida()
    // Al editar manda la foto: el cronograma pudo cambiar después del corte.
    const sumaFoto = existente.foto.reduce((s, f) => s + (f.peso ?? 0), 0)
    if (reglas.sumaPesos === 'obligatoria' && Math.abs(sumaFoto - 1) > 1e-4)
      throw pesosIncompletos()
    nuevo = {
      ...existente,
      nota: entrada.nota,
      foto: existente.foto.map((f) => ({ ...f, pct: pcts.get(f.actividadId) ?? f.pct })),
    }
  } else {
    if (fecha > hoyISO()) {
      throw new ErrorApi(400, 'fecha_futura', 'La fecha de corte no puede ser posterior a hoy.')
    }
    const anterior = todos.at(-1)
    if (anterior && fecha < anterior.fecha) {
      throw new ErrorApi(
        400,
        'corte_anterior',
        'Ya hay un corte más reciente. Edítalo o usa una fecha posterior.',
      )
    }
    const raices = construirArbol((await leerCronograma(db, fila)).actividades)
    const hojas = hojasProgramadas(raices, reglas)
    if (hojas.length === 0) {
      throw new ErrorApi(
        400,
        'sin_hojas_programadas',
        'Programa al menos una actividad con peso y fechas antes de registrar un corte.',
      )
    }
    if (reglas.sumaPesos === 'obligatoria' && !pesosCompletos(raices, reglas)) {
      throw pesosIncompletos()
    }
    const programadas = new Set(hojas.map((h) => h.id))
    if ([...pcts.keys()].some((id) => !programadas.has(id))) throw actividadInvalida()
    const previos = new Map(anterior?.foto.map((f) => [f.actividadId, f.pct]))
    nuevo = {
      id: v7(),
      fecha,
      nota: entrada.nota,
      foto: hojas.map((h) => ({
        actividadId: h.id,
        item: h.item,
        nombre: h.nombre,
        pct: pcts.get(h.id) ?? previos.get(h.id) ?? 0,
        peso: h.peso ?? null,
        inicio: h.inicio ?? null,
        fin: h.fin ?? null,
      })),
    }
  }

  const otros = todos.filter((c) => c.id !== nuevo.id)
  const totales = resumir(nuevo, [...otros, nuevo], reglas)
  await db.transaction(async (tx) => {
    const valores = {
      nota: nuevo.nota,
      pvProyecto: totales.pv,
      evProyecto: totales.ev,
      desvProyecto: totales.desv,
    }
    if (existente) {
      await tx.update(corte).set(valores).where(eq(corte.id, nuevo.id))
      await tx.delete(avance).where(eq(avance.corteId, nuevo.id))
    } else {
      await tx.insert(corte).values({ id: nuevo.id, charterId: fila.id, fecha, ...valores })
    }
    await tx.insert(avance).values(
      nuevo.foto.map((f) => ({
        corteId: nuevo.id,
        actividadId: f.actividadId,
        item: f.item,
        nombre: f.nombre,
        pctReal: f.pct,
        peso: f.peso,
        inicio: f.inicio,
        fin: f.fin,
      })),
    )
    await tx
      .update(charter)
      .set({ actualizadoEn: new Date().toISOString() })
      .where(eq(charter.id, fila.id))
  })

  return { corte: await detalleCorte(db, fila, fecha), creado: !existente }
}

export async function eliminarCorte(
  db: BaseDatos,
  fila: FilaCharter,
  fecha: FechaISO,
): Promise<void> {
  const borrados = await db
    .delete(corte)
    .where(and(eq(corte.charterId, fila.id), eq(corte.fecha, fecha)))
    .returning({ id: corte.id })
  if (borrados.length === 0)
    throw new ErrorApi(404, 'no_encontrado', 'No hay un corte en esa fecha.')
}
