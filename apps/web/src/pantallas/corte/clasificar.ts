import { aDia, type FechaISO } from '@charter/shared'

interface Fechas {
  id: string
  inicio?: FechaISO | null
  fin?: FechaISO | null
}

export interface Clasificacion<T> {
  vencidas: T[]
  enCurso: T[]
  resto: T[]
}

/**
 * Reparte las hojas del corte según lo que toca a la fecha: vencidas (fin antes de la fecha
 * y sin llegar al 100 %), en curso (la fecha cae entre inicio y fin, sin el 100 %) y el resto.
 * Cada grupo conserva el orden recibido.
 */
export function clasificarHojas<T extends Fechas>(
  hojas: T[],
  pcts: Record<string, number>,
  fecha: FechaISO,
): Clasificacion<T> {
  const t = aDia(fecha)
  const grupos: Clasificacion<T> = { vencidas: [], enCurso: [], resto: [] }
  for (const h of hojas) {
    const completa = (pcts[h.id] ?? 0) >= 1
    if (completa || !h.inicio || !h.fin) grupos.resto.push(h)
    else if (aDia(h.fin) < t) grupos.vencidas.push(h)
    else if (aDia(h.inicio) <= t) grupos.enCurso.push(h)
    else grupos.resto.push(h)
  }
  return grupos
}
