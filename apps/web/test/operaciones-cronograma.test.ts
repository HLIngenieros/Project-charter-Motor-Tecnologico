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
  cambiarFechas,
  correrDebajo,
  duracion,
  fijarDias,
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
    expect(moverFechas(barra(), 'a', 3, 'ambos').acts[0]).toMatchObject({
      inicio: '2026-03-13',
      fin: '2026-03-14',
    })
  })

  it('cambia solo un extremo y nunca deja el fin antes del inicio', () => {
    expect(moverFechas(barra(), 'a', 3, 'fin').acts[0]!.fin).toBe('2026-03-14')
    expect(moverFechas(barra(), 'a', -5, 'fin').acts[0]).toMatchObject({
      inicio: '2026-03-10',
      fin: '2026-03-10',
    })
    expect(moverFechas(barra(), 'a', 5, 'inicio').acts[0]!.inicio).toBe('2026-03-11')
  })

  it('sin fechas no cambia nada', () => {
    const a: ActividadEntrada[] = [{ id: 'a', padreId: null, orden: 0, nombre: 'A' }]
    expect(moverFechas(a, 'a', 3, 'ambos').acts).toEqual(a)
  })
})

describe('fechas encadenadas en días hábiles', () => {
  // Lun 2026-11-23 a vie 2026-11-27, y dos hojas de abajo (una dentro de un grupo).
  const plan = (): ActividadEntrada[] => [
    { id: 'a', padreId: null, orden: 0, nombre: 'A', inicio: '2026-11-23', fin: '2026-11-27' },
    { id: 'g', padreId: null, orden: 1, nombre: 'G' },
    { id: 'b', padreId: 'g', orden: 0, nombre: 'B', inicio: '2026-11-30', fin: '2026-12-04' },
    { id: 'x', padreId: 'g', orden: 1, nombre: 'Sin fechas' },
    { id: 'c', padreId: null, orden: 2, nombre: 'C', inicio: '2026-12-07', fin: '2026-12-08' },
  ]
  const de = (acts: ActividadEntrada[], id: string) => acts.find((a) => a.id === id)!

  it('duracion cuenta días hábiles con inicio y fin', () => {
    expect(duracion(de(plan(), 'a'))).toBe(5)
    expect(duracion(de(plan(), 'x'))).toBeNull()
  })

  it('una actividad nueva arranca el día hábil siguiente a su predecesora y dura 5 días', () => {
    const r = agregar(plan(), 'a', 'n')
    expect(de(r, 'n')).toMatchObject({ inicio: '2026-11-30', fin: '2026-12-04' })
  })

  it('debajo de un grupo, la predecesora es la última hoja con fechas antes de ella', () => {
    const r = agregar(plan(), 'x', 'n')
    expect(de(r, 'n')).toMatchObject({ inicio: '2026-12-07', fin: '2026-12-11' })
  })

  it('sin predecesora con fechas, la nueva queda sin fechas', () => {
    const r = agregar([{ id: 'v', padreId: null, orden: 0, nombre: 'V' }], 'v', 'n')
    expect(de(r, 'n').inicio ?? null).toBeNull()
  })

  it('mover el fin una semana corre lo de abajo 5 días hábiles y conserva su duración', () => {
    const r = cambiarFechas(plan(), 'a', { fin: '2026-12-04' })
    expect(r).toMatchObject({ corridas: 2, delta: 5 })
    expect(de(r.acts, 'b')).toMatchObject({ inicio: '2026-12-07', fin: '2026-12-11' })
    expect(de(r.acts, 'c')).toMatchObject({ inicio: '2026-12-14', fin: '2026-12-15' })
    expect(de(r.acts, 'x').inicio ?? null).toBeNull()
  })

  it('mover el fin hacia atrás corre con delta negativo', () => {
    const r = cambiarFechas(plan(), 'a', { fin: '2026-11-26' })
    expect(r).toMatchObject({ corridas: 2, delta: -1 })
    expect(de(r.acts, 'b')).toMatchObject({ inicio: '2026-11-27', fin: '2026-12-03' })
  })

  it('cambiar solo el inicio no corre nada', () => {
    const r = cambiarFechas(plan(), 'b', { inicio: '2026-11-25' })
    expect(r.corridas).toBe(0)
    expect(de(r.acts, 'c').inicio).toBe('2026-12-07')
  })

  it('un fin movido de viernes a sábado no corre nada', () => {
    const r = cambiarFechas(plan(), 'a', { fin: '2026-11-28' })
    expect(r).toMatchObject({ corridas: 0, delta: 0 })
    expect(de(r.acts, 'a').fin).toBe('2026-11-28')
  })

  it('fijarDias recalcula el fin desde el inicio y corre lo de abajo', () => {
    const r = fijarDias(plan(), 'b', 10)
    expect(de(r.acts, 'b').fin).toBe('2026-12-11')
    expect(r).toMatchObject({ corridas: 1, delta: 5 })
    expect(fijarDias(plan(), 'b', 0).corridas).toBe(0)
    expect(fijarDias(plan(), 'x', 3).acts).toEqual(plan())
  })

  it('correrDebajo mueve solo las hojas con fechas de abajo', () => {
    const r = correrDebajo(plan(), 'b', 2)
    expect(r.corridas).toBe(1)
    expect(de(r.acts, 'c')).toMatchObject({ inicio: '2026-12-09', fin: '2026-12-10' })
    expect(de(r.acts, 'a').inicio).toBe('2026-11-23')
  })

  it('arrastrar la barra completa corre lo de abajo; el extremo de inicio no', () => {
    expect(moverFechas(plan(), 'a', 7, 'ambos')).toMatchObject({ corridas: 2, delta: 5 })
    expect(moverFechas(plan(), 'b', -2, 'inicio').corridas).toBe(0)
  })
})
