import { describe, expect, it } from 'vitest'
import { nivelRiesgo, totalPresupuesto, valorRubro } from '../../src/calculo/complementos'

describe('nivelRiesgo', () => {
  it('nivel por bordes', () => {
    expect(nivelRiesgo(1, 4)).toEqual({ puntaje: 4, nivel: 'bajo' })
    expect(nivelRiesgo(1, 5)?.nivel).toBe('medio')
    expect(nivelRiesgo(3, 3)?.nivel).toBe('medio')
    expect(nivelRiesgo(2, 5)?.nivel).toBe('alto')
    expect(nivelRiesgo(3, 5)?.nivel).toBe('alto')
    expect(nivelRiesgo(4, 4)?.nivel).toBe('critico')
    expect(nivelRiesgo(5, 5)).toEqual({ puntaje: 25, nivel: 'critico' })
  })

  it('sin calificar', () => {
    expect(nivelRiesgo(null, 3)).toBeNull()
    expect(nivelRiesgo(4, null)).toBeNull()
  })
})

describe('presupuesto', () => {
  it('valor de rubro', () => {
    expect(valorRubro({ valor: 5000, lineas: [] })).toBe(5000)
    expect(valorRubro({ valor: 1, lineas: [{ cantidad: 2.5, valorUnitario: 3333 }] })).toBe(8333)
    expect(
      valorRubro({
        valor: 0,
        lineas: [
          { cantidad: 1, valorUnitario: 100 },
          { cantidad: 3, valorUnitario: 50 },
        ],
      }),
    ).toBe(250)
  })

  it('total', () => {
    expect(
      totalPresupuesto([
        { valor: 5000, lineas: [] },
        { valor: 1, lineas: [{ cantidad: 2, valorUnitario: 10 }] },
      ]),
    ).toBe(5020)
    expect(totalPresupuesto([])).toBe(0)
  })
})
