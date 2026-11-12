export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico'

export interface CalificacionRiesgo {
  puntaje: number
  nivel: NivelRiesgo
}

/** Probabilidad × impacto (1–5 cada uno). Sin alguno de los dos, el riesgo queda sin calificar. */
export function nivelRiesgo(
  probabilidad: number | null,
  impacto: number | null,
): CalificacionRiesgo | null {
  if (probabilidad == null || impacto == null) return null
  const puntaje = probabilidad * impacto
  const nivel: NivelRiesgo =
    puntaje >= 16 ? 'critico' : puntaje >= 10 ? 'alto' : puntaje >= 5 ? 'medio' : 'bajo'
  return { puntaje, nivel }
}

interface RubroCalculable {
  valor: number
  lineas: { cantidad: number; valorUnitario: number }[]
}

/** Con desglose, la suma de cantidad × valor unitario (redondeada a pesos); sin él, el valor escrito. */
export function valorRubro(rubro: RubroCalculable): number {
  if (rubro.lineas.length === 0) return rubro.valor
  return Math.round(rubro.lineas.reduce((s, l) => s + l.cantidad * l.valorUnitario, 0))
}

export function totalPresupuesto(rubros: RubroCalculable[]): number {
  return rubros.reduce((s, r) => s + valorRubro(r), 0)
}
