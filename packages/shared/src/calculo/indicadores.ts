export interface Meta {
  operador: '>=' | '<=' | '='
  valor: number
}

export type EstadoIndicador = 'verde' | 'atencion' | 'rojo'

const UMBRAL_ATENCION = 0.8

/** Cumplimiento de un indicador frente a su meta, con tope en 1. */
export function cumplimientoIndicador(
  meta: Meta,
  valor: number,
): { pct: number; estado: EstadoIndicador } {
  let pct: number
  if (meta.operador === '=') {
    pct = valor === meta.valor ? 1 : 0
  } else {
    const [numerador, divisor] = meta.operador === '>=' ? [valor, meta.valor] : [meta.valor, valor]
    const cumple = meta.operador === '>=' ? valor >= meta.valor : valor <= meta.valor
    pct = divisor === 0 ? (cumple ? 1 : 0) : Math.min(1, Math.max(0, numerador / divisor))
  }
  const estado: EstadoIndicador = pct >= 1 ? 'verde' : pct >= UMBRAL_ATENCION ? 'atencion' : 'rojo'
  return { pct, estado }
}
