import { describe, expect, it } from 'vitest'
import { construirArbol, recorrerHojas } from '../../src/calculo/arbol'
import { calcularCronograma, type AvancesPorHoja } from '../../src/calculo/cronograma'
import { actividadesFixture, fixture, idDe } from './fixture'

describe('aceptación contra la hoja ID & TI del Excel', () => {
  const raices = construirArbol(actividadesFixture())
  const avances: AvancesPorHoja = Object.fromEntries(
    fixture.filas.map((f) => [idDe(f.fila), { pct: f.esperado.L ?? 0 }]),
  )
  const r = calcularCronograma(raices, avances, fixture.corte)
  const programadas = recorrerHojas(raices).filter((h) => r.nodos[h.id]!.estado !== 'sin_programar')

  it('el proyecto da 12,51 % planeado y 12,47 % real al 2025-03-13', () => {
    expect(fixture.corte).toBe('2025-03-13')
    expect(r.proyecto.pv).toBeCloseTo(0.1251, 4)
    expect(r.proyecto.ev).toBeCloseTo(0.1247, 4)
  })

  it('cada hoja programada reproduce la columna K', () => {
    expect(programadas).toHaveLength(138)
    for (const h of programadas) {
      const fila = fixture.filas.find((f) => idDe(f.fila) === h.id)!
      expect(r.nodos[h.id]!.pv, `fila ${fila.fila}`).toBeCloseTo(fila.esperado.K!, 9)
    }
  })

  it('las 6 hojas de 2.2 quedan sin programar', () => {
    const hijas = fixture.filas.filter((f) => f.padreFila === 168)
    expect(hijas).toHaveLength(6)
    for (const f of hijas) expect(r.nodos[idDe(f.fila)]!.estado).toBe('sin_programar')
    expect(r.nodos[idDe(168)]!.estado).toBe('sin_programar')
  })
})
