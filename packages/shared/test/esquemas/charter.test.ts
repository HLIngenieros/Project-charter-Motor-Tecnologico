import { describe, expect, it } from 'vitest'
import { charterCrear, charterEditar, listaEntrada } from '../../src/esquemas/charter'

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.error?.issues.map((i) => i.message) ?? []
}

describe('charterCrear', () => {
  it('recorta el nombre', () => {
    expect(charterCrear.parse({ nombre: '  Plan TI  ' }).nombre).toBe('Plan TI')
  })

  it('rechaza un nombre vacío con un mensaje claro', () => {
    const r = charterCrear.safeParse({ nombre: '   ' })
    expect(r.success).toBe(false)
    expect(mensajes(r)).toContain('Escribe el nombre del charter')
  })

  it('rechaza un nombre de más de 200 caracteres', () => {
    expect(charterCrear.safeParse({ nombre: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('charterEditar', () => {
  it('convierte el código vacío en null', () => {
    expect(charterEditar.parse({ codigo: '' }).codigo).toBeNull()
  })

  it('exige al menos un campo', () => {
    const r = charterEditar.safeParse({})
    expect(r.success).toBe(false)
    expect(mensajes(r)).toContain('No hay cambios para guardar')
  })

  it('rechaza campos que no se pueden editar', () => {
    expect(charterEditar.safeParse({ propietarioId: 'x' }).success).toBe(false)
  })

  it('rechaza un estado desconocido', () => {
    expect(charterEditar.safeParse({ estado: 'borrador' }).success).toBe(false)
  })

  it('rechaza un nombre vacío', () => {
    const r = charterEditar.safeParse({ nombre: ' ' })
    expect(mensajes(r)).toContain('Escribe el nombre del charter')
  })
})

describe('listaEntrada', () => {
  const items = (n: number) => Array.from({ length: n }, (_, i) => ({ texto: `Ítem ${i}` }))

  it('acepta hasta 50 ítems', () => {
    expect(listaEntrada.safeParse({ items: items(50) }).success).toBe(true)
    expect(listaEntrada.safeParse({ items: items(51) }).success).toBe(false)
  })

  it('rechaza un ítem vacío', () => {
    expect(listaEntrada.safeParse({ items: [{ texto: ' ' }] }).success).toBe(false)
  })
})
