import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma, type ResultadoNodo } from '../../src/calculo/cronograma'
import type { ActividadEntrada } from '../../src/calculo/tipos'

const hoja = (id: string, extra: Partial<ActividadEntrada> = {}): ActividadEntrada => ({
  id,
  padreId: null,
  orden: 1,
  nombre: id,
  peso: 1,
  inicio: '2025-03-01',
  fin: '2025-03-10',
  ...extra,
})

const unaHoja = (
  fecha: string,
  pct: number,
  extra: Partial<ActividadEntrada> = {},
  terminadaEn?: string,
) => calcularCronograma(construirArbol([hoja('h', extra)]), { h: { pct, terminadaEn } }, fecha)

function sinNumerosRaros(n: ResultadoNodo) {
  for (const v of [n.peso, n.pv, n.ev, n.desv, n.spi, n.dur]) {
    if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true)
  }
}

describe('calcularCronograma · hoja', () => {
  it('a mitad de plazo con 30 % real está al día', () => {
    const h = unaHoja('2025-03-05', 0.3).nodos.h!
    expect(h.dur).toBe(10)
    expect(h.pv).toBeCloseTo(0.5, 12)
    expect(h.ev).toBeCloseTo(0.3, 12)
    expect(h.desv).toBeCloseTo(-2, 12)
    expect(h.spi).toBeCloseTo(0.6, 12)
    expect(h.estado).toBe('al_dia')
    expect(h.adelantada).toBe(false)
    expect(h.forecast).toBe('2025-03-12')
  })

  it('sin avance y casi al final queda en atención', () => {
    const h = unaHoja('2025-03-09', 0).nodos.h!
    expect(h.pv).toBeCloseTo(0.9, 12)
    expect(h.desv).toBeCloseTo(-9, 12)
    expect(h.estado).toBe('en_atencion')
  })

  it('con -10 días sigue en atención y con umbral -9 queda atrasada', () => {
    const h = unaHoja('2025-03-10', 0).nodos.h!
    expect(h.desv).toBeCloseTo(-10, 12)
    expect(h.estado).toBe('en_atencion')
    const r = calcularCronograma(construirArbol([hoja('h')]), { h: { pct: 0 } }, '2025-03-10', {
      atencion: -3,
      atraso: -9,
    })
    expect(r.nodos.h!.estado).toBe('atrasada')
  })

  it('antes del inicio está por iniciar', () => {
    const h = unaHoja('2025-02-20', 0).nodos.h!
    expect(h.pv).toBe(0)
    expect(h.spi).toBeNull()
    expect(h.estado).toBe('por_iniciar')
  })

  it('terminada usa la fecha en que llegó al 100 %', () => {
    const h = unaHoja('2025-03-05', 1, {}, '2025-03-08').nodos.h!
    expect(h.estado).toBe('terminada')
    expect(h.forecast).toBe('2025-03-08')
    expect(h.adelantada).toBe(true)
  })

  it('terminada sin fecha registrada usa la fecha de corte', () => {
    expect(unaHoja('2025-03-05', 1).nodos.h!.forecast).toBe('2025-03-05')
  })

  it('el forecast nunca queda antes de la fecha de corte', () => {
    // Plazo vencido sin avance: fin − round(−10) = 03-20, igual al corte.
    expect(unaHoja('2025-03-25', 0).nodos.h!.forecast).toBe('2025-03-25')
  })

  it('recorta el avance real entre 0 y 1', () => {
    expect(unaHoja('2025-03-05', 1.4).nodos.h!.ev).toBe(1)
    expect(unaHoja('2025-03-05', -0.2).nodos.h!.ev).toBe(0)
  })
})

describe('calcularCronograma · agrupadora', () => {
  it('pondera con la suma de pesos de sus hojas como divisor', () => {
    const raices = construirArbol([
      { id: 'g', padreId: null, orden: 1, nombre: 'g' },
      hoja('a', { padreId: 'g', orden: 1, peso: 0.2 }),
      hoja('b', { padreId: 'g', orden: 2, peso: 0.6, inicio: '2025-03-06', fin: '2025-03-15' }),
    ])
    const r = calcularCronograma(raices, { a: { pct: 0.5 }, b: { pct: 0 } }, '2025-03-05')
    const g = r.nodos.g!
    // a: pv 0,5 y ev 0,5; b: pv 0 y ev 0 → (0,2 · 0,5) / 0,8
    expect(g.peso).toBeCloseTo(0.8, 12)
    expect(g.pv).toBeCloseTo(0.1 / 0.8, 12)
    expect(g.ev).toBeCloseTo(0.1 / 0.8, 12)
    expect(g.inicio).toBe('2025-03-01')
    expect(g.fin).toBe('2025-03-15')
    expect(g.dur).toBe(15)
    expect(g.forecast).toBe('2025-03-15')
    expect(r.proyecto.id).toBe('proyecto')
    expect(r.proyecto.item).toBe('')
    expect(r.proyecto.pv).toBeCloseTo(g.pv, 12)
  })
})

describe('calcularCronograma · casos degenerados', () => {
  it('todas las hojas sin programar: el proyecto queda sin programar y sin NaN', () => {
    const raices = construirArbol([
      { id: 'g', padreId: null, orden: 1, nombre: 'g' },
      hoja('a', { padreId: 'g', inicio: null }),
      hoja('b', { padreId: 'g', orden: 2, fin: null }),
    ])
    const r = calcularCronograma(raices, {}, '2025-03-05')
    expect(r.proyecto.estado).toBe('sin_programar')
    expect(r.nodos.g!.estado).toBe('sin_programar')
    expect(r.nodos.a!.estado).toBe('sin_programar')
    for (const n of [r.proyecto, ...Object.values(r.nodos)]) {
      sinNumerosRaros(n)
      expect(n.pv).toBe(0)
      expect(n.ev).toBe(0)
      expect(n.desv).toBe(0)
      expect(n.spi).toBeNull()
      expect(n.forecast).toBeNull()
    }
  })

  it('una hoja de peso 0 queda sin programar', () => {
    const r = calcularCronograma(
      construirArbol([hoja('h', { peso: 0 })]),
      { h: { pct: 0.5 } },
      '2025-03-05',
    )
    expect(r.nodos.h!.estado).toBe('sin_programar')
    expect(r.proyecto.estado).toBe('sin_programar')
    sinNumerosRaros(r.nodos.h!)
    sinNumerosRaros(r.proyecto)
  })

  it('una hoja de un día no produce NaN ni Infinity', () => {
    for (const fecha of ['2025-03-04', '2025-03-05', '2025-03-06']) {
      const r = calcularCronograma(
        construirArbol([hoja('h', { inicio: '2025-03-05', fin: '2025-03-05' })]),
        { h: { pct: 0 } },
        fecha,
      )
      expect(r.nodos.h!.dur).toBe(1)
      sinNumerosRaros(r.nodos.h!)
      sinNumerosRaros(r.proyecto)
    }
  })

  it('una hoja con fin antes del inicio queda sin programar', () => {
    const r = calcularCronograma(
      construirArbol([hoja('h', { inicio: '2025-03-10', fin: '2025-03-01' })]),
      { h: { pct: 0.5 } },
      '2025-03-05',
    )
    expect(r.nodos.h!.estado).toBe('sin_programar')
    sinNumerosRaros(r.nodos.h!)
  })
})
