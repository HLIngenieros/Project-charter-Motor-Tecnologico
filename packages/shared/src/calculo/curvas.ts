import { calcularCronograma, type ResultadoCronograma } from './cronograma'
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
