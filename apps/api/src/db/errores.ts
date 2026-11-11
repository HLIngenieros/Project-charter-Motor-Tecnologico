/** Código de Postgres para la violación de una restricción única. */
const VIOLACION_UNICA = '23505'

const codigo = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e ? (e as { code: unknown }).code : undefined

/** `true` si el error (o su `cause`, como lo envuelve Drizzle) es una violación de único. */
export function esViolacionUnica(error: unknown): boolean {
  if (codigo(error) === VIOLACION_UNICA) return true
  const causa =
    typeof error === 'object' && error !== null ? (error as { cause?: unknown }).cause : undefined
  return codigo(causa) === VIOLACION_UNICA
}
