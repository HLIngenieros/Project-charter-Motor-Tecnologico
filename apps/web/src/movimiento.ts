import { useReducedMotion, type Transition, type Variants } from 'motion/react'

const salida: Transition['ease'] = [0.22, 1, 0.36, 1]

/** Entrada única de una vista: aparece y sube 8 px. */
export const entrada: Variants = {
  oculto: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: salida } },
}

/** Entrada escalonada para elementos de una lista (i = posición). */
export function escalonado(i: number): Variants {
  return {
    oculto: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: salida, delay: Math.min(i, 12) * 0.035 },
    },
  }
}

/** Cambio entre pantallas. */
export const transicionRuta: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  salida: { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Variantes que no animan: se usan cuando el sistema pide movimiento reducido. */
export const sinMovimiento: Variants = { oculto: {}, visible: {}, salida: {} }

/** true si el usuario pidió reducir el movimiento. */
export function useMovimientoReducido(): boolean {
  return useReducedMotion() ?? false
}

/** Devuelve las variantes, o ninguna animación si hay movimiento reducido. */
export function useVariantes(variantes: Variants): Variants {
  return useMovimientoReducido() ? sinMovimiento : variantes
}
