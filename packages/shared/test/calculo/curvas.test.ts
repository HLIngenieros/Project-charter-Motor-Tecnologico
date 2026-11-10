import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma } from '../../src/calculo/cronograma'
import {
  avancePorGrupo,
  curvaSPlaneada,
  curvaSReal,
  lecturaEn,
  proyeccionAlRitmo,
} from '../../src/calculo/curvas'
import { aDia } from '../../src/calculo/fechas'
import { actividadesFixture, fixture, idDe } from './fixture'

const raices = construirArbol(actividadesFixture())

describe('curvaSPlaneada', () => {
  const curva = curvaSPlaneada(raices)

  it('va del inicio al fin del proyecto', () => {
    expect(curva[0]!.fecha).toBe('2025-01-15')
    expect(curva[0]!.pv).toBeCloseTo(0, 2)
    expect(curva.at(-1)).toEqual({ fecha: '2025-12-19', pv: 1 })
  })

  it('avanza de 7 en 7 días salvo el último tramo', () => {
    const dias = curva.map((p) => aDia(p.fecha))
    for (let i = 1; i < dias.length - 1; i++) expect(dias[i]! - dias[i - 1]!).toBe(7)
    const ultimo = dias.at(-1)! - dias.at(-2)!
    expect(ultimo).toBeGreaterThan(0)
    expect(ultimo).toBeLessThanOrEqual(7)
  })

  it('es monótona no decreciente', () => {
    for (let i = 1; i < curva.length; i++) {
      expect(curva[i]!.pv).toBeGreaterThanOrEqual(curva[i - 1]!.pv)
    }
  })

  it('queda vacía si el proyecto está sin programar', () => {
    expect(
      curvaSPlaneada(construirArbol([{ id: 'a', padreId: null, orden: 1, nombre: 'a' }])),
    ).toEqual([])
  })
})

describe('curvaSReal', () => {
  it('ordena los cortes por fecha', () => {
    expect(
      curvaSReal([
        { fecha: '2025-03-13', ev: 0.12 },
        { fecha: '2025-02-01', ev: 0.05 },
      ]),
    ).toEqual([
      { fecha: '2025-02-01', ev: 0.05 },
      { fecha: '2025-03-13', ev: 0.12 },
    ])
  })
})

describe('avancePorGrupo', () => {
  it('devuelve los 3 grupos de primer nivel del fixture', () => {
    const avances = Object.fromEntries(
      fixture.filas.map((f) => [idDe(f.fila), { pct: f.esperado.L ?? 0 }]),
    )
    const r = calcularCronograma(raices, avances, fixture.corte)
    const grupos = avancePorGrupo(raices, r)
    expect(grupos.map((g) => g.item)).toEqual(['1', '2', '3'])
    expect(grupos[0]).toMatchObject({
      id: idDe(20),
      nombre: 'Potenciacion de herramientas de software actuales.',
    })
    expect(grupos[0]!.pv).toBeCloseTo(r.nodos[idDe(20)]!.pv, 12)
    expect(grupos[0]!.ev).toBeCloseTo(r.nodos[idDe(20)]!.ev, 12)
  })
})

describe('proyeccionAlRitmo', () => {
  // Planeada lineal: 0 el 1 de enero, 1 el 31 de enero.
  const planeada = Array.from({ length: 31 }, (_, i) => ({
    fecha: `2026-01-${String(i + 1).padStart(2, '0')}`,
    pv: i / 30,
  }))

  it('arranca en el último real y termina en el forecast', () => {
    const p = proyeccionAlRitmo(
      planeada,
      { fecha: '2026-01-16', ev: 0.25 },
      '2026-02-10',
      '2026-01-31',
    )
    expect(p[0]).toEqual({ fecha: '2026-01-16', pv: 0.25 })
    expect(p.at(-1)).toEqual({ fecha: '2026-02-10', pv: 1 })
    for (let i = 1; i < p.length; i++) {
      expect(aDia(p[i]!.fecha)).toBeGreaterThan(aDia(p[i - 1]!.fecha))
      expect(p[i]!.pv).toBeGreaterThanOrEqual(p[i - 1]!.pv)
    }
  })

  it('no proyecta un proyecto terminado ni sin forecast', () => {
    expect(
      proyeccionAlRitmo(planeada, { fecha: '2026-01-16', ev: 1 }, '2026-01-16', '2026-01-31'),
    ).toEqual([])
    expect(
      proyeccionAlRitmo(planeada, { fecha: '2026-01-16', ev: 0.2 }, null, '2026-01-31'),
    ).toEqual([])
  })
})

describe('lecturaEn', () => {
  const planeada = [
    { fecha: '2026-01-01', pv: 0 },
    { fecha: '2026-01-31', pv: 1 },
  ]
  const real = (fecha: string, ev: number) => ({
    fecha,
    pv: 0,
    ev,
    estado: 'al_dia' as const,
    vencidas: 0,
  })
  const reales = [real('2026-01-10', 0.2), real('2026-01-20', 0.4)]
  const proyeccion = [
    { fecha: '2026-01-20', pv: 0.4 },
    { fecha: '2026-02-20', pv: 1 },
  ]

  it('en un corte da sus datos', () => {
    const l = lecturaEn('2026-01-10', planeada, reales, proyeccion)
    expect(l.tipo).toBe('corte')
    expect(l.ev).toBe(0.2)
    expect(l.corte?.fecha).toBe('2026-01-10')
  })

  it('entre cortes interpola', () => {
    const l = lecturaEn('2026-01-15', planeada, reales, proyeccion)
    expect(l.tipo).toBe('entre_cortes')
    expect(l.ev).toBeCloseTo(0.3, 6)
    expect(l.pv).toBeCloseTo(14 / 30, 6)
  })

  it('antes del primer corte no hay real', () => {
    const l = lecturaEn('2026-01-05', planeada, reales, proyeccion)
    expect(l.tipo).toBe('plan')
    expect(l.ev).toBeNull()
  })

  it('después del último sigue la proyección', () => {
    const l = lecturaEn('2026-02-04', planeada, reales, proyeccion)
    expect(l.tipo).toBe('proyeccion')
    expect(l.ev).toBeCloseTo(0.4 + (0.6 * 15) / 31, 6)
    expect(l.pv).toBe(1)
  })
})
