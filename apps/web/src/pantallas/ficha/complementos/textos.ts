import type { OperadorMeta } from '@charter/shared'

export const SIMBOLO_OPERADOR: Record<OperadorMeta, string> = { '>=': '≥', '<=': '≤', '=': '=' }

/** Meta de un indicador en una línea: «≥ 90 %», «≤ 72 horas»; sin valor, «Sin meta». */
export function textoMeta(operador: OperadorMeta, valor: number | null, unidad: string): string {
  if (valor === null) return 'Sin meta'
  const cifra = valor.toLocaleString('es-CO', { maximumFractionDigits: 4 })
  return [SIMBOLO_OPERADOR[operador], cifra, unidad.trim()].filter(Boolean).join(' ')
}
