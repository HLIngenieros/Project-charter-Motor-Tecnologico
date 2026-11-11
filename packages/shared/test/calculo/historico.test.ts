import type { AvanceFoto } from '../../src/esquemas/cronograma'
import type { ActividadEntrada } from '../../src/calculo/tipos'
import { describe, expect, it } from 'vitest'
import { arbolHistorico } from '../../src/calculo/historico'

const act = (id: string, extra: Partial<ActividadEntrada> = {}): ActividadEntrada => ({
  id,
  padreId: null,
  orden: 0,
  nombre: id,
  entregable: null,
  peso: null,
  inicio: null,
  fin: null,
  responsables: [],
  ...extra,
})

const foto = (id: string, extra: Partial<AvanceFoto> = {}): AvanceFoto => ({
  actividadId: id,
  item: '1',
  nombre: id,
  pct: 0,
  peso: 0.5,
  inicio: '2026-01-01',
  fin: '2026-01-31',
  eliminada: false,
  ...extra,
})

const ACTS = [
  act('g', { nombre: 'Grupo' }),
  act('h1', { padreId: 'g', orden: 0, peso: 0.4, inicio: '2026-02-01', fin: '2026-03-01' }),
  act('h2', { padreId: 'g', orden: 1, peso: 0.6, inicio: '2026-02-01', fin: '2026-02-28' }),
  act('h3', { padreId: 'g', orden: 2, peso: 0.2, inicio: '2026-03-01', fin: '2026-03-31' }),
]

describe('arbolHistorico', () => {
  const r = arbolHistorico(ACTS, [
    foto('h1', { pct: 0.3, peso: 0.5, inicio: '2026-01-01', fin: '2026-01-31' }),
    foto('h2', { pct: 0.1, peso: 0.5 }),
    foto('x', { pct: 1, peso: 0.1, eliminada: true }),
  ])

  it('una hoja de la foto toma su peso y sus fechas', () => {
    const h1 = r.acts.find((a) => a.id === 'h1')!
    expect(h1).toMatchObject({ peso: 0.5, inicio: '2026-01-01', fin: '2026-01-31' })
    expect(r.avances.h1).toEqual({ pct: 0.3, terminadaEn: null })
  })

  it('una hoja creada después queda en noExistia y sin peso', () => {
    expect(r.noExistia).toEqual(new Set(['h3']))
    expect(r.acts.find((a) => a.id === 'h3')!.peso).toBeNull()
    expect(r.avances.h3).toBeUndefined()
  })

  it('las filas eliminadas de la foto van aparte', () => {
    expect(r.eliminadas.map((f) => f.actividadId)).toEqual(['x'])
    expect(r.acts.some((a) => a.id === 'x')).toBe(false)
  })

  it('las agrupadoras quedan intactas', () => {
    expect(r.acts.find((a) => a.id === 'g')).toEqual(ACTS[0])
    expect(r.acts.map((a) => a.id)).toEqual(['g', 'h1', 'h2', 'h3'])
  })
})
