import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma } from '../../src/calculo/cronograma'
import { avancePorGrupo, curvaSPlaneada, curvaSReal } from '../../src/calculo/curvas'
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
