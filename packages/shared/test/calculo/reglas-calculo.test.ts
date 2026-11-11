import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma } from '../../src/calculo/cronograma'
import { aDia, aISO, diasHabiles, sumarHabiles } from '../../src/calculo/fechas'
import { REGLAS_POR_DEFECTO, type Reglas } from '../../src/calculo/reglas'
import type { FechaISO } from '../../src/calculo/tipos'

const reglas = (r: Partial<Reglas>): Reglas => ({ ...REGLAS_POR_DEFECTO, ...r })
const unaHoja = (inicio: FechaISO, fin: FechaISO, pct: number, fecha: FechaISO, r: Reglas) =>
  calcularCronograma(
    construirArbol([{ id: 'h', padreId: null, orden: 0, nombre: 'h', peso: 1, inicio, fin }]),
    { h: { pct } },
    fecha,
    r,
  ).nodos.h!

describe('días hábiles', () => {
  it('diasHabiles cuenta lunes a viernes, ambos extremos incluidos', () => {
    expect(diasHabiles(aDia('2026-03-02'), aDia('2026-03-08'))).toBe(5)
    expect(diasHabiles(aDia('2026-03-07'), aDia('2026-03-08'))).toBe(0)
    expect(diasHabiles(aDia('2026-03-02'), aDia('2026-03-13'))).toBe(10)
    expect(diasHabiles(aDia('2026-03-05'), aDia('2026-03-02'))).toBe(0)
  })

  it('sumarHabiles salta los fines de semana', () => {
    expect(aISO(sumarHabiles(aDia('2026-03-06'), 1))).toBe('2026-03-09')
    expect(aISO(sumarHabiles(aDia('2026-03-09'), -1))).toBe('2026-03-06')
    expect(aISO(sumarHabiles(aDia('2026-03-07'), 1))).toBe('2026-03-09')
    expect(aISO(sumarHabiles(aDia('2026-03-02'), 0))).toBe('2026-03-02')
  })

  it('el planeado de un sábado es el del viernes', () => {
    const r = reglas({ reparto: 'habiles' })
    const vie = unaHoja('2026-03-02', '2026-03-13', 0, '2026-03-06', r)
    const sab = unaHoja('2026-03-02', '2026-03-13', 0, '2026-03-07', r)
    expect(vie.pv).toBeCloseTo(0.5, 9)
    expect(sab.pv).toBeCloseTo(0.5, 9)
    expect(sab.dur).toBe(12)
  })

  it('una hoja de fin de semana cuenta como de 1 día hábil', () => {
    const r = reglas({ reparto: 'habiles' })
    const sab = unaHoja('2026-03-07', '2026-03-08', 0, '2026-03-07', r)
    expect(sab.estado).not.toBe('sin_programar')
    expect(sab.pv).toBe(0)
    expect(unaHoja('2026-03-07', '2026-03-08', 0, '2026-03-08', r).pv).toBe(1)
  })
})

describe('proyección al ritmo actual', () => {
  it('con SPI 0,5 una hoja de 10 días termina el doble de tarde', () => {
    const h = unaHoja(
      '2026-03-01',
      '2026-03-10',
      0.25,
      '2026-03-05',
      reglas({ proyeccion: 'ritmo' }),
    )
    expect(h.spi).toBeCloseTo(0.5, 9)
    expect(h.forecast).toBe('2026-03-20')
  })

  it('con desviación da lo de siempre', () => {
    const h = unaHoja('2026-03-01', '2026-03-10', 0.25, '2026-03-05', REGLAS_POR_DEFECTO)
    expect(h.forecast).toBe(
      aISO(Math.max(aDia('2026-03-05'), aDia('2026-03-10') - Math.round(h.desv))),
    )
  })

  it('sin planeado todavía, el ritmo usa la desviación', () => {
    const ritmo = unaHoja(
      '2026-03-10',
      '2026-03-20',
      0,
      '2026-03-05',
      reglas({ proyeccion: 'ritmo' }),
    )
    const desv = unaHoja('2026-03-10', '2026-03-20', 0, '2026-03-05', REGLAS_POR_DEFECTO)
    expect(ritmo.forecast).toBe(desv.forecast)
  })

  it('con días hábiles, el ritmo cuenta en hábiles', () => {
    // 2 al 13 de marzo: 10 hábiles; al vie 6 va en 50 % planeado; con 25 % real, SPI 0,5 → 20 hábiles.
    const h = unaHoja(
      '2026-03-02',
      '2026-03-13',
      0.25,
      '2026-03-06',
      reglas({ proyeccion: 'ritmo', reparto: 'habiles' }),
    )
    expect(h.forecast).toBe('2026-03-27')
  })
})
