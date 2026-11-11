import { describe, expect, it } from 'vitest'
import { hoyISO } from '../src/util/hoy'

describe('hoyISO', () => {
  it('da la fecha de Bogotá sin importar la zona del servidor', () => {
    // 01:00 UTC del 12 = 8 p. m. del 11 en Bogotá.
    expect(hoyISO(new Date('2026-11-12T01:00:00Z'))).toBe('2026-11-11')
    expect(hoyISO(new Date('2026-11-12T05:00:00Z'))).toBe('2026-11-12')
  })
})
