import { describe, expect, it } from 'vitest'
import { construirArbol, recorrerHojas } from '../../src/calculo/arbol'
import {
  hojasProgramadas,
  raicesDeFoto,
  terminacionesPorHoja,
  totalesDeFoto,
} from '../../src/calculo/cortes'
import { actividadesFixture, fixture, idDe } from './fixture'

describe('totalesDeFoto', () => {
  it('reproduce el 12,51 % / 12,47 % del Excel con la foto de las hojas', () => {
    const hojas = recorrerHojas(construirArbol(actividadesFixture()))
    const foto = hojas.map((h) => ({
      actividadId: h.id,
      item: h.item,
      nombre: h.nombre,
      pct: fixture.filas.find((f) => idDe(f.fila) === h.id)!.esperado.L ?? 0,
      peso: h.peso ?? null,
      inicio: h.inicio ?? null,
      fin: h.fin ?? null,
    }))
    const r = totalesDeFoto(foto, fixture.corte)
    expect(r.pv).toBeCloseTo(0.1251, 4)
    expect(r.ev).toBeCloseTo(0.1247, 4)
  })

  it('marca terminada una hoja con su fecha de terminación', () => {
    const foto = [
      {
        actividadId: 'a',
        item: '1',
        nombre: 'A',
        pct: 1,
        peso: 1,
        inicio: '2026-01-01',
        fin: '2026-01-31',
      },
    ]
    const r = totalesDeFoto(foto, '2026-03-01', { a: '2026-01-20' })
    expect(r.ev).toBe(1)
    expect(r.estado).toBe('terminada')
  })
})

describe('terminacionesPorHoja', () => {
  it('toma el primer corte en que la hoja llegó al 100 %', () => {
    const cortes = [
      { fecha: '2025-04-01', avances: [{ actividadId: 'a', pct: 1 }] },
      { fecha: '2025-02-01', avances: [{ actividadId: 'a', pct: 0.5 }] },
      { fecha: '2025-03-01', avances: [{ actividadId: 'a', pct: 1 }] },
    ]
    expect(terminacionesPorHoja(cortes)).toEqual({ a: '2025-03-01' })
  })

  it('no incluye hojas que nunca llegaron al 100 %', () => {
    expect(
      terminacionesPorHoja([{ fecha: '2025-02-01', avances: [{ actividadId: 'a', pct: 0.9 }] }]),
    ).toEqual({})
  })
})

describe('hojasProgramadas', () => {
  it('excluye hojas sin peso, sin fechas o con fin antes del inicio', () => {
    const raices = construirArbol([
      { id: 'g', padreId: null, orden: 0, nombre: 'Grupo' },
      {
        id: 'ok',
        padreId: 'g',
        orden: 0,
        nombre: 'Ok',
        peso: 0.5,
        inicio: '2026-01-01',
        fin: '2026-01-10',
      },
      {
        id: 'sinPeso',
        padreId: 'g',
        orden: 1,
        nombre: 'Sin peso',
        inicio: '2026-01-01',
        fin: '2026-01-10',
      },
      { id: 'sinFin', padreId: 'g', orden: 2, nombre: 'Sin fin', peso: 0.2, inicio: '2026-01-01' },
      {
        id: 'invertida',
        padreId: null,
        orden: 1,
        nombre: 'Invertida',
        peso: 0.3,
        inicio: '2026-02-10',
        fin: '2026-02-01',
      },
    ])
    expect(hojasProgramadas(raices).map((h) => h.id)).toEqual(['ok'])
  })
})

describe('raicesDeFoto', () => {
  it('pone cada fila como hoja suelta', () => {
    const foto = [
      {
        actividadId: 'a',
        item: '1.1',
        nombre: 'A',
        pct: 0.5,
        peso: 0.4,
        inicio: '2026-01-01',
        fin: '2026-01-31',
      },
      {
        actividadId: 'b',
        item: '1.2',
        nombre: 'B',
        pct: 0,
        peso: 0.6,
        inicio: '2026-02-01',
        fin: '2026-02-28',
      },
    ]
    const raices = raicesDeFoto(foto)
    expect(raices).toHaveLength(2)
    expect(raices.every((r) => r.esHoja && r.nivel === 1)).toBe(true)
    expect(raices.map((r) => r.id)).toEqual(['a', 'b'])
    expect(raices[1]!.peso).toBe(0.6)
  })
})
