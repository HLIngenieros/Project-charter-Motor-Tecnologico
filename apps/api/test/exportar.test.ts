import type {
  ActividadEntrada,
  CorteResumen,
  CronogramaRespuesta,
  ExportacionCharter,
} from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>
let id: string

const ACTS: ActividadEntrada[] = [
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
    peso: 0.5,
    inicio: '2026-02-01',
    fin: '2026-03-31',
  },
]

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
  id = await crearCharterPrueba(app, ana)
  const { version } = (
    await app.inject({ method: 'GET', url: `/api/charters/${id}/cronograma`, headers: ana })
  ).json<CronogramaRespuesta>()
  await app.inject({
    method: 'PUT',
    url: `/api/charters/${id}/cronograma`,
    headers: ana,
    payload: { version, actividades: ACTS },
  })
  for (const [fecha, pct] of [
    ['2026-01-15', 0.1],
    ['2026-02-10', 0.3],
  ] as const) {
    await app.inject({
      method: 'PUT',
      url: `/api/charters/${id}/cortes/${fecha}`,
      headers: ana,
      payload: { nota: '', avances: [{ actividadId: 'A', pct }] },
    })
  }
})

const exportar = (q = '', h = ana) =>
  app.inject({ method: 'GET', url: `/api/charters/${id}/exportar${q}`, headers: h })

describe('GET /charters/:id/exportar', () => {
  it('el dueño recibe todo el charter al último corte', async () => {
    const r = await exportar()
    expect(r.statusCode).toBe(200)
    const e = r.json<ExportacionCharter>()
    expect(e.formato).toBe('project-charter')
    expect(e.version).toBe(1)
    expect(e.generadoEn).toBeTruthy()
    expect(e.corte).toBe('2026-02-10')
    expect(e.charter.id).toBe(id)
    expect(e.charter.reglas.umbrales.atencion).toBe(10)
    expect(e.cortes.map((c) => c.fecha)).toEqual(['2026-01-15', '2026-02-10'])
    expect(e.cortes[0]!.avances).toHaveLength(2)
    expect(e.cronograma.actividades).toHaveLength(2)
    expect(e.cronograma.calculo.A!.ev).toBeCloseTo(0.3, 9)
    expect(e.cronograma.proyecto.ev).toBeCloseTo(0.15, 9)
  })

  it('a un corte pasado, el proyecto trae lo guardado de ese corte', async () => {
    const lista = (
      await app.inject({ method: 'GET', url: `/api/charters/${id}/cortes`, headers: ana })
    ).json<CorteResumen[]>()
    const primero = lista.find((c) => c.fecha === '2026-01-15')!
    const e = (await exportar('?corte=2026-01-15')).json<ExportacionCharter>()
    expect(e.corte).toBe('2026-01-15')
    expect(e.cronograma.proyecto.pv).toBeCloseTo(primero.pv, 9)
    expect(e.cronograma.proyecto.ev).toBeCloseTo(primero.ev, 9)
    expect(e.cronograma.calculo.A!.ev).toBeCloseTo(0.1, 9)
  })

  it('una fecha que no es un corte da 404', async () => {
    const r = await exportar('?corte=2020-01-01')
    expect(r.statusCode).toBe(404)
    expect(r.json().error.codigo).toBe('no_encontrado')
  })

  it('otro usuario no lo ve; el Admin sí', async () => {
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    expect((await exportar('', beto)).statusCode).toBe(404)
    const admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
    expect((await exportar('', admin)).statusCode).toBe(200)
  })
})
