import {
  calcularCronograma,
  construirArbol,
  type ActividadEntrada,
  type CharterResumen,
  type CorteDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
} from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
})

/** A 50 % ene–feb, B 30 % feb–mar, C 20 % sin fechas (sin programar). */
const base = (): ActividadEntrada[] => [
  {
    id: 'A',
    padreId: null,
    orden: 0,
    nombre: 'A',
    peso: 0.5,
    inicio: '2026-01-01',
    fin: '2026-02-28',
  },
  {
    id: 'B',
    padreId: null,
    orden: 1,
    nombre: 'B',
    peso: 0.3,
    inicio: '2026-02-01',
    fin: '2026-03-31',
  },
  { id: 'C', padreId: null, orden: 2, nombre: 'C', peso: 0.2 },
]

const cronograma = async (id: string) =>
  (
    await app.inject({ method: 'GET', url: `/api/charters/${id}/cronograma`, headers: ana })
  ).json<CronogramaRespuesta>()

const guardarCronograma = async (id: string, actividades: ActividadEntrada[]) => {
  const { version } = await cronograma(id)
  const r = await app.inject({
    method: 'PUT',
    url: `/api/charters/${id}/cronograma`,
    headers: ana,
    payload: { version, actividades },
  })
  expect(r.statusCode).toBe(200)
}

const conCronograma = async (actividades = base()) => {
  const id = await crearCharterPrueba(app, ana)
  await guardarCronograma(id, actividades)
  return id
}

const url = (id: string, fecha?: string) => `/api/charters/${id}/cortes${fecha ? `/${fecha}` : ''}`
const guardarCorte = (id: string, fecha: string, cuerpo: object, h = ana) =>
  app.inject({ method: 'PUT', url: url(id, fecha), headers: h, payload: cuerpo })
const detalle = async (id: string, fecha: string) =>
  (await app.inject({ method: 'GET', url: url(id, fecha), headers: ana })).json<CorteDetalle>()
const lista = async (id: string) =>
  (await app.inject({ method: 'GET', url: url(id), headers: ana })).json<CorteResumen[]>()

const pcts = (A: number, B: number) => [
  { actividadId: 'A', pct: A },
  { actividadId: 'B', pct: B },
]

describe('PUT /charters/:id/cortes/:fecha', () => {
  it('crea un corte completo con la foto de las hojas programadas', async () => {
    const id = await conCronograma()
    const r = await guardarCorte(id, '2026-02-15', { nota: 'Primero', avances: pcts(1, 0.2) })
    expect(r.statusCode).toBe(201)
    const c = r.json<CorteDetalle>()
    expect(c.avances.map((a) => a.actividadId)).toEqual(['A', 'B'])
    expect(c.avances[0]).toMatchObject({ item: '1', peso: 0.5, pct: 1, eliminada: false })

    const esperado = calcularCronograma(
      construirArbol(base()),
      { A: { pct: 1 }, B: { pct: 0.2 } },
      '2026-02-15',
    ).proyecto
    expect(c.pv).toBeCloseTo(esperado.pv, 10)
    expect(c.ev).toBeCloseTo(esperado.ev, 10)
    expect(c.desv).toBeCloseTo(esperado.desv, 10)
  })

  it('sobre una fecha con corte lo edita y recalcula', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const antes = await detalle(id, '2026-02-15')
    const r = await guardarCorte(id, '2026-02-15', { nota: 'Corregido', avances: pcts(1, 0.4) })
    expect(r.statusCode).toBe(200)
    const lst = await lista(id)
    expect(lst).toHaveLength(1)
    expect(lst[0]!.nota).toBe('Corregido')
    expect(lst[0]!.ev).toBeGreaterThan(antes.ev)
  })

  it('conserva la foto aunque cambie la línea base', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const antes = await detalle(id, '2026-02-15')
    await guardarCronograma(
      id,
      base().map((a) => (a.id === 'A' ? { ...a, peso: 0.1 } : a)),
    )
    const despues = await detalle(id, '2026-02-15')
    expect(despues.avances[0]!.peso).toBe(0.5)
    expect(despues.pv).toBe(antes.pv)
    expect(despues.ev).toBe(antes.ev)
  })

  it('una hoja eliminada sigue en el corte y editar la nota no cambia los totales', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const antes = await detalle(id, '2026-02-15')
    await guardarCronograma(
      id,
      base().filter((a) => a.id !== 'B'),
    )
    const c = await detalle(id, '2026-02-15')
    expect(c.avances.find((a) => a.actividadId === 'B')).toMatchObject({
      eliminada: true,
      pct: 0.2,
    })

    const r = await guardarCorte(id, '2026-02-15', { nota: 'Solo la nota', avances: [] })
    expect(r.statusCode).toBe(200)
    expect(r.json<CorteDetalle>().ev).toBe(antes.ev)
    expect(r.json<CorteDetalle>().pv).toBe(antes.pv)
  })

  it('una hoja que no viene toma el % del corte anterior', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(0.8, 0.2) })
    const r = await guardarCorte(id, '2026-03-01', { avances: [{ actividadId: 'A', pct: 1 }] })
    expect(r.statusCode).toBe(201)
    expect(r.json<CorteDetalle>().avances.find((a) => a.actividadId === 'B')!.pct).toBe(0.2)
  })

  it('rechaza fechas futuras, anteriores al último corte o inexistentes', async () => {
    const id = await conCronograma()
    const futura = await guardarCorte(id, '2999-01-01', { avances: [] })
    expect(futura.statusCode).toBe(400)
    expect(futura.json().error.codigo).toBe('fecha_futura')

    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const anterior = await guardarCorte(id, '2026-02-01', { avances: [] })
    expect(anterior.statusCode).toBe(400)
    expect(anterior.json().error.codigo).toBe('corte_anterior')

    expect((await guardarCorte(id, '2026-02-30', { avances: [] })).statusCode).toBe(400)
  })

  it('«hoy» es la fecha de Bogotá: a las 8 p. m. el corte de hoy vale y el de mañana no', async () => {
    const id = await conCronograma()
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date('2026-11-12T01:00:00Z'))
      const manana = await guardarCorte(id, '2026-11-12', { avances: [] })
      expect(manana.statusCode).toBe(400)
      expect(manana.json().error.codigo).toBe('fecha_futura')
      expect((await guardarCorte(id, '2026-11-11', { avances: [] })).statusCode).toBe(201)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rechaza actividades que no son hojas programadas', async () => {
    const id = await conCronograma()
    const r = await guardarCorte(id, '2026-02-15', { avances: [{ actividadId: 'C', pct: 0.5 }] })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.codigo).toBe('actividad_invalida')

    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const ajena = await guardarCorte(id, '2026-02-15', { avances: [{ actividadId: 'C', pct: 1 }] })
    expect(ajena.json().error.codigo).toBe('actividad_invalida')
  })

  it('sin hojas programadas no se puede registrar un corte', async () => {
    const id = await conCronograma([{ id: 'C', padreId: null, orden: 0, nombre: 'C', peso: 0.2 }])
    const r = await guardarCorte(id, '2026-02-15', { avances: [] })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.codigo).toBe('sin_hojas_programadas')
  })
})

describe('GET y DELETE de cortes', () => {
  it('lista por fecha con estado y vencidas', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    await guardarCorte(id, '2026-03-10', { avances: pcts(0.9, 0.3) })
    const lst = await lista(id)
    expect(lst.map((c) => c.fecha)).toEqual(['2026-02-15', '2026-03-10'])
    expect(lst[1]!.vencidas).toBe(1)
    // El proyecto se juzga por brecha (≈ 19 puntos); la hoja A vencida cuenta aparte.
    expect(lst[1]!.estado).toBe('en_atencion')
  })

  it('un corte inexistente da 404', async () => {
    const id = await conCronograma()
    const r = await app.inject({ method: 'GET', url: url(id, '2026-02-15'), headers: ana })
    expect(r.statusCode).toBe(404)
  })

  it('eliminar deja el corte anterior como último en el portafolio', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    await guardarCorte(id, '2026-03-10', { avances: pcts(1, 0.5) })
    const r = await app.inject({ method: 'DELETE', url: url(id, '2026-03-10'), headers: ana })
    expect(r.statusCode).toBe(204)
    const portafolio = (
      await app.inject({ method: 'GET', url: '/api/charters', headers: ana })
    ).json<CharterResumen[]>()
    expect(portafolio[0]!.ultimoCorte?.fecha).toBe('2026-02-15')
    expect((await cronograma(id)).ultimoCorte?.fecha).toBe('2026-02-15')
  })
})

describe('acceso a los cortes', () => {
  it('charter cerrado: lee pero no escribe', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    await app.inject({
      method: 'PATCH',
      url: `/api/charters/${id}`,
      headers: ana,
      payload: { estado: 'cerrado' },
    })
    expect((await app.inject({ method: 'GET', url: url(id), headers: ana })).statusCode).toBe(200)
    const r = await guardarCorte(id, '2026-02-15', { avances: [] })
    expect(r.json().error.codigo).toBe('charter_cerrado')
    const d = await app.inject({ method: 'DELETE', url: url(id, '2026-02-15'), headers: ana })
    expect(d.statusCode).toBe(409)
  })

  it('el Admin lee y no escribe; un ajeno recibe 404', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-15', { avances: pcts(1, 0.2) })
    const admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    expect((await app.inject({ method: 'GET', url: url(id), headers: admin })).statusCode).toBe(200)
    expect((await guardarCorte(id, '2026-02-16', { avances: [] }, admin)).statusCode).toBe(403)
    expect((await app.inject({ method: 'GET', url: url(id), headers: beto })).statusCode).toBe(404)
    expect((await guardarCorte(id, '2026-02-16', { avances: [] }, beto)).statusCode).toBe(404)
  })
})

describe('resumen del portafolio', () => {
  const resumen = async (id: string) =>
    (await app.inject({ method: 'GET', url: '/api/charters', headers: ana }))
      .json<CharterResumen[]>()
      .find((c) => c.id === id)!

  it('trae estado, vencidas y la serie de cortes guardados', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-01', { avances: [{ actividadId: 'A', pct: 0.2 }] })
    await guardarCorte(id, '2026-03-15', { avances: [{ actividadId: 'A', pct: 0.5 }] })
    const c = await resumen(id)
    expect(c.cortes.map((k) => k.fecha)).toEqual(['2026-02-01', '2026-03-15'])
    // A venció el 28 feb sin el 100 %.
    expect(c.ultimoCorte).toMatchObject({ fecha: '2026-03-15', estado: 'atrasada', vencidas: 1 })
  })

  it('un cambio del cronograma no altera lo guardado', async () => {
    const id = await conCronograma()
    await guardarCorte(id, '2026-02-01', { avances: [{ actividadId: 'A', pct: 0.2 }] })
    const antes = (await resumen(id)).ultimoCorte!
    const cambiado = base().map((a) => (a.id === 'A' ? { ...a, fin: '2026-06-30' } : a))
    await guardarCronograma(id, cambiado)
    expect((await resumen(id)).ultimoCorte).toEqual(antes)
  })
})
