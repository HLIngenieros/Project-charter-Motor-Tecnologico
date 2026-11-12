import { aDia, aISO } from '@charter/shared'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Una marca ISO (`…T…Z`) pasa a la fecha local; una fecha `YYYY-MM-DD` queda igual. */
function dia(iso: string): string {
  return iso.length > 10 ? fechaLocal(new Date(iso)) : iso
}

function fechaLocal(f: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`
}

/** `'2026-11-09'` → `'9 nov 2026'`; las fechas no pasan por la zona horaria. */
export function fechaCorta(iso: string): string {
  const [a, m, d] = aISO(aDia(dia(iso))).split('-')
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`
}

/** Días calendario de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  return aDia(dia(hasta)) - aDia(dia(desde))
}

/** `0.1251` → `'12,5 %'`. */
export function porcentaje(fraccion: number, decimales = 1): string {
  const texto = (fraccion * 100).toLocaleString('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
  return `${texto} %`
}

/** Brecha en puntos porcentuales: `0.175` → `'17,5 pts'`. */
export function puntos(fraccion: number): string {
  return porcentaje(Math.abs(fraccion)).replace(' %', ' pts')
}

/** Pesos colombianos sin decimales: `182000000` → `'182.000.000'`. */
export function pesos(n: number): string {
  return Math.round(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

/** `'182.000.000'` o `'182000000'` → `182000000`; vacío → `0`; inválido → `null`. */
export function leerPesos(texto: string): number | null {
  const limpio = texto.replace(/[\s.$]/g, '').replace(/^COP/i, '')
  if (limpio === '') return 0
  return /^\d+$/.test(limpio) ? Number(limpio) : null
}

/** Fecha de hoy en el navegador, `YYYY-MM-DD`. */
export function hoyISO(): string {
  return fechaLocal(new Date())
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
