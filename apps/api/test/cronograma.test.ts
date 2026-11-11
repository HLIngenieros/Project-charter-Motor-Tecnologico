import type { ActividadEntrada, CronogramaRespuesta } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import type { BaseDatos } from '../src/db/conexion'
import { avance, corte } from '../src/db/esquema'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let db: BaseDatos
let ana: Record<string, string>

beforeEach(async () => {
  ;({ app, db } = await nuevaApp())
  ana = await sesionDe(app, 'ana@hlingenieros.com')
})

const url = (id: string) => `/api/charters/${id}/cronograma`
const leer = (id: string, h = ana) => app.inject({ method: 'GET', url: url(id), headers: h })
const guardar = (id: string, version: number, actividades: unknown[], h = ana) =>
  app.inject({ method: 'PUT', url: url(id), headers: h, payload: { version, actividades } })

/** Grupo → subgrupo → dos hojas, la primera con dos responsables. */
const tresNiveles = (): ActividadEntrada[] => [
  { id: 'g', padreId: null, orden: 0, nombre: 'Grupo', responsables: [] },
  { id: 's', padreId: 'g', orden: 0, nombre: 'Subgrupo', responsables: [] },
  {
    id: 'h1',
    padreId: 's',
    orden: 0,
    nombre: 'Hoja 1',
    entregable: 'Informe',
    peso: 0.6,
    inicio: '2026-01-05',
    fin: '2026-02-10',
    responsables: ['Ana', 'Beto'],
  },
  {
    id: 'h2',
    padreId: 's',
    orden: 1,
    nombre: 'Hoja 2',
    peso: 0.4,
    inicio: '2026-02-11',
    fin: '2026-03-20',
    responsables: [],
  },
]

const quitarVacios = (a: ActividadEntrada) => ({
  id: a.id,
  padreId: a.padreId,
  orden: a.orden,
  nombre: a.nombre,
  entregable: a.entregable ?? null,
  peso: a.peso ?? null,
  inicio: a.inicio ?? null,
  fin: a.fin ?? null,
  responsables: a.responsables ?? [],
})

describe('GET /charters/:id/cronograma', () => {
  it('un charter nuevo empieza vacío en la versión 0', async () => {
    const id = await crearCharterPrueba(app, ana)
    const r = await leer(id)
    expect(r.statusCode).toBe(200)
    expect(r.json()).toEqual({ version: 0, actividades: [], ultimoCorte: null })
  })
})

describe('PUT /charters/:id/cronograma', () => {
  it('guarda un árbol de 3 niveles y lo devuelve igual y en orden', async () => {
    const id = await crearCharterPrueba(app, ana)
    const r = await guardar(id, 0, tresNiveles())
    expect(r.statusCode).toBe(200)
    expect(r.json<CronogramaRespuesta>().version).toBe(1)

    const g = (await leer(id)).json<CronogramaRespuesta>()
    expect(g.version).toBe(1)
    expect(g.actividades).toEqual(tresNiveles().map(quitarVacios))
  })

  it('dos guardados simultáneos con la misma versión: uno 200 y otro 409', async () => {
    const id = await crearCharterPrueba(app, ana)
    const otro: ActividadEntrada[] = [
      { id: 'x', padreId: null, orden: 0, nombre: 'Otra', peso: 1, responsables: [] },
    ]
    const respuestas = await Promise.all([guardar(id, 0, tresNiveles()), guardar(id, 0, otro)])
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([200, 409])
    const rechazo = respuestas.find((r) => r.statusCode === 409)!
    expect(rechazo.json().error.codigo).toBe('cronograma_desactualizado')

    const gano = respuestas[0]!.statusCode === 200 ? tresNiveles() : otro
    const g = (await leer(id)).json<CronogramaRespuesta>()
    expect(g.version).toBe(1)
    expect(g.actividades).toEqual(gano.map(quitarVacios))
  })

  it('reordena con la versión vigente', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 0, tresNiveles())
    const reordenado = tresNiveles().map((a) =>
      a.id === 'h1' ? { ...a, orden: 1 } : a.id === 'h2' ? { ...a, orden: 0 } : a,
    )
    const r = await guardar(id, 1, reordenado)
    expect(r.json<CronogramaRespuesta>().version).toBe(2)
    const hojas = r.json<CronogramaRespuesta>().actividades.filter((a) => a.padreId === 's')
    expect(hojas.map((a) => a.id)).toEqual(['h2', 'h1'])
  })

  it('responde 409 si la versión no es la vigente', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 0, tresNiveles())
    const r = await guardar(id, 0, [])
    expect(r.statusCode).toBe(409)
    expect(r.json().error.codigo).toBe('cronograma_desactualizado')
    expect((await leer(id)).json<CronogramaRespuesta>().actividades).toHaveLength(4)
  })

  it('rechaza árboles inválidos', async () => {
    const id = await crearCharterPrueba(app, ana)
    const dup = [...tresNiveles(), { id: 'h1', padreId: null, orden: 9, nombre: 'Otra' }]
    expect((await guardar(id, 0, dup)).json().error.codigo).toBe('id_duplicado')
    const huerfana = [{ id: 'x', padreId: 'nadie', orden: 0, nombre: 'X' }]
    const r = await guardar(id, 0, huerfana)
    expect(r.statusCode).toBe(400)
    expect(r.json().error.codigo).toBe('padre_inexistente')
  })

  it('rechaza más de 6 niveles', async () => {
    const id = await crearCharterPrueba(app, ana)
    const cadena = Array.from({ length: 7 }, (_, i) => ({
      id: `n${i}`,
      padreId: i === 0 ? null : `n${i - 1}`,
      orden: 0,
      nombre: `Nivel ${i + 1}`,
    }))
    const r = await guardar(id, 0, cadena)
    expect(r.statusCode).toBe(400)
    expect(r.json().error.codigo).toBe('demasiados_niveles')
    expect((await guardar(id, 0, cadena.slice(0, 6))).statusCode).toBe(200)
  })

  it('rechaza ids de actividades de otro charter sin tocarlo', async () => {
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const deBeto = await crearCharterPrueba(app, beto)
    await guardar(deBeto, 0, tresNiveles(), beto)

    const id = await crearCharterPrueba(app, ana)
    const r = await guardar(id, 0, [{ id: 'h1', padreId: null, orden: 0, nombre: 'Robada' }])
    expect(r.statusCode).toBe(400)
    expect(r.json().error.codigo).toBe('id_invalido')
    const deBetoAhora = (await leer(deBeto, beto)).json<CronogramaRespuesta>()
    expect(deBetoAhora.actividades.find((a) => a.id === 'h1')?.nombre).toBe('Hoja 1')
  })

  it('eliminar una hoja con avances conserva sus avances', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 0, tresNiveles())
    await db.insert(corte).values({ id: 'c1', charterId: id, fecha: '2026-01-31' })
    await db
      .insert(avance)
      .values({ corteId: 'c1', actividadId: 'h1', item: '1.1.1', nombre: 'Hoja 1', pctReal: 0.5 })

    const sinH1 = tresNiveles().filter((a) => a.id !== 'h1')
    expect((await guardar(id, 1, sinH1)).statusCode).toBe(200)
    expect(await db.select().from(avance)).toHaveLength(1)
  })

  it('devuelve los avances del último corte con su terminación', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 0, tresNiveles())
    await db.insert(corte).values([
      { id: 'c1', charterId: id, fecha: '2026-01-31' },
      { id: 'c2', charterId: id, fecha: '2026-02-28' },
    ])
    await db.insert(avance).values([
      { corteId: 'c1', actividadId: 'h1', item: '1.1.1', nombre: 'Hoja 1', pctReal: 1 },
      { corteId: 'c2', actividadId: 'h1', item: '1.1.1', nombre: 'Hoja 1', pctReal: 1 },
      { corteId: 'c2', actividadId: 'h2', item: '1.1.2', nombre: 'Hoja 2', pctReal: 0.3 },
    ])
    const r = (await leer(id)).json<CronogramaRespuesta>()
    expect(r.ultimoCorte).toEqual({
      fecha: '2026-02-28',
      avances: {
        h1: { pct: 1, terminadaEn: '2026-01-31' },
        h2: { pct: 0.3, terminadaEn: null },
      },
    })
  })
})

describe('acceso al cronograma', () => {
  it('charter cerrado: lee pero no guarda', async () => {
    const id = await crearCharterPrueba(app, ana)
    await app.inject({
      method: 'PATCH',
      url: `/api/charters/${id}`,
      headers: ana,
      payload: { estado: 'cerrado' },
    })
    expect((await leer(id)).statusCode).toBe(200)
    const r = await guardar(id, 0, tresNiveles())
    expect(r.statusCode).toBe(409)
    expect(r.json().error.codigo).toBe('charter_cerrado')
  })

  it('el Admin lee y no escribe; un ajeno recibe 404', async () => {
    const id = await crearCharterPrueba(app, ana)
    const admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    expect((await leer(id, admin)).statusCode).toBe(200)
    expect((await guardar(id, 0, [], admin)).statusCode).toBe(403)
    expect((await leer(id, beto)).statusCode).toBe(404)
    expect((await guardar(id, 0, [], beto)).statusCode).toBe(404)
  })
})
