import type { FechaISO } from './tipos'

const MS_DIA = 86_400_000
const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/

/** Días transcurridos desde 1970-01-01, sin depender de la zona horaria. */
export function aDia(f: FechaISO): number {
  const m = FORMATO.exec(f)
  if (!m) throw new Error(`fecha_invalida: ${f}`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_DIA
}

/** Inverso de aDia. */
export function aISO(dia: number): FechaISO {
  return new Date(dia * MS_DIA).toISOString().slice(0, 10)
}

export function sumarDias(f: FechaISO, n: number): FechaISO {
  return aISO(aDia(f) + n)
}
