import { aDia, aISO } from '@charter/shared'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** `'2026-11-09'` → `'9 nov 2026'`, sin pasar por la zona horaria local. */
export function fechaCorta(iso: string): string {
  const [a, m, d] = aISO(aDia(iso.slice(0, 10))).split('-')
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`
}

/** Días calendario de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  return aDia(hasta.slice(0, 10)) - aDia(desde.slice(0, 10))
}

/** `0.1251` → `'12,5 %'`. */
export function porcentaje(fraccion: number, decimales = 1): string {
  const texto = (fraccion * 100).toLocaleString('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
  return `${texto} %`
}

/** Fecha de hoy en el navegador, `YYYY-MM-DD`. */
export function hoyISO(): string {
  const h = new Date()
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${h.getFullYear()}-${dos(h.getMonth() + 1)}-${dos(h.getDate())}`
}

/** «hace un momento», «hace 3 min», «hace 2 h»… para marcas ISO. */
export function haceRato(marca: string, ahora = Date.now()): string {
  const min = Math.floor((ahora - Date.parse(marca)) / 60_000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} días`
}
