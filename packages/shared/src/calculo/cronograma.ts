import { aDia, aISO } from './fechas'
import type { FechaISO, NodoArbol } from './tipos'

export type Estado =
  | 'sin_programar'
  | 'por_iniciar'
  | 'terminada'
  | 'al_dia'
  | 'en_atencion'
  | 'atrasada'

export interface AvanceHoja {
  /** Avance real, fracción 0–1. */
  pct: number
  /** Fecha del primer corte en que la hoja llegó al 100 %. */
  terminadaEn?: FechaISO | null
}

export type AvancesPorHoja = Record<string, AvanceHoja>

/** Umbrales de desviación en días (negativos = atraso). */
export interface Umbrales {
  atencion: number
  atraso: number
}

export const UMBRALES_POR_DEFECTO: Umbrales = { atencion: -3, atraso: -10 }

export interface ResultadoNodo {
  id: string
  item: string
  peso: number
  inicio: FechaISO | null
  fin: FechaISO | null
  dur: number | null
  pv: number
  ev: number
  desv: number
  spi: number | null
  forecast: FechaISO | null
  estado: Estado
  adelantada: boolean
}

export interface ResultadoCronograma {
  proyecto: ResultadoNodo
  nodos: Record<string, ResultadoNodo>
}

/** Margen para comparar fracciones acumuladas (p. ej. una suma ponderada de 1 que da 0,9999999). */
const EPS = 1e-9

/** Acumulado de las hojas programadas bajo un nodo. */
interface Acumulado {
  peso: number
  pesoPv: number
  pesoEv: number
  ini: number
  fin: number
  forecast: number
}

const VACIO: Acumulado = {
  peso: 0,
  pesoPv: 0,
  pesoEv: 0,
  ini: Infinity,
  fin: -Infinity,
  forecast: -Infinity,
}

const recortar = (x: number) => Math.min(1, Math.max(0, x))

function combinar(a: Acumulado, b: Acumulado): Acumulado {
  return {
    peso: a.peso + b.peso,
    pesoPv: a.pesoPv + b.pesoPv,
    pesoEv: a.pesoEv + b.pesoEv,
    ini: Math.min(a.ini, b.ini),
    fin: Math.max(a.fin, b.fin),
    forecast: Math.max(a.forecast, b.forecast),
  }
}

function estadoDe(pv: number, ev: number, desv: number, u: Umbrales): Estado {
  if (ev >= 1 - EPS) return 'terminada'
  if (pv === 0 && ev === 0) return 'por_iniciar'
  if (desv >= u.atencion) return 'al_dia'
  if (desv >= u.atraso) return 'en_atencion'
  return 'atrasada'
}

function sinProgramar(id: string, item: string, extra: Partial<ResultadoNodo> = {}): ResultadoNodo {
  return {
    id,
    item,
    peso: 0,
    inicio: null,
    fin: null,
    dur: null,
    pv: 0,
    ev: 0,
    desv: 0,
    spi: null,
    forecast: null,
    estado: 'sin_programar',
    adelantada: false,
    ...extra,
  }
}

/** Resultado de un nodo a partir del acumulado de sus hojas programadas. */
function resultadoDe(
  id: string,
  item: string,
  acc: Acumulado,
  u: Umbrales,
): ResultadoNodo {
  if (acc.peso <= 0) return sinProgramar(id, item)
  const dur = acc.fin - acc.ini + 1
  const pv = acc.pesoPv / acc.peso
  const ev = acc.pesoEv / acc.peso
  const desv = (ev - pv) * dur
  return {
    id,
    item,
    peso: acc.peso,
    inicio: aISO(acc.ini),
    fin: aISO(acc.fin),
    dur,
    pv,
    ev,
    desv,
    spi: pv > 0 ? ev / pv : null,
    forecast: aISO(acc.forecast),
    estado: estadoDe(pv, ev, desv, u),
    adelantada: desv > 0,
  }
}

/**
 * Calcula planeado, real, desviación, forecast y estado de cada nodo al `fecha` de corte.
 * Las agrupadoras y el proyecto ponderan sobre sus hojas programadas (nunca sobre agrupadoras),
 * lo que evita el doble conteo del Excel.
 */
export function calcularCronograma(
  raices: NodoArbol[],
  avances: AvancesPorHoja,
  fecha: FechaISO,
  umbrales: Umbrales = UMBRALES_POR_DEFECTO,
): ResultadoCronograma {
  const t = aDia(fecha)
  const nodos: Record<string, ResultadoNodo> = {}

  const hoja = (n: NodoArbol): Acumulado => {
    const peso = n.peso ?? 0
    const ini = n.inicio ? aDia(n.inicio) : null
    const fin = n.fin ? aDia(n.fin) : null
    if (!(peso > 0) || ini === null || fin === null || fin < ini) {
      nodos[n.id] = sinProgramar(n.id, n.item, {
        peso,
        inicio: n.inicio ?? null,
        fin: n.fin ?? null,
      })
      return VACIO
    }

    const dur = fin - ini + 1
    const pv = recortar((t - ini + 1) / dur)
    const avance = avances[n.id]
    const ev = recortar(avance?.pct ?? 0)
    const desv = (ev - pv) * dur
    const forecast =
      ev >= 1 - EPS
        ? avance?.terminadaEn
          ? aDia(avance.terminadaEn)
          : t
        : Math.max(t, fin - Math.round(desv))

    nodos[n.id] = {
      id: n.id,
      item: n.item,
      peso,
      inicio: n.inicio!,
      fin: n.fin!,
      dur,
      pv,
      ev,
      desv,
      spi: pv > 0 ? ev / pv : null,
      forecast: aISO(forecast),
      estado: estadoDe(pv, ev, desv, umbrales),
      adelantada: desv > 0,
    }
    return { peso, pesoPv: peso * pv, pesoEv: peso * ev, ini, fin, forecast }
  }

  const visitar = (n: NodoArbol): Acumulado => {
    if (n.esHoja) return hoja(n)
    const acc = n.hijos.map(visitar).reduce(combinar, VACIO)
    nodos[n.id] = resultadoDe(n.id, n.item, acc, umbrales)
    return acc
  }

  const total = raices.map(visitar).reduce(combinar, VACIO)
  return { proyecto: resultadoDe('proyecto', '', total, umbrales), nodos }
}
