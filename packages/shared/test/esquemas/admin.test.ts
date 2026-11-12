import { describe, expect, it } from 'vitest'
import {
  crearAreaEntrada,
  crearCategoriaEntrada,
  editarAreaEntrada,
  editarCategoriaEntrada,
  editarCuentaEntrada,
  PALETA_CATEGORIAS,
} from '../../src/esquemas/admin'

describe('editarCuentaEntrada', () => {
  it('exige al menos un campo', () => {
    expect(editarCuentaEntrada.safeParse({}).success).toBe(false)
  })

  it('rechaza claves extra', () => {
    expect(editarCuentaEntrada.safeParse({ activo: true, nombre: 'x' }).success).toBe(false)
  })

  it('acepta activo o esAdmin', () => {
    expect(editarCuentaEntrada.parse({ activo: false })).toEqual({ activo: false })
    expect(editarCuentaEntrada.parse({ esAdmin: true })).toEqual({ esAdmin: true })
  })
})

describe('PALETA_CATEGORIAS', () => {
  it('tiene 8 pares sin colores repetidos', () => {
    expect(PALETA_CATEGORIAS).toHaveLength(8)
    const colores = PALETA_CATEGORIAS.map((p) => p.color.toLowerCase())
    expect(new Set(colores).size).toBe(8)
    const fondos = PALETA_CATEGORIAS.map((p) => p.colorFondo.toLowerCase())
    expect(new Set(fondos).size).toBe(8)
  })

  it('incluye los tres ejes del Comité', () => {
    const colores = PALETA_CATEGORIAS.map((p) => p.color)
    expect(colores).toEqual(expect.arrayContaining(['#D98A00', '#6A55D8', '#0A9C9B']))
  })
})

describe('crearCategoriaEntrada', () => {
  it('acepta un color de la paleta y recorta el nombre', () => {
    const { color } = PALETA_CATEGORIAS[1]!
    expect(crearCategoriaEntrada.parse({ nombre: '  Innovación ', color })).toEqual({
      nombre: 'Innovación',
      color,
    })
  })

  it('rechaza un color fuera de la paleta', () => {
    expect(crearCategoriaEntrada.safeParse({ nombre: 'X', color: '#123456' }).success).toBe(false)
  })

  it('rechaza un nombre vacío o de solo espacios', () => {
    const { color } = PALETA_CATEGORIAS[0]!
    expect(crearCategoriaEntrada.safeParse({ nombre: '', color }).success).toBe(false)
    expect(crearCategoriaEntrada.safeParse({ nombre: '   ', color }).success).toBe(false)
    expect(crearCategoriaEntrada.safeParse({ nombre: 'x'.repeat(81), color }).success).toBe(false)
  })
})

describe('crearAreaEntrada', () => {
  it('solo necesita el nombre', () => {
    expect(crearAreaEntrada.parse({ nombre: 'Financiera' })).toEqual({ nombre: 'Financiera' })
    expect(crearAreaEntrada.safeParse({ nombre: ' ' }).success).toBe(false)
  })
})

describe('editarCategoriaEntrada y editarAreaEntrada', () => {
  it('exigen al menos un campo y son estrictas', () => {
    expect(editarCategoriaEntrada.safeParse({}).success).toBe(false)
    expect(editarAreaEntrada.safeParse({}).success).toBe(false)
    expect(editarAreaEntrada.safeParse({ color: '#D98A00' }).success).toBe(false)
  })

  it('validan orden entero no negativo y color de la paleta', () => {
    expect(editarAreaEntrada.parse({ orden: 2 })).toEqual({ orden: 2 })
    expect(editarAreaEntrada.safeParse({ orden: -1 }).success).toBe(false)
    expect(editarAreaEntrada.safeParse({ orden: 1.5 }).success).toBe(false)
    expect(editarCategoriaEntrada.parse({ color: '#D98A00', activa: false })).toEqual({
      color: '#D98A00',
      activa: false,
    })
    expect(editarCategoriaEntrada.safeParse({ color: '#000000' }).success).toBe(false)
  })
})
