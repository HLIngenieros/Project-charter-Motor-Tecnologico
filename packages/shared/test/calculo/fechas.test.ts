import { afterAll, describe, expect, it } from 'vitest'
import { aDia, aISO, sumarDias } from '../../src/calculo/fechas'

const zonaOriginal = process.env.TZ

function todosLosDias(desde: string, hasta: string): string[] {
  const dias: string[] = []
  const d = new Date(`${desde}T00:00:00Z`)
  const fin = new Date(`${hasta}T00:00:00Z`)
  while (d <= fin) {
    dias.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return dias
}

describe.each([undefined, 'America/Bogota', 'Pacific/Kiritimati'])('fechas con TZ=%s', (zona) => {
  afterAll(() => {
    process.env.TZ = zonaOriginal
  })

  it('cuenta días desde 1970-01-01', () => {
    if (zona) process.env.TZ = zona
    expect(aDia('1970-01-01')).toBe(0)
    expect(aDia('1970-01-02')).toBe(1)
    expect(aDia('2025-03-13') - aDia('2025-03-12')).toBe(1)
  })

  it('ida y vuelta para cada día de 2023 a 2026, incluido el 29 de febrero', () => {
    if (zona) process.env.TZ = zona
    const dias = todosLosDias('2023-01-01', '2026-12-31')
    expect(dias).toContain('2024-02-29')
    for (const x of dias) expect(aISO(aDia(x))).toBe(x)
    expect(aDia('2026-12-31') - aDia('2023-01-01')).toBe(dias.length - 1)
  })

  it('suma días cruzando meses y años bisiestos', () => {
    if (zona) process.env.TZ = zona
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29')
    expect(sumarDias('2024-02-29', 1)).toBe('2024-03-01')
    expect(sumarDias('2025-12-31', 1)).toBe('2026-01-01')
    expect(sumarDias('2025-03-01', -1)).toBe('2025-02-28')
  })
})
