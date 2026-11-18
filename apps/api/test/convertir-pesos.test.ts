import { calcularCronograma, construirArbol, type ActividadEntrada } from '@charter/shared'
import { asc, eq } from 'drizzle-orm'
import { v7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import { prepararDb, type BaseDatos } from '../src/db/conexion'
import { convertirPesosRelativos } from '../src/db/convertirPesos'
import { actividad, charter, usuario } from '../src/db/esquema'
import { crearCharterPrueba, crearDbPrueba, nuevaApp, sesionDe } from './ayudas'

const F = { inicio: '2026-01-05', fin: '2026-01-30' }

/** Charter con pesos globales (anteriores a la conversión): grupo A (0,12 / 0,18) y hoja raíz 0,7. */
async function charterViejo(db: BaseDatos) {
  const usuarioId = v7()
  const charterId = v7()
  await db
    .insert(usuario)
    .values({ id: usuarioId, correo: `${usuarioId}@hlingenieros.com`, nombre: 'A', hashClave: 'x' })
  await db
    .insert(charter)
    .values({ id: charterId, propietarioId: usuarioId, nombre: 'Viejo', pesosRelativos: false })
  const ids = { A: v7(), a1: v7(), a2: v7(), b: v7() }
  await db.insert(actividad).values([
    { id: ids.A, charterId, padreId: null, orden: 0, nombre: 'A', peso: 0.5 },
    { id: ids.a1, charterId, padreId: ids.A, orden: 0, nombre: 'a1', peso: 0.12, ...F },
    { id: ids.a2, charterId, padreId: ids.A, orden: 1, nombre: 'a2', peso: 0.18, ...F },
    { id: ids.b, charterId, padreId: null, orden: 1, nombre: 'b', peso: 0.7, ...F },
  ])
  return { charterId, ids }
}

async function leer(db: BaseDatos, charterId: string): Promise<ActividadEntrada[]> {
  const filas = await db
    .select()
    .from(actividad)
    .where(eq(actividad.charterId, charterId))
    .orderBy(asc(actividad.orden))
  return filas.map((f) => ({ ...f, responsables: [] }))
}

const avance = (acts: ActividadEntrada[], pesosGlobales: boolean) => {
  const avances = Object.fromEntries(acts.map((a) => [a.id, { pct: 0.5 }]))
  // Antes de convertir, el motor viejo equivale a darle peso 1 a cada agrupadora.
  const entrada = pesosGlobales
    ? acts.map((a) => (acts.some((h) => h.padreId === a.id) ? { ...a, peso: 1 } : a))
    : acts
  return calcularCronograma(construirArbol(entrada), avances, '2026-01-16').proyecto
}

describe('convertirPesosRelativos', () => {
  it('pasa los pesos globales a relativos y marca el charter', async () => {
    const db = await crearDbPrueba()
    const { charterId, ids } = await charterViejo(db)
    const antes = avance(await leer(db, charterId), true)

    expect(await convertirPesosRelativos(db)).toBe(1)

    const acts = await leer(db, charterId)
    const peso = (id: string) => acts.find((a) => a.id === id)!.peso!
    expect(peso(ids.A)).toBeCloseTo(0.3, 9)
    expect(peso(ids.a1)).toBeCloseTo(0.4, 9)
    expect(peso(ids.a2)).toBeCloseTo(0.6, 9)
    expect(peso(ids.b)).toBeCloseTo(0.7, 9)
    const [c] = await db.select().from(charter).where(eq(charter.id, charterId))
    expect(c!.pesosRelativos).toBe(true)
    expect(c!.cronogramaVersion).toBe(1)

    const despues = avance(acts, false)
    expect(despues.pv).toBeCloseTo(antes.pv, 9)
    expect(despues.ev).toBeCloseTo(antes.ev, 9)
  })

  it('es idempotente: prepararDb otra vez no vuelve a convertir', async () => {
    const db = await crearDbPrueba()
    const { charterId } = await charterViejo(db)
    await convertirPesosRelativos(db)
    const una = await leer(db, charterId)
    await prepararDb(db)
    expect(await convertirPesosRelativos(db)).toBe(0)
    expect(await leer(db, charterId)).toEqual(una)
  })

  it('un charter creado por la API nace con pesos relativos', async () => {
    const { app } = await nuevaApp()
    const yo = await sesionDe(app, 'ana@hlingenieros.com')
    const id = await crearCharterPrueba(app, yo)
    const [c] = await app.db.select().from(charter).where(eq(charter.id, id))
    expect(c!.pesosRelativos).toBe(true)
  })
})
