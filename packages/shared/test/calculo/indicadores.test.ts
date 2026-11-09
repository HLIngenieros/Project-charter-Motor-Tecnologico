import { describe, expect, it } from 'vitest'
import { cumplimientoIndicador } from '../../src/calculo/indicadores'

describe('cumplimientoIndicador', () => {
  it('mayor o igual: valor / meta', () => {
    expect(cumplimientoIndicador({ operador: '>=', valor: 85 }, 68)).toEqual({
      pct: 0.8,
      estado: 'atencion',
    })
    expect(cumplimientoIndicador({ operador: '>=', valor: 85 }, 100)).toEqual({
      pct: 1,
      estado: 'verde',
    })
    expect(cumplimientoIndicador({ operador: '>=', valor: 85 }, 40).estado).toBe('rojo')
  })

  it('menor o igual: meta / valor', () => {
    expect(cumplimientoIndicador({ operador: '<=', valor: 72 }, 90)).toEqual({
      pct: 0.8,
      estado: 'atencion',
    })
    expect(cumplimientoIndicador({ operador: '<=', valor: 72 }, 0)).toEqual({
      pct: 1,
      estado: 'verde',
    })
  })

  it('igual: 1 si coincide y 0 si no', () => {
    expect(cumplimientoIndicador({ operador: '=', valor: 1 }, 2)).toEqual({
      pct: 0,
      estado: 'rojo',
    })
    expect(cumplimientoIndicador({ operador: '=', valor: 1 }, 1)).toEqual({
      pct: 1,
      estado: 'verde',
    })
  })

  it('con divisor 0 da 1 si cumple y 0 si no', () => {
    expect(cumplimientoIndicador({ operador: '>=', valor: 0 }, 5).pct).toBe(1)
    expect(cumplimientoIndicador({ operador: '<=', valor: 5 }, 0).pct).toBe(1)
    expect(cumplimientoIndicador({ operador: '>=', valor: 0 }, -1).pct).toBe(0)
  })
})
