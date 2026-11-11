import { aDia } from '@charter/shared'
import { describe, expect, it } from 'vitest'
import {
  aPorcentaje,
  diasPorPixel,
  marcas,
  rangoVisible,
} from '../src/pantallas/ficha/cronograma/escala'

const dias = (r: { desde: string; hasta: string }) => aDia(r.hasta) - aDia(r.desde)

describe('rangoVisible', () => {
  it('un proyecto corto cabe entero, con margen, en la escala año', () => {
    const r = rangoVisible({ inicio: '2026-01-05', fin: '2026-03-20' }, 'anio', '2026-02-01')
    expect(dias(r)).toBeGreaterThanOrEqual(365)
    expect(r.desde <= '2025-12-29').toBe(true)
    expect(r.hasta >= '2026-03-27').toBe(true)
  })

  it('un proyecto largo en trimestre muestra la ventana alrededor del corte', () => {
    const r = rangoVisible({ inicio: '2026-01-01', fin: '2026-12-31' }, 'trimestre', '2026-06-15')
    expect(dias(r)).toBeLessThan(100)
    expect(r.desde < '2026-06-15' && r.hasta > '2026-06-15').toBe(true)
  })

  it('sin fechas usa la escala alrededor del corte', () => {
    const r = rangoVisible(null, 'semestre', '2026-06-15')
    expect(dias(r)).toBeGreaterThanOrEqual(180)
  })
})

describe('aPorcentaje y diasPorPixel', () => {
  const r = { desde: '2026-01-01', hasta: '2026-04-01' }

  it('va de 0 a 100 entre los extremos', () => {
    expect(aPorcentaje('2026-01-01', r)).toBe(0)
    expect(aPorcentaje('2026-04-01', r)).toBe(100)
  })

  it('convierte píxeles en días', () => {
    expect(diasPorPixel(r, 900)).toBeCloseTo(90 / 900)
  })
})

describe('marcas', () => {
  it('en trimestre marca cada mes', () => {
    const m = marcas({ desde: '2025-12-20', hasta: '2026-03-15' }, 'trimestre')
    expect(m.map((x) => x.etiqueta)).toEqual(['ene', 'feb', 'mar'])
    expect(m[0]!.fecha).toBe('2026-01-01')
  })

  it('en año marca cada trimestre', () => {
    const m = marcas({ desde: '2026-01-01', hasta: '2027-01-01' }, 'anio')
    expect(m.map((x) => x.etiqueta)).toEqual(['ene', 'abr', 'jul', 'oct', 'ene'])
  })

  it('la etiqueta de un mes pegada a la del corte se omite (la línea queda)', () => {
    const r = { desde: '2026-10-01', hasta: '2027-01-01' }
    const m = marcas(r, 'trimestre', '2026-11-10')
    const nov = m.find((x) => x.fecha === '2026-11-01')!
    expect(nov.etiqueta).toBe('')
    expect(m.find((x) => x.fecha === '2026-12-01')!.etiqueta).toBe('dic')
    expect(m.find((x) => x.fecha === '2026-10-01')!.etiqueta).toBe('oct')
  })

  it('con una pista ancha la etiqueta cercana sí cabe', () => {
    const r = { desde: '2026-10-01', hasta: '2027-01-01' }
    const m = marcas(r, 'trimestre', '2026-11-10', 1200)
    expect(m.find((x) => x.fecha === '2026-11-01')!.etiqueta).toBe('nov')
  })
})
