import { recorrerHojas } from './arbol'
import type { Umbrales } from './cronograma'
import { aDia } from './fechas'
import type { NodoArbol } from './tipos'

/**
 * Reglas de cálculo de un charter. El Admin fija las vigentes y cada charter copia las del día
 * en que se crea. Con `REGLAS_POR_DEFECTO` el motor da lo mismo que la hoja ID & TI corregida.
 */
export interface Reglas {
  /** `obligatoria`: no se registra un corte si las hojas programadas no suman 100 %. */
  sumaPesos: 'aviso' | 'obligatoria'
  /** `repartir`: las hojas con fechas y peso vacío se reparten lo que falta para el 100 %. */
  sinPeso: 'fuera' | 'repartir'
  umbrales: Umbrales
  /** Planeado lineal por días calendario o por días hábiles (lunes a viernes). */
  reparto: 'calendario' | 'habiles'
  /** Fin proyectado por la desviación (`fin − desv`) o al ritmo actual (`duración / SPI`). */
  proyeccion: 'desviacion' | 'ritmo'
  /** Días después del fin antes de marcar una hoja como vencida. */
  diasGracia: number
}

export const REGLAS_POR_DEFECTO: Reglas = {
  sumaPesos: 'aviso',
  sinPeso: 'fuera',
  umbrales: { atencion: 10, riesgo: 25, atraso: 50 },
  reparto: 'calendario',
  proyeccion: 'desviacion',
  diasGracia: 0,
}

const TOLERANCIA_SUMA = 1e-4

const conFechas = (h: NodoArbol) => !!h.inicio && !!h.fin && aDia(h.fin) >= aDia(h.inicio)

/** Peso con que entra cada hoja (repartido si aplica) y si fue automático. */
export function pesosEfectivos(
  raices: NodoArbol[],
  sinPeso: Reglas['sinPeso'],
): Record<string, { peso: number; auto: boolean }> {
  const hojas = recorrerHojas(raices)
  const salida: Record<string, { peso: number; auto: boolean }> = {}
  let suma = 0
  const vacias: string[] = []
  for (const h of hojas) {
    const peso = h.peso ?? 0
    salida[h.id] = { peso, auto: false }
    if (!conFechas(h)) continue
    if (peso > 0) suma += peso
    else if (h.peso == null) vacias.push(h.id)
  }
  if (sinPeso === 'repartir' && vacias.length > 0) {
    const cada = Math.max(0, 1 - suma) / vacias.length
    for (const id of vacias) salida[id] = { peso: cada, auto: true }
  }
  return salida
}

/** true si las hojas programadas (con sus pesos efectivos) suman 100 %. */
export function pesosCompletos(raices: NodoArbol[], reglas: Reglas): boolean {
  const pesos = pesosEfectivos(raices, reglas.sinPeso)
  const suma = recorrerHojas(raices)
    .filter(conFechas)
    .reduce((s, h) => s + Math.max(0, pesos[h.id]?.peso ?? 0), 0)
  return Math.abs(suma - 1) <= TOLERANCIA_SUMA
}
