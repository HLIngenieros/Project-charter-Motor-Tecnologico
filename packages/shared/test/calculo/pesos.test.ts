import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma } from '../../src/calculo/cronograma'
import { aPesosRelativos } from '../../src/calculo/pesos'
import { pesosCompletos, pesosEfectivos, REGLAS_POR_DEFECTO } from '../../src/calculo/reglas'
import type { ActividadEntrada } from '../../src/calculo/tipos'

const F = { inicio: '2026-01-05', fin: '2026-01-16' }

let orden = 0
function act(id: string, padreId: string | null, peso: number | null, fechas = true) {
  return {
    id,
    padreId,
    orden: orden++,
    nombre: id,
    responsables: [],
    peso,
    ...(fechas ? F : {}),
  } satisfies ActividadEntrada
}

/** Grupo A 0,3 (hojas 0,4 y 0,6) y grupo B 0,7 (una hoja de 1). */
const base = (): ActividadEntrada[] => [
  act('A', null, 0.3, false),
  act('a1', 'A', 0.4),
  act('a2', 'A', 0.6),
  act('B', null, 0.7, false),
  act('b1', 'B', 1),
]

const cerca = (x: number | undefined, y: number) => expect(x).toBeCloseTo(y, 9)

describe('pesos relativos', () => {
  it('el global de una hoja es el producto de los relativos', () => {
    const p = pesosEfectivos(construirArbol(base()), 'fuera')
    cerca(p.a1!.peso, 0.12)
    cerca(p.a2!.peso, 0.18)
    cerca(p.b1!.peso, 0.7)
    cerca(p.a1!.relativo, 0.4)
    cerca(p.b1!.relativo, 1)
    cerca(p.A!.peso, 0.3)
  })

  it('repartir reparte entre hermanas lo que les falta', () => {
    const acts = [
      act('G', null, 0.5, false),
      act('g1', 'G', 0.2),
      act('g2', 'G', null),
      act('g3', 'G', null),
      act('H', null, 0.5),
    ]
    const p = pesosEfectivos(construirArbol(acts), 'repartir')
    cerca(p.g2!.relativo, 0.4)
    expect(p.g2!.auto).toBe(true)
    cerca(p.g2!.peso, 0.2)
  })

  it('un grupo sin peso con repartir recibe su parte y sus hojas se reparten su 100 %', () => {
    const acts = [
      act('G', null, null, false),
      act('g1', 'G', null),
      act('g2', 'G', null),
      act('H', null, null, false),
      act('h1', 'H', null),
    ]
    const p = pesosEfectivos(construirArbol(acts), 'repartir')
    cerca(p.G!.relativo, 0.5)
    cerca(p.g1!.relativo, 0.5)
    cerca(p.g1!.peso, 0.25)
    cerca(p.h1!.peso, 0.5)
  })

  it('un 0 escrito excluye y no recibe reparto', () => {
    const acts = [act('a', null, 0), act('b', null, null), act('c', null, 0.4)]
    const p = pesosEfectivos(construirArbol(acts), 'repartir')
    expect(p.a!.peso).toBe(0)
    cerca(p.b!.peso, 0.6)
  })

  it('pesosCompletos exige 100 % en cada grupo, no solo en el primer nivel', () => {
    const incompleto = base().map((a) => (a.id === 'a2' ? { ...a, peso: 0.5 } : a))
    expect(pesosCompletos(construirArbol(incompleto), REGLAS_POR_DEFECTO)).toBe(false)
    expect(pesosCompletos(construirArbol(base()), REGLAS_POR_DEFECTO)).toBe(true)
  })

  it('el resultado trae el peso relativo y el global', () => {
    const r = calcularCronograma(construirArbol(base()), {}, '2026-01-10')
    cerca(r.nodos.a1!.pesoRelativo, 0.4)
    cerca(r.nodos.a1!.peso, 0.12)
    cerca(r.nodos.A!.pesoRelativo, 0.3)
  })
})

describe('aPesosRelativos', () => {
  const globales = (): ActividadEntrada[] => [
    act('A', null, null, false),
    act('a1', 'A', 0.12),
    act('a2', 'A', 0.18),
    act('B', null, null, false),
    act('b1', 'B', 0.7),
  ]

  it('convierte pesos globales de hojas a relativos', () => {
    const r = Object.fromEntries(aPesosRelativos(globales()).map((a) => [a.id, a.peso]))
    cerca(r.A!, 0.3)
    cerca(r.a1!, 0.4)
    cerca(r.a2!, 0.6)
    cerca(r.B!, 0.7)
    cerca(r.b1!, 1)
  })

  it('ignora el peso que traía una agrupadora y deja vacías las hojas vacías', () => {
    const acts = [
      act('A', null, 0.9, false),
      act('a1', 'A', 0.5),
      act('a2', 'A', null),
      act('V', null, 0.1, false),
      act('v1', 'V', null),
    ]
    const r = Object.fromEntries(aPesosRelativos(acts).map((a) => [a.id, a.peso]))
    cerca(r.A!, 0.5)
    cerca(r.a1!, 1)
    expect(r.a2).toBeNull()
    expect(r.V).toBeNull()
    expect(r.v1).toBeNull()
  })

  it('anidado: el global de cada hoja se conserva', () => {
    const acts = [
      act('A', null, null, false),
      act('A1', 'A', null, false),
      act('x', 'A1', 0.1),
      act('y', 'A1', 0.3),
      act('z', 'A', 0.6),
    ]
    const rel = aPesosRelativos(acts)
    const p = pesosEfectivos(construirArbol(rel), 'fuera')
    cerca(p.x!.peso, 0.1)
    cerca(p.y!.peso, 0.3)
    cerca(p.z!.peso, 0.6)
  })
})
