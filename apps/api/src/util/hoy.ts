import type { FechaISO } from '@charter/shared'

/** 'en-CA' formatea como 'YYYY-MM-DD'. */
const formatoBogota = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha de hoy en Bogotá, en 'YYYY-MM-DD', sin depender de la zona del servidor. */
export function hoyISO(ahora = new Date()): FechaISO {
  return formatoBogota.format(ahora)
}
