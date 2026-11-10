import { calcularCronograma, type Estado, type ResultadoCronograma } from './cronograma'
import { aDia, aISO } from './fechas'
import type { FechaISO, NodoArbol } from './tipos'

const PASO_DIAS = 7

/** Curva S planeada: un punto en el inicio del proyecto, luego cada 7 días y siempre el fin. */
export function curvaSPlaneada(raices: NodoArbol[]): { fecha: FechaISO; pv: number }[] {
  const { proyecto } = calcularCronograma(raices, {}, '1970-01-01')
  if (proyecto.estado === 'sin_programar' || !proyecto.inicio || !proyecto.fin) return []

  const ini = aDia(proyecto.inicio)
  const fin = aDia(proyecto.fin)
  const dias: number[] = []
  for (let d = ini; d < fin; d += PASO_DIAS) dias.push(d)
  dias.push(fin)

  return dias.map((d) => {
    const fecha = aISO(d)
    return { fecha, pv: calcularCronograma(raices, {}, fecha).proyecto.pv }
  })
}

/** Curva S real: el avance del proyecto en cada corte, ordenado por fecha. */
export function curvaSReal(
  cortes: { fecha: FechaISO; ev: number }[],
): { fecha: FechaISO; ev: number }[] {
  return [...cortes].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Planeado y real de cada grupo de primer nivel. */
export function avancePorGrupo(
  raices: NodoArbol[],
  r: ResultadoCronograma,
): { id: string; item: string; nombre: string; pv: number; ev: number }[] {
  return raices.map((n) => ({
    id: n.id,
    item: n.item,
    nombre: n.nombre,
    pv: r.nodos[n.id]?.pv ?? 0,
    ev: r.nodos[n.id]?.ev ?? 0,
  }))
}

const EPS = 1e-9

export interface PuntoPlan {
  fecha: FechaISO
  pv: number
}

export interface PuntoReal {
  fecha: FechaISO
  pv: number
  ev: number
  estado: Estado
  vencidas: number
}

/**
 * Proyección al ritmo actual: la línea base corrida por el retraso del motor
 * (`forecast` − fin de línea base). Arranca en el último real y termina en el forecast.
 */
export function proyeccionAlRitmo(
  planeada: PuntoPlan[],
  ultimo: { fecha: FechaISO; ev: number },
  forecast: FechaISO | null,
  finLineaBase: FechaISO | null,
): PuntoPlan[] {
  if (!forecast || !finLineaBase || ultimo.ev >= 1 - EPS) return []
  const d = aDia(forecast) - aDia(finLineaBase)
  const desde = aDia(ultimo.fecha)
  const fin = aDia(forecast)
  const puntos: PuntoPlan[] = [{ fecha: ultimo.fecha, pv: ultimo.ev }]
  for (const p of planeada) {
    const dia = aDia(p.fecha) + d
    if (p.pv > ultimo.ev && p.pv < 1 - EPS && dia > aDia(puntos.at(-1)!.fecha) && dia < fin) {
      puntos.push({ fecha: aISO(dia), pv: p.pv })
    }
  }
  if (fin > desde) puntos.push({ fecha: forecast, pv: 1 })
  return puntos
}

/** Valor interpolado linealmente en una serie ordenada; fuera de ella, el extremo más cercano. */
function interpolar<T extends { fecha: FechaISO }>(
  serie: T[],
  dia: number,
  valor: (p: T) => number,
): number {
  if (serie.length === 0) return 0
  const primero = serie[0]!
  if (dia <= aDia(primero.fecha)) return valor(primero)
  for (let i = 1; i < serie.length; i++) {
    const a = serie[i - 1]!
    const b = serie[i]!
    const db = aDia(b.fecha)
    if (dia <= db) {
      const da = aDia(a.fecha)
      const f = db === da ? 1 : (dia - da) / (db - da)
      return valor(a) + (valor(b) - valor(a)) * f
    }
  }
  return valor(serie.at(-1)!)
}

export interface Lectura {
  fecha: FechaISO
  pv: number
  /** Null antes del primer corte o sin cortes. */
  ev: number | null
  tipo: 'corte' | 'entre_cortes' | 'proyeccion' | 'plan'
  corte?: PuntoReal
}

/** Lo que dice la curva en una fecha: en un corte, sus datos; entre cortes, interpolado; después, la proyección. */
export function lecturaEn(
  fecha: FechaISO,
  planeada: PuntoPlan[],
  reales: PuntoReal[],
  proyeccion: PuntoPlan[],
): Lectura {
  const dia = aDia(fecha)
  const pv = planeada.length ? interpolar(planeada, dia, (p) => p.pv) : 0
  const corte = reales.find((r) => r.fecha === fecha)
  if (corte) return { fecha, pv, ev: corte.ev, tipo: 'corte', corte }
  if (reales.length === 0 || dia < aDia(reales[0]!.fecha))
    return { fecha, pv, ev: null, tipo: 'plan' }
  if (dia > aDia(reales.at(-1)!.fecha)) {
    const ev = proyeccion.length ? interpolar(proyeccion, dia, (p) => p.pv) : reales.at(-1)!.ev
    return { fecha, pv, ev, tipo: 'proyeccion' }
  }
  return { fecha, pv, ev: interpolar(reales, dia, (r) => r.ev), tipo: 'entre_cortes' }
}
