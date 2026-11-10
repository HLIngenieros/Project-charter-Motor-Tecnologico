import { describe, expect, it } from 'vitest'
import { corteEntrada, cronogramaEntrada } from '../../src/esquemas/cronograma'

function mensajes(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.error?.issues.map((i) => i.message) ?? []
}

const act = (i: number) => ({ id: `a${i}`, padreId: null, orden: i, nombre: `A ${i}` })

describe('cronogramaEntrada', () => {
  it('acepta un cronograma con versión', () => {
    const r = cronogramaEntrada.parse({ version: 0, actividades: [act(1)] })
    expect(r.actividades).toHaveLength(1)
  })

  it('rechaza más de 500 actividades', () => {
    const actividades = Array.from({ length: 501 }, (_, i) => act(i))
    const r = cronogramaEntrada.safeParse({ version: 0, actividades })
    expect(r.success).toBe(false)
    expect(mensajes(r)).toContain('El cronograma admite hasta 500 actividades')
  })

  it('rechaza más de 5 responsables', () => {
    const responsables = ['a', 'b', 'c', 'd', 'e', 'f']
    const r = cronogramaEntrada.safeParse({
      version: 0,
      actividades: [{ ...act(1), responsables }],
    })
    expect(r.success).toBe(false)
  })

  it('rechaza una versión negativa o decimal', () => {
    expect(cronogramaEntrada.safeParse({ version: -1, actividades: [] }).success).toBe(false)
    expect(cronogramaEntrada.safeParse({ version: 1.5, actividades: [] }).success).toBe(false)
  })
})

describe('corteEntrada', () => {
  it('pone la nota vacía por defecto y la recorta', () => {
    expect(corteEntrada.parse({ avances: [] }).nota).toBe('')
    expect(corteEntrada.parse({ nota: '  ok ', avances: [] }).nota).toBe('ok')
  })

  it('rechaza un % fuera de 0–1', () => {
    const r = corteEntrada.safeParse({ avances: [{ actividadId: 'a', pct: 1.2 }] })
    expect(r.success).toBe(false)
  })

  it('rechaza campos extra', () => {
    expect(corteEntrada.safeParse({ avances: [], fecha: '2026-01-01' }).success).toBe(false)
  })

  it('rechaza una nota de más de 2000 caracteres', () => {
    expect(corteEntrada.safeParse({ nota: 'x'.repeat(2001), avances: [] }).success).toBe(false)
  })
})
