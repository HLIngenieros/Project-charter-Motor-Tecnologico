import { describe, expect, it } from 'vitest'
import { clasificarHojas } from '../src/pantallas/corte/clasificar'

const h = (id: string, inicio: string, fin: string) => ({ id, inicio, fin })
const FECHA = '2026-03-10'

describe('clasificarHojas', () => {
  it('una hoja que terminó antes de la fecha sin el 100 % está vencida', () => {
    const g = clasificarHojas([h('a', '2026-02-01', '2026-03-01')], { a: 0.5 }, FECHA)
    expect(g.vencidas.map((x) => x.id)).toEqual(['a'])
  })

  it('con el 100 % pasa al resto', () => {
    const g = clasificarHojas([h('a', '2026-02-01', '2026-03-01')], { a: 1 }, FECHA)
    expect(g.vencidas).toEqual([])
    expect(g.resto.map((x) => x.id)).toEqual(['a'])
  })

  it('una hoja que contiene la fecha está en curso', () => {
    const g = clasificarHojas([h('b', '2026-03-01', '2026-03-31')], {}, FECHA)
    expect(g.enCurso.map((x) => x.id)).toEqual(['b'])
  })

  it('una hoja que inicia después va al resto, y cada grupo conserva el orden', () => {
    const g = clasificarHojas(
      [
        h('c', '2026-04-01', '2026-04-30'),
        h('b', '2026-03-01', '2026-03-31'),
        h('d', '2026-03-10', '2026-03-10'),
      ],
      {},
      FECHA,
    )
    expect(g.resto.map((x) => x.id)).toEqual(['c'])
    expect(g.enCurso.map((x) => x.id)).toEqual(['b', 'd'])
  })
})
