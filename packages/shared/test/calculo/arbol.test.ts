import { describe, expect, it } from 'vitest'
import { construirArbol, recorrerHojas } from '../../src/calculo/arbol'
import type { ActividadEntrada, NodoArbol } from '../../src/calculo/tipos'
import { actividadesFixture, idDe } from './fixture'

const a = (id: string, padreId: string | null, orden: number): ActividadEntrada => ({
  id,
  padreId,
  orden,
  nombre: id,
})

function aplanar(nodos: NodoArbol[]): NodoArbol[] {
  return nodos.flatMap((n) => [n, ...aplanar(n.hijos)])
}

describe('construirArbol', () => {
  it('ordena por orden y numera por posición en tres niveles', () => {
    const raices = construirArbol([
      a('b1', 'b', 1),
      a('x', 'b1', 5),
      a('b', null, 9),
      a('a2', 'a', 7),
      a('a', null, 2),
      a('a1', 'a', 3),
    ])
    const plano = aplanar(raices)
    expect(plano.map((n) => [n.id, n.item, n.nivel])).toEqual([
      ['a', '1', 1],
      ['a1', '1.1', 2],
      ['a2', '1.2', 2],
      ['b', '2', 1],
      ['b1', '2.1', 2],
      ['x', '2.1.1', 3],
    ])
    expect(plano.filter((n) => n.esHoja).map((n) => n.id)).toEqual(['a1', 'a2', 'x'])
    expect(recorrerHojas(raices).map((n) => n.id)).toEqual(['a1', 'a2', 'x'])
  })

  it('lanza padre_inexistente si un padre no existe', () => {
    expect(() => construirArbol([a('a', 'nadie', 1)])).toThrow('padre_inexistente')
  })

  it('lanza ciclo si hay un ciclo', () => {
    expect(() => construirArbol([a('r', null, 0), a('a', 'b', 1), a('b', 'a', 2)])).toThrow('ciclo')
    expect(() => construirArbol([a('a', 'a', 1)])).toThrow('ciclo')
  })
})

describe('árbol del fixture del Excel', () => {
  const raices = construirArbol(actividadesFixture())
  const hojas = recorrerHojas(raices)

  it('tiene 3 raíces numeradas 1, 2 y 3', () => {
    expect(raices.map((r) => r.item)).toEqual(['1', '2', '3'])
  })

  it('tiene 144 hojas, 138 con peso', () => {
    expect(hojas).toHaveLength(144)
    expect(hojas.filter((h) => (h.peso ?? 0) > 0)).toHaveLength(138)
  })

  it('tiene 6 hojas sin fechas bajo 2.2', () => {
    const g22 = aplanar(raices).find((n) => n.id === idDe(168))
    expect(g22?.item).toBe('2.2')
    expect(g22?.hijos).toHaveLength(6)
    expect(g22?.hijos.every((h) => h.esHoja && !h.inicio && !h.fin)).toBe(true)
  })
})
