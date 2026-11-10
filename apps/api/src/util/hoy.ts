import type { FechaISO } from '@charter/shared'

/** Fecha de hoy según el reloj local del servidor, en 'YYYY-MM-DD'. */
export function hoyISO(ahora = new Date()): FechaISO {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
}
