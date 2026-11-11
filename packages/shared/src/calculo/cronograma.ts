import { aDia, aISO, diasHabiles, sumarHabiles } from './fechas'
import { pesosEfectivos, REGLAS_POR_DEFECTO, type Reglas } from './reglas'
import type { FechaISO, NodoArbol } from './tipos'

export type Estado =
  | 'sin_programar'
  | 'terminada'
  | 'vencida'
  | 'por_iniciar'
  | 'al_dia'
  | 'en_atencion'
  | 'en_riesgo'
  | 'atrasada'

export interface AvanceHoja {
  /** Avance real, fracción 0–1. */
  pct: number
  /** Fecha del primer corte en que la hoja llegó al 100 %. */
  terminadaEn?: FechaISO | null
}

export type AvancesPorHoja = Record<string, AvanceHoja>

/**
 * Umbrales de brecha (planeado − real) en puntos porcentuales: desde `atencion` es amarillo,
 * desde `riesgo` naranja y desde `atraso` rojo.
 */
export interface Umbrales {
  atencion: number
  riesgo: number
  atraso: number
}

export const UMBRALES_POR_DEFECTO: Umbrales = { atencion: 10, riesgo: 25, atraso: 50 }

export interface ResultadoNodo {
  id: string
  item: string
  peso: number
  /** El peso lo repartió la regla `sinPeso: 'repartir'` (la hoja no tenía peso). */
  pesoAuto: boolean
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
  /** Hojas vencidas bajo el nodo (en una hoja, 1 si ella misma lo está). */
  vencidas: number
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
  vencidas: number
}

const VACIO: Acumulado = {
  peso: 0,
  pesoPv: 0,
  pesoEv: 0,
  ini: Infinity,
  fin: -Infinity,
  forecast: -Infinity,
  vencidas: 0,
}

const recortar = (x: number) => Math.min(1, Math.max(0, x))
/** Un % real que no sea un número finito (dato corrupto o faltante) cuenta como 0. */
const pctValido = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? recortar(x) : 0)

function combinar(a: Acumulado, b: Acumulado): Acumulado {
  return {
    peso: a.peso + b.peso,
    pesoPv: a.pesoPv + b.pesoPv,
    pesoEv: a.pesoEv + b.pesoEv,
    ini: Math.min(a.ini, b.ini),
    fin: Math.max(a.fin, b.fin),
    forecast: Math.max(a.forecast, b.forecast),
    vencidas: a.vencidas + b.vencidas,
  }
}

/** Estado del semáforo (spec §4.4): gana la primera condición que se cumpla. */
function estadoDe(pv: number, ev: number, t: number, fin: number, u: Umbrales): Estado {
  if (ev >= 1 - EPS) return 'terminada'
  if (t > fin) return 'vencida'
  if (pv === 0 && ev === 0) return 'por_iniciar'
  const brecha = (pv - ev) * 100 + EPS
  if (brecha < u.atencion) return 'al_dia'
  if (brecha < u.riesgo) return 'en_atencion'
  if (brecha < u.atraso) return 'en_riesgo'
  return 'atrasada'
}

function sinProgramar(id: string, item: string, extra: Partial<ResultadoNodo> = {}): ResultadoNodo {
  return {
    id,
    item,
    peso: 0,
    pesoAuto: false,
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
    vencidas: 0,
    ...extra,
  }
}

/** Resultado de un nodo a partir del acumulado de sus hojas programadas. */
function resultadoDe(
  id: string,
  item: string,
  acc: Acumulado,
  t: number,
  r: Reglas,
): ResultadoNodo {
  if (acc.peso <= 0) return sinProgramar(id, item)
  const dur = acc.fin - acc.ini + 1
  const pv = acc.pesoPv / acc.peso
  const ev = acc.pesoEv / acc.peso
  const unidad = r.reparto === 'habiles' ? Math.max(1, diasHabiles(acc.ini, acc.fin)) : dur
  const desv = (ev - pv) * unidad
  return {
    id,
    item,
    peso: acc.peso,
    pesoAuto: false,
    inicio: aISO(acc.ini),
    fin: aISO(acc.fin),
    dur,
    pv,
    ev,
    desv,
    spi: pv > 0 ? ev / pv : null,
    forecast: aISO(acc.forecast),
    estado: estadoDe(pv, ev, t, acc.fin + r.diasGracia, r.umbrales),
    adelantada: desv > 0,
    vencidas: acc.vencidas,
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
  reglas: Reglas = REGLAS_POR_DEFECTO,
): ResultadoCronograma {
  const t = aDia(fecha)
  const nodos: Record<string, ResultadoNodo> = {}
  const pesos = pesosEfectivos(raices, reglas.sinPeso)

  const hoja = (n: NodoArbol): Acumulado => {
    const { peso, auto: pesoAuto } = pesos[n.id] ?? { peso: 0, auto: false }
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
    const habiles = reglas.reparto === 'habiles'
    // Con días hábiles, planeado, desviación y forecast se cuentan en hábiles (dur sigue en calendario).
    const durH = diasHabiles(ini, fin)
    const unidad = habiles ? Math.max(1, durH) : dur
    const pv = !habiles
      ? recortar((t - ini + 1) / dur)
      : durH === 0
        ? t >= fin
          ? 1
          : 0
        : recortar(diasHabiles(ini, Math.min(t, fin)) / durH)
    const avance = avances[n.id]
    const ev = pctValido(avance?.pct)
    const desv = (ev - pv) * unidad
    const spi = pv > 0 ? ev / pv : null
    const mover = (desde: number, dias: number) =>
      habiles ? sumarHabiles(desde, dias) : desde + dias
    const forecast =
      ev >= 1 - EPS
        ? avance?.terminadaEn
          ? aDia(avance.terminadaEn)
          : t
        : reglas.proyeccion === 'ritmo' && spi
          ? Math.max(t, mover(ini, Math.ceil(unidad / spi - EPS) - 1))
          : Math.max(t, mover(fin, -Math.round(desv)))

    const estado = estadoDe(pv, ev, t, fin + reglas.diasGracia, reglas.umbrales)
    const vencidas = estado === 'vencida' ? 1 : 0
    nodos[n.id] = {
      id: n.id,
      item: n.item,
      peso,
      pesoAuto,
      inicio: n.inicio!,
      fin: n.fin!,
      dur,
      pv,
      ev,
      desv,
      spi,
      forecast: aISO(forecast),
      estado,
      adelantada: desv > 0,
      vencidas,
    }
    return { peso, pesoPv: peso * pv, pesoEv: peso * ev, ini, fin, forecast, vencidas }
  }

  const visitar = (n: NodoArbol): Acumulado => {
    if (n.esHoja) return hoja(n)
    const acc = n.hijos.map(visitar).reduce(combinar, VACIO)
    nodos[n.id] = resultadoDe(n.id, n.item, acc, t, reglas)
    return acc
  }

  const total = raices.map(visitar).reduce(combinar, VACIO)
  return { proyecto: resultadoDe('proyecto', '', total, t, reglas), nodos }
}
