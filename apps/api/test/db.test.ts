import { eq, sql } from 'drizzle-orm'
import { v7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import { crearDb } from '../src/db/conexion'
import { esViolacionUnica } from '../src/db/errores'
import { actividad, avance, categoria, charter, corte, usuario } from '../src/db/esquema'
import { sembrar } from '../src/db/semilla'

const TABLAS = [
  'usuario',
  'sesion',
  'categoria',
  'area',
  'charter',
  'item_lista',
  'riesgo',
  'indicador',
  'medicion',
  'rubro',
  'rubro_detalle',
  'actividad',
  'actividad_responsable',
  'corte',
  'avance',
  'parametros',
]

async function conCharter() {
  const db = await crearDb(':memory:')
  const usuarioId = v7()
  const charterId = v7()
  await db
    .insert(usuario)
    .values({ id: usuarioId, correo: 'a@hlingenieros.com', nombre: 'A', hashClave: 'x' })
  await db.insert(charter).values({ id: charterId, propietarioId: usuarioId, nombre: 'Charter A' })
  return { db, usuarioId, charterId }
}

/** Devuelve el error con que se rechaza la promesa (falla si no se rechaza). */
async function errorDe(promesa: PromiseLike<unknown>): Promise<unknown> {
  try {
    await promesa
  } catch (error) {
    return error
  }
  throw new Error('Se esperaba un error')
}

describe('crearDb', () => {
  it('crea las 16 tablas y las 3 categorías del Comité', async () => {
    const db = await crearDb(':memory:')
    // Con el tipo genérico de la base, `execute` no sabe la forma del resultado.
    const filas = (await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' and table_name not like '__drizzle%'`,
    )) as unknown as { rows: { table_name: string }[] }
    const tablas = filas.rows.map((t) => t.table_name)
    expect(tablas.sort()).toEqual([...TABLAS].sort())
    const cats = await db.select().from(categoria).orderBy(categoria.orden)
    expect(cats.map((c) => c.nombre)).toEqual([
      'Automatización',
      'Análisis de Data',
      'Gestión del Conocimiento',
    ])
    expect(cats[0]).toMatchObject({ color: '#D98A00', colorFondo: '#FBF1DF', activa: true })
  })

  it('sembrar es idempotente', async () => {
    const db = await crearDb(':memory:')
    await sembrar(db)
    await sembrar(db)
    expect(await db.select().from(categoria)).toHaveLength(3)
  })

  it('cumple las claves foráneas', async () => {
    const db = await crearDb(':memory:')
    const error = await errorDe(
      db.insert(charter).values({ id: v7(), propietarioId: v7(), nombre: 'Huérfano' }),
    )
    expect(error).toBeTruthy()
  })
})

describe('esViolacionUnica', () => {
  it('reconoce el error real de un correo repetido y no otros', async () => {
    const { db } = await conCharter()
    const error = await errorDe(
      db
        .insert(usuario)
        .values({ id: v7(), correo: 'a@hlingenieros.com', nombre: 'B', hashClave: 'y' }),
    )
    expect(esViolacionUnica(error)).toBe(true)
    expect(esViolacionUnica(new Error('x'))).toBe(false)
  })
})

describe('restricciones', () => {
  it('no permite dos cortes con la misma fecha en un charter', async () => {
    const { db, charterId } = await conCharter()
    const nuevo = () => db.insert(corte).values({ id: v7(), charterId, fecha: '2025-03-13' })
    await nuevo()
    expect(esViolacionUnica(await errorDe(nuevo()))).toBe(true)
  })

  it('borrar una actividad con avances conserva el avance', async () => {
    const { db, charterId } = await conCharter()
    const actividadId = v7()
    const corteId = v7()
    await db.insert(actividad).values({ id: actividadId, charterId, orden: 1, nombre: 'Hoja' })
    await db.insert(corte).values({ id: corteId, charterId, fecha: '2025-03-13' })
    await db
      .insert(avance)
      .values({ corteId, actividadId, item: '1', nombre: 'Hoja', pctReal: 0.5 })

    await db.delete(actividad).where(eq(actividad.id, actividadId))

    expect(await db.select().from(avance)).toEqual([
      expect.objectContaining({ actividadId, item: '1', nombre: 'Hoja', pctReal: 0.5 }),
    ])
  })

  it('borrar una agrupadora borra sus hijas', async () => {
    const { db, charterId } = await conCharter()
    const padre = v7()
    await db.insert(actividad).values({ id: padre, charterId, orden: 1, nombre: 'G' })
    await db
      .insert(actividad)
      .values({ id: v7(), charterId, padreId: padre, orden: 1, nombre: 'H' })
    await db.delete(actividad).where(eq(actividad.id, padre))
    expect(await db.select().from(actividad)).toHaveLength(0)
  })

  it('borrar un charter borra sus actividades y cortes', async () => {
    const { db, charterId } = await conCharter()
    await db.insert(actividad).values({ id: v7(), charterId, orden: 1, nombre: 'Hoja' })
    await db.insert(corte).values({ id: v7(), charterId, fecha: '2025-03-13' })
    await db.delete(charter).where(eq(charter.id, charterId))
    expect(await db.select().from(actividad)).toHaveLength(0)
    expect(await db.select().from(corte)).toHaveLength(0)
  })

  it('no permite borrar una categoría en uso', async () => {
    const { db, charterId } = await conCharter()
    const [cat] = await db.select().from(categoria).limit(1)
    await db.update(charter).set({ categoriaId: cat!.id }).where(eq(charter.id, charterId))
    expect(await errorDe(db.delete(categoria).where(eq(categoria.id, cat!.id)))).toBeTruthy()
    expect(await db.select().from(categoria)).toHaveLength(3)
  })
})
