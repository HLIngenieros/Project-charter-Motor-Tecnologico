import { normalizar, type CharterResumen, type EstadoCharter } from '@charter/shared'
import { grupoDe, SEGMENTOS, segmentoDe, type EjeTablero, type Segmento } from './datosTablero'

export interface FiltroSemaforo {
  eje: EjeTablero
  /** Id del área o la categoría, o `'ninguna'`. */
  grupo: string
  segmento: Segmento
}

export interface FiltrosPortafolio {
  texto: string
  /** `'todas'`, `'ninguna'` (sin categoría) o el id de una categoría. */
  categoria: 'todas' | 'ninguna' | (string & {})
  area: 'todas' | (string & {})
  estado: 'todos' | EstadoCharter | 'sin_cortes' | 'con_vencidas'
  /** `'todos'` o el id del dueño (solo en la vista «Todos» del Admin). */
  dueno: 'todos' | (string & {})
  /** Segmento pulsado en el tablero. */
  semaforo: FiltroSemaforo | null
}

export const FILTROS_VACIOS: FiltrosPortafolio = {
  texto: '',
  categoria: 'todas',
  area: 'todas',
  estado: 'todos',
  dueno: 'todos',
  semaforo: null,
}

/** `area:<id>:<segmento>` en la URL. */
export function semaforoAUrl(s: FiltroSemaforo): string {
  return `${s.eje}:${s.grupo}:${s.segmento}`
}

export function semaforoDeUrl(texto: string | null): FiltroSemaforo | null {
  const [eje, grupo, segmento] = texto?.split(':') ?? []
  if ((eje !== 'area' && eje !== 'categoria') || !grupo) return null
  if (!SEGMENTOS.includes(segmento as Segmento)) return null
  return { eje, grupo, segmento: segmento as Segmento }
}

export function hayFiltros(f: FiltrosPortafolio): boolean {
  return (
    f.texto.trim() !== '' ||
    f.categoria !== 'todas' ||
    f.area !== 'todas' ||
    f.estado !== 'todos' ||
    f.dueno !== 'todos' ||
    f.semaforo !== null
  )
}

/** Filtros que también recortan el tablero: texto, categoría, área y dueño. */
export function filtrarParaTablero(
  lista: CharterResumen[],
  f: FiltrosPortafolio,
): CharterResumen[] {
  const q = normalizar(f.texto)
  return lista.filter((c) => {
    if (q && !normalizar(`${c.nombre} ${c.codigo ?? ''} ${c.responsable}`).includes(q)) return false
    if (
      f.categoria === 'ninguna'
        ? c.categoria !== null
        : f.categoria !== 'todas' && c.categoria?.id !== f.categoria
    )
      return false
    if (f.area !== 'todas' && c.area?.id !== f.area) return false
    if (f.dueno !== 'todos' && c.propietario.id !== f.dueno) return false
    return true
  })
}

/** La tabla aplica todos los filtros, también el estado y el segmento del tablero. */
export function filtrarCharters(lista: CharterResumen[], f: FiltrosPortafolio): CharterResumen[] {
  const s = f.semaforo
  return filtrarParaTablero(lista, f).filter((c) => {
    if (
      s &&
      (c.estado !== 'activo' || grupoDe(c, s.eje).id !== s.grupo || segmentoDe(c) !== s.segmento)
    )
      return false
    if (f.estado === 'sin_cortes') return c.ultimoCorte === null
    if (f.estado === 'con_vencidas') return (c.ultimoCorte?.vencidas ?? 0) > 0
    if (f.estado !== 'todos' && c.estado !== f.estado) return false
    return true
  })
}
