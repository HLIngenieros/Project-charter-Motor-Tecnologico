import type { ZodError } from 'zod'
import { ErrorCliente } from '../api/cliente'

export type ErroresCampos = Record<string, string>

/** Primer mensaje por campo de un error de Zod. */
export function camposDeZod(error: ZodError): ErroresCampos {
  const campos: ErroresCampos = {}
  for (const issue of error.issues) campos[String(issue.path[0])] ??= issue.message
  return campos
}

/** Separa un error de la API en errores de campo o un mensaje general. */
export function separarError(error: unknown): { campos: ErroresCampos; general?: string } {
  if (error instanceof ErrorCliente) {
    if (error.campos && Object.keys(error.campos).length > 0) return { campos: error.campos }
    return { campos: {}, general: error.message }
  }
  return { campos: {}, general: 'Algo falló. Intenta de nuevo.' }
}
