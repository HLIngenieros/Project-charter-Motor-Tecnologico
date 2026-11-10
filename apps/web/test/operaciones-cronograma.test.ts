import { construirArbol, type ActividadEntrada, type NodoArbol } from '@charter/shared'
import { describe, expect, it } from 'vitest'
import {
  agregar,
  descendientes,
  desindentar,
  editar,
  eliminar,
  indentar,
  mover,
  moverFechas,
} from '../src/pantallas/ficha/cronograma/operaciones'

/** Ítem → nombre en preorden, para comparar estructuras de un vistazo. */
function items(acts: ActividadEntrada[]): string[] {
  const salida: string[] = []
  const visitar = (n: NodoArbol) => {
    salida.push(`${n.item} ${n.nombre}`)
    n.hijos.forEach(visitar)
  }
  construirArbol(acts).forEach(visitar)
  return salida
}

const nombrar = (acts: ActividadEntrada[], id: string, nombre: string) =>
  editar(acts, id, { nombre })

/** 1 Diseño › 1.1 Maqueta › 1.1.1 Pantallas, y 2 Pruebas. */
function tresNiveles(): ActividadEntrada[] {
  let a: ActividadEntrada[] = []
  a = nombrar(agregar(a, null, 'd'), 'd', 'Diseño')
  a = nombrar(agregar(a, 'd', 'm'), 'm', 'Maqueta')
  a = indentar(a, 'm')
  a = nombrar(agregar(a, 'm', 'p'), 'p', 'Pantallas')
  a = indentar(a, 'p')
  a = nombrar(agregar(a, 'd', 't'), 't', 'Pruebas')
  return a
}

describe('operaciones del cronograma', () => {
  it('arma tres niveles con agregar e indentar', () => {
    expect(items(tresNiveles())).toEqual([
      '1 Diseño',
      '1.1 Maqueta',
      '1.1.1 Pantallas',
      '2 Pruebas',
    ])
  })

  it('agregar sin referencia va al final y con nombre vacío', () => {
    const a = agregar(tresNiveles(), null, 'n')
    expect(items(a).at(-1)).toBe('3 ')
  })

  it('indentar sin hermana anterior no cambia nada', () => {
    const a = tresNiveles()
    expect(indentar(a, 'd')).toEqual(a)
  })

  it('no indenta más allá del nivel 6', () => {
    let a: ActividadEntrada[] = agregar([], null, 'n0')
    for (let i = 1; i < 7; i++) a = indentar(agregar(a, `n${i - 1}`, `n${i}`), `n${i}`)
    // n6 quedaría en el nivel 7: se queda como hermana de n5.
    const arbol = items(a)
    expect(arbol).toHaveLength(7)
    expect(arbol.at(-1)!.startsWith('1.1.1.1.1.2 ')).toBe(true)
  })

  it('desindentar saca la hija y la deja después de su padre', () => {
    expect(items(desindentar(tresNiveles(), 'p'))).toEqual([
      '1 Diseño',
      '1.1 Maqueta',
      '1.2 Pantallas',
      '2 Pruebas',
    ])
    const a = tresNiveles()
    expect(desindentar(a, 'd')).toEqual(a)
  })

  it('mover cambia el orden entre hermanas y no sale de los extremos', () => {
    expect(items(mover(tresNiveles(), 't', -1))[0]).toBe('1 Pruebas')
    const a = tresNiveles()
    expect(mover(a, 'd', -1)).toEqual(a)
  })

  it('eliminar quita la actividad y todas sus descendientes', () => {
    expect(descendientes(tresNiveles(), 'd').sort()).toEqual(['m', 'p'])
    expect(items(eliminar(tresNiveles(), 'd'))).toEqual(['1 Pruebas'])
  })

  it('renumera el orden sin huecos', () => {
    const a = eliminar(tresNiveles(), 'd')
    const raices = a.filter((x) => x.padreId === null).map((x) => x.orden)
    expect(raices).toEqual([0])
  })
})

describe('moverFechas', () => {
  const barra = (): ActividadEntrada[] => [
    { id: 'a', padreId: null, orden: 0, nombre: 'A', inicio: '2026-03-10', fin: '2026-03-11' },
  ]

  it('mueve la barra completa', () => {
    expect(moverFechas(barra(), 'a', 3, 'ambos')[0]).toMatchObject({
      inicio: '2026-03-13',
      fin: '2026-03-14',
    })
  })

  it('cambia solo un extremo y nunca deja el fin antes del inicio', () => {
    expect(moverFechas(barra(), 'a', 3, 'fin')[0]!.fin).toBe('2026-03-14')
    expect(moverFechas(barra(), 'a', -5, 'fin')[0]).toMatchObject({
      inicio: '2026-03-10',
      fin: '2026-03-10',
    })
    expect(moverFechas(barra(), 'a', 5, 'inicio')[0]!.inicio).toBe('2026-03-11')
  })

  it('sin fechas no cambia nada', () => {
    const a: ActividadEntrada[] = [{ id: 'a', padreId: null, orden: 0, nombre: 'A' }]
    expect(moverFechas(a, 'a', 3, 'ambos')).toEqual(a)
  })
})
