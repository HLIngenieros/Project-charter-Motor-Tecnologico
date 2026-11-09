import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

export interface Config {
  puerto: number
  rutaDb: string
  dominioPermitido: string
  cookieSegura: boolean
  /** Confiar en X-Forwarded-For (solo detrás de un proxy como IIS). */
  confiarProxy: boolean
}

type Entorno = Record<string, string | undefined>

/** Lee la configuración de las variables de entorno, con valores por defecto para desarrollo. */
export function leerConfig(entorno: Entorno = process.env): Config {
  return {
    puerto: Number(entorno.PUERTO ?? 3100),
    rutaDb: entorno.RUTA_DB ?? '../../data/charters.db',
    dominioPermitido: (entorno.DOMINIO_PERMITIDO ?? 'hlingenieros.com').trim().toLowerCase(),
    cookieSegura: entorno.COOKIE_SEGURA === 'true',
    confiarProxy: entorno.CONFIAR_PROXY === 'true',
  }
}

/**
 * Carga un archivo .env en el entorno sin pisar las variables ya definidas.
 * Devuelve false si el archivo no existe.
 */
export function cargarEntorno(ruta: string, entorno: Entorno = process.env): boolean {
  if (!existsSync(ruta)) return false
  for (const [clave, valor] of Object.entries(parseEnv(readFileSync(ruta, 'utf-8')))) {
    entorno[clave] ??= valor
  }
  return true
}
