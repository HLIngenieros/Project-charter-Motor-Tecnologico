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

export interface PesoEfectivo {
  /** Peso global: producto de los relativos desde la raíz. */
  peso: number
  /** Parte dentro de su padre (la escrita o la repartida). */
  relativo: number
  /** El relativo lo repartió la regla `sinPeso: 'repartir'`. */
  auto: boolean
}

/** Una hoja con fechas válidas, o una agrupadora con alguna hoja así: lo que entra en las sumas. */
export function cuentaEnPesos(n: NodoArbol): boolean {
  return n.esHoja ? conFechas(n) : n.hijos.some(cuentaEnPesos)
}

/**
 * Peso de cada actividad. El `peso` escrito es relativo a su padre (las del primer nivel se
 * reparten el proyecto); el global de una hoja es el producto de los relativos desde la raíz.
 * Con `repartir`, las hermanas que cuentan y no tienen peso se reparten lo que les falta.
 */
export function pesosEfectivos(
  raices: NodoArbol[],
  sinPeso: Reglas['sinPeso'],
): Record<string, PesoEfectivo> {
  const salida: Record<string, PesoEfectivo> = {}
  const nivel = (hermanas: NodoArbol[], globalPadre: number) => {
    let cada = 0
    if (sinPeso === 'repartir') {
      const cuentan = hermanas.filter(cuentaEnPesos)
      const vacias = cuentan.filter((n) => n.peso == null).length
      const suma = cuentan.reduce((s, n) => s + Math.max(0, n.peso ?? 0), 0)
      if (vacias > 0) cada = Math.max(0, 1 - suma) / vacias
    }
    for (const n of hermanas) {
      const auto = n.peso == null && sinPeso === 'repartir' && cuentaEnPesos(n)
      const relativo = auto ? cada : Math.max(0, n.peso ?? 0)
      salida[n.id] = { peso: globalPadre * relativo, relativo, auto }
      nivel(n.hijos, globalPadre * relativo)
    }
  }
  nivel(raices, 1)
  return salida
}

/**
 * Suma de los relativos que cuentan, en el primer nivel (`raiz`) y bajo cada agrupadora que
 * cuenta y tiene peso (`grupos`, por id).
 */
export function sumasDePesos(
  raices: NodoArbol[],
  sinPeso: Reglas['sinPeso'],
): { raiz: number; grupos: Map<string, number> } {
  const pesos = pesosEfectivos(raices, sinPeso)
  const suma = (hermanas: NodoArbol[]) =>
    hermanas.filter(cuentaEnPesos).reduce((s, n) => s + (pesos[n.id]?.relativo ?? 0), 0)
  const grupos = new Map<string, number>()
  const visitar = (n: NodoArbol) => {
    if (n.esHoja) return
    if (cuentaEnPesos(n) && (pesos[n.id]?.relativo ?? 0) > 0) grupos.set(n.id, suma(n.hijos))
    n.hijos.forEach(visitar)
  }
  raices.forEach(visitar)
  return { raiz: suma(raices), grupos }
}

export const sumaCompleta = (x: number) => Math.abs(x - 1) <= TOLERANCIA_SUMA

/** true si el primer nivel y cada agrupadora (con sus pesos efectivos) suman 100 %. */
export function pesosCompletos(raices: NodoArbol[], reglas: Reglas): boolean {
  const { raiz, grupos } = sumasDePesos(raices, reglas.sinPeso)
  return sumaCompleta(raiz) && [...grupos.values()].every(sumaCompleta)
}
