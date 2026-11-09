import { ErrorApi } from '../errores'

export const MAX_INTENTOS = 10
export const VENTANA_MS = 15 * 60_000

/** Límite de intentos de login por correo normalizado, en memoria. */
export class LimitePorCorreo {
  private readonly intentos = new Map<string, { cuenta: number; reinicio: number }>()

  constructor(
    private readonly max = MAX_INTENTOS,
    private readonly ventanaMs = VENTANA_MS,
  ) {}

  /** Registra un intento y lanza 429 si se supera el límite. */
  registrar(correo: string, ahora = Date.now()): void {
    this.limpiar(ahora)
    const actual = this.intentos.get(correo)
    if (!actual || actual.reinicio <= ahora) {
      this.intentos.set(correo, { cuenta: 1, reinicio: ahora + this.ventanaMs })
      return
    }
    actual.cuenta++
    if (actual.cuenta > this.max) {
      throw new ErrorApi(429, 'demasiados_intentos', 'Demasiados intentos. Espera unos minutos.')
    }
  }

  private limpiar(ahora: number): void {
    if (this.intentos.size < 1000) return
    for (const [correo, x] of this.intentos) if (x.reinicio <= ahora) this.intentos.delete(correo)
  }
}
