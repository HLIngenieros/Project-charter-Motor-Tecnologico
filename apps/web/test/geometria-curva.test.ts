import { aDia, type PuntoReal } from '@charter/shared'
import { describe, expect, it } from 'vitest'
import {
  dominio,
  escalaX,
  escalaY,
  estadoPorBrecha,
  tramosBrecha,
  trazo,
} from '../src/pantallas/ficha/curva/geometria'

const planeada = [
  { fecha: '2026-01-01', pv: 0 },
  { fecha: '2026-03-01', pv: 0.5 },
  { fecha: '2026-06-30', pv: 1 },
]
const real = (fecha: string, pv: number, ev: number): PuntoReal => ({
  fecha,
  pv,
  ev,
  estado: 'en_atencion',
  vencidas: 0,
})

describe('geometría de la curva S', () => {
  it('el zoom «cortes» con un solo corte mide al menos 42 días', () => {
    const d = dominio(planeada, [real('2026-02-01', 0.25, 0.2)], [], 'cortes')
    expect(d.hasta - d.desde).toBeGreaterThanOrEqual(42)
    expect(d.desde).toBeLessThanOrEqual(aDia('2026-02-01') - 14)
  })

  it('el zoom «cortes» acerca el eje Y: el máximo visible + 10 puntos, sin pasar de 1', () => {
    const d = dominio(planeada, [real('2026-02-01', 0.25, 0.2)], [], 'cortes')
    expect(d.techo).toBeGreaterThanOrEqual(0.35)
    expect(d.techo).toBeLessThan(0.6)
    const lleno = dominio(planeada, [real('2026-06-30', 1, 0.98)], [], 'cortes')
    expect(lleno.techo).toBe(1)
  })

  it('el zoom «proyecto» cubre la planeada y la proyección, con techo 1', () => {
    const proy = [
      { fecha: '2026-02-01', pv: 0.2 },
      { fecha: '2026-08-01', pv: 1 },
    ]
    const d = dominio(planeada, [real('2026-02-01', 0.25, 0.2)], proy, 'proyecto')
    expect(d.desde).toBeLessThanOrEqual(aDia('2026-01-01'))
    expect(d.hasta).toBeGreaterThanOrEqual(aDia('2026-08-01'))
    expect(d.techo).toBe(1)
  })

  it('escalaX lleva desde a 0 y hasta al ancho; escalaY, 0 abajo y el techo arriba', () => {
    const d = { desde: aDia('2026-01-01'), hasta: aDia('2026-01-11'), techo: 0.5 }
    const x = escalaX(d, 500)
    expect(x('2026-01-01')).toBe(0)
    expect(x('2026-01-11')).toBe(500)
    expect(x('2026-01-06')).toBe(250)
    const y = escalaY(d, 200)
    expect(y(0)).toBe(200)
    expect(y(0.5)).toBe(0)
  })

  it('trazo une los puntos', () => {
    expect(
      trazo([
        { x: 0, y: 100 },
        { x: 50, y: 0 },
      ]),
    ).toBe('M0 100 L50 0')
    expect(trazo([])).toBe('')
  })

  it('tramosBrecha: un tramo por corte, con el estado del corte que lo cierra', () => {
    const t = tramosBrecha(planeada, [
      { ...real('2026-02-01', 0.25, 0.2), estado: 'al_dia' },
      { ...real('2026-03-01', 0.5, 0.3), estado: 'en_riesgo' },
    ])
    expect(t).toEqual([
      { desde: '2026-01-01', hasta: '2026-02-01', estado: 'al_dia' },
      { desde: '2026-02-01', hasta: '2026-03-01', estado: 'en_riesgo' },
    ])
  })

  it('estadoPorBrecha usa los umbrales', () => {
    const u = { atencion: 10, riesgo: 25, atraso: 50 }
    expect(estadoPorBrecha(0.3, 0.25, u)).toBe('al_dia')
    expect(estadoPorBrecha(0.5, 0.3, u)).toBe('en_atencion')
    expect(estadoPorBrecha(0.6, 0.3, u)).toBe('en_riesgo')
    expect(estadoPorBrecha(0.9, 0.3, u)).toBe('atrasada')
    expect(estadoPorBrecha(1, 1, u)).toBe('terminada')
  })
})
