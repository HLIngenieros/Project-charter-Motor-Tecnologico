import { describe, expect, it } from 'vitest'
import {
  indicadoresEntrada,
  presupuestoEntrada,
  riesgosEntrada,
} from '../../src/esquemas/complementos'

const id = '0190d7a0-0000-7000-8000-000000000001'

const indicador = {
  id,
  nombre: 'x',
  formula: '',
  metaOperador: '>=',
  metaValor: null,
  metaUnidad: '',
  observaciones: '',
}

describe('esquemas de complementos', () => {
  it('acepta textos vacíos y nulos, rechaza fuera de rango', () => {
    expect(
      riesgosEntrada.safeParse({
        items: [{ id, riesgo: '', causa: '', mitigacion: '', probabilidad: 3, impacto: null }],
      }).success,
    ).toBe(true)
    expect(
      riesgosEntrada.safeParse({
        items: [{ id, riesgo: 'x', causa: '', mitigacion: '', probabilidad: 6, impacto: 1 }],
      }).success,
    ).toBe(false)
    expect(
      presupuestoEntrada.safeParse({ rubros: [{ id, descripcion: 'x', valor: -1, lineas: [] }] })
        .success,
    ).toBe(false)
    expect(indicadoresEntrada.safeParse({ items: [indicador] }).success).toBe(true)
    expect(indicadoresEntrada.safeParse({ items: [{ ...indicador, id: 'no-uuid' }] }).success).toBe(
      false,
    )
  })

  it('recorta textos y limita tamaños', () => {
    const r = indicadoresEntrada.parse({ items: [{ ...indicador, nombre: '  Días  ' }] })
    expect(r.items[0]!.nombre).toBe('Días')
    expect(
      indicadoresEntrada.safeParse({ items: [{ ...indicador, metaUnidad: 'x'.repeat(41) }] })
        .success,
    ).toBe(false)
    expect(
      riesgosEntrada.safeParse({
        items: [
          {
            id,
            riesgo: 'x',
            causa: 'y'.repeat(1001),
            mitigacion: '',
            probabilidad: null,
            impacto: null,
          },
        ],
      }).success,
    ).toBe(false)
    const muchos = Array.from({ length: 51 }, () => ({ ...indicador }))
    expect(indicadoresEntrada.safeParse({ items: muchos }).success).toBe(false)
  })

  it('presupuesto: líneas, decimales y topes', () => {
    const linea = { id, concepto: 'Licencia', cantidad: 2.5, valorUnitario: 3333 }
    const rubro = { id, descripcion: 'Software', valor: 0, lineas: [linea] }
    expect(presupuestoEntrada.safeParse({ rubros: [rubro] }).success).toBe(true)
    expect(
      presupuestoEntrada.safeParse({
        rubros: [{ ...rubro, lineas: [{ ...linea, valorUnitario: 1.5 }] }],
      }).success,
    ).toBe(false)
    expect(
      presupuestoEntrada.safeParse({ rubros: [{ ...rubro, valor: 1e13 + 1, lineas: [] }] }).success,
    ).toBe(false)
    expect(
      presupuestoEntrada.safeParse({
        rubros: [{ ...rubro, lineas: Array.from({ length: 51 }, () => linea) }],
      }).success,
    ).toBe(false)
  })
})
