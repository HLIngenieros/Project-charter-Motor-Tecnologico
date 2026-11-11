import type { FechaISO } from './tipos'

const MS_DIA = 86_400_000
const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/

/** Días transcurridos desde 1970-01-01, sin depender de la zona horaria. */
export function aDia(f: FechaISO): number {
  const m = FORMATO.exec(f)
  if (!m) throw new Error(`fecha_invalida: ${f}`)
  const dia = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_DIA
  // Date.UTC desborda las fechas inexistentes (2025-02-30 → 2025-03-02): se rechazan.
  if (aISO(dia) !== f) throw new Error(`fecha_invalida: ${f}`)
  return dia
}

/** Inverso de aDia. */
export function aISO(dia: number): FechaISO {
  return new Date(dia * MS_DIA).toISOString().slice(0, 10)
}

export function sumarDias(f: FechaISO, n: number): FechaISO {
  return aISO(aDia(f) + n)
}

/** Hábiles antes de cada resto de semana; el día 0 (1970-01-01) fue jueves. */
const HABILES_PREFIJO = [0, 1, 2, 2, 2, 3, 4]

/** Días hábiles (lunes a viernes) en [0, dia), contados desde el día 0. */
function habilesAntes(dia: number): number {
  const semanas = Math.floor(dia / 7)
  return semanas * 5 + HABILES_PREFIJO[dia - semanas * 7]!
}

/** true si el número de día cae de lunes a viernes. */
export function esHabil(dia: number): boolean {
  const resto = (((dia + 4) % 7) + 7) % 7 // 0 = domingo
  return resto !== 0 && resto !== 6
}

/** Días hábiles entre dos números de día, ambos incluidos; 0 si `hasta < desde`. */
export function diasHabiles(desde: number, hasta: number): number {
  return hasta < desde ? 0 : habilesAntes(hasta + 1) - habilesAntes(desde)
}

/** Avanza (o retrocede, con `n` negativo) `n` días hábiles desde `dia`. */
export function sumarHabiles(dia: number, n: number): number {
  const paso = n < 0 ? -1 : 1
  let d = dia
  for (let k = 0; k < Math.abs(n);) {
    d += paso
    if (esHabil(d)) k++
  }
  return d
}
