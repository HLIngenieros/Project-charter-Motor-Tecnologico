export interface Config {
  puerto: number
  rutaDb: string
  dominioPermitido: string
  cookieSegura: boolean
}

type Entorno = Record<string, string | undefined>

/** Lee la configuración de las variables de entorno, con valores por defecto para desarrollo. */
export function leerConfig(entorno: Entorno = process.env): Config {
  return {
    puerto: Number(entorno.PUERTO ?? 3100),
    rutaDb: entorno.RUTA_DB ?? '../../data/charters.db',
    dominioPermitido: (entorno.DOMINIO_PERMITIDO ?? 'hlingenieros.com').trim().toLowerCase(),
    cookieSegura: entorno.COOKIE_SEGURA === 'true',
  }
}
