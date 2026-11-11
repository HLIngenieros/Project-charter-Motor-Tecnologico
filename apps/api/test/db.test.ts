import { eq, sql } from 'drizzle-orm'
import { v7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import { crearDb } from '../src/db/conexion'
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

function conCharter() {
  const db = crearDb(':memory:')
  const usuarioId = v7()
  const charterId = v7()
  db.insert(usuario)
    .values({ id: usuarioId, correo: 'a@hlingenieros.com', nombre: 'A', hashClave: 'x' })
    .run()
  db.insert(charter).values({ id: charterId, propietarioId: usuarioId, nombre: 'Charter A' }).run()
  return { db, usuarioId, charterId }
}

describe('crearDb', () => {
  it('crea las 16 tablas y las 3 categorías del Comité', () => {
    const db = crearDb(':memory:')
    const tablas = db
      .all<{
        name: string
      }>(
        sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '__drizzle%'`,
      )
      .map((t) => t.name)
    expect(tablas.sort()).toEqual([...TABLAS].sort())
    const cats = db.select().from(categoria).all()
    expect(cats.map((c) => c.nombre)).toEqual([
      'Automatización',
      'Análisis de Data',
      'Gestión del Conocimiento',
    ])
    expect(cats[0]).toMatchObject({ color: '#D98A00', colorFondo: '#FBF1DF', activa: true })
  })

  it('sembrar es idempotente', () => {
    const db = crearDb(':memory:')
    sembrar(db)
    sembrar(db)
    expect(db.select().from(categoria).all()).toHaveLength(3)
  })

  it('activa las claves foráneas', () => {
    const db = crearDb(':memory:')
    expect(db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`)).toEqual({ foreign_keys: 1 })
  })
})

describe('restricciones', () => {
  it('no permite dos cortes con la misma fecha en un charter', () => {
    const { db, charterId } = conCharter()
    const nuevo = () => db.insert(corte).values({ id: v7(), charterId, fecha: '2025-03-13' }).run()
    nuevo()
    expect(nuevo).toThrow(/UNIQUE/)
  })

  it('no permite dos usuarios con el mismo correo', () => {
    const { db } = conCharter()
    expect(() =>
      db
        .insert(usuario)
        .values({ id: v7(), correo: 'a@hlingenieros.com', nombre: 'B', hashClave: 'y' })
        .run(),
    ).toThrow(/UNIQUE/)
  })

  it('borrar una actividad con avances conserva el avance', () => {
    const { db, charterId } = conCharter()
    const actividadId = v7()
    const corteId = v7()
    db.insert(actividad).values({ id: actividadId, charterId, orden: 1, nombre: 'Hoja' }).run()
    db.insert(corte).values({ id: corteId, charterId, fecha: '2025-03-13' }).run()
    db.insert(avance)
      .values({ corteId, actividadId, item: '1', nombre: 'Hoja', pctReal: 0.5 })
      .run()

    db.delete(actividad).where(eq(actividad.id, actividadId)).run()

    expect(db.select().from(avance).all()).toEqual([
      expect.objectContaining({ actividadId, item: '1', nombre: 'Hoja', pctReal: 0.5 }),
    ])
  })

  it('borrar una agrupadora borra sus hijas', () => {
    const { db, charterId } = conCharter()
    const padre = v7()
    db.insert(actividad).values({ id: padre, charterId, orden: 1, nombre: 'G' }).run()
    db.insert(actividad)
      .values({ id: v7(), charterId, padreId: padre, orden: 1, nombre: 'H' })
      .run()
    db.delete(actividad).where(eq(actividad.id, padre)).run()
    expect(db.select().from(actividad).all()).toHaveLength(0)
  })

  it('borrar un charter borra sus actividades y cortes', () => {
    const { db, charterId } = conCharter()
    db.insert(actividad).values({ id: v7(), charterId, orden: 1, nombre: 'Hoja' }).run()
    db.insert(corte).values({ id: v7(), charterId, fecha: '2025-03-13' }).run()
    db.delete(charter).where(eq(charter.id, charterId)).run()
    expect(db.select().from(actividad).all()).toHaveLength(0)
    expect(db.select().from(corte).all()).toHaveLength(0)
  })

  it('no permite borrar una categoría en uso', () => {
    const { db, charterId } = conCharter()
    const cat = db.select().from(categoria).all()[0]!
    db.update(charter).set({ categoriaId: cat.id }).where(eq(charter.id, charterId)).run()
    expect(() => db.delete(categoria).where(eq(categoria.id, cat.id)).run()).toThrow(/FOREIGN KEY/)
  })
})
