/** Fecha de negocio en texto 'YYYY-MM-DD'. */
export type FechaISO = string

export interface ActividadEntrada {
  id: string
  padreId: string | null
  orden: number
  nombre: string
  entregable?: string | null
  /** Fracción 0–1. Solo aplica a las hojas. */
  peso?: number | null
  inicio?: FechaISO | null
  fin?: FechaISO | null
  responsables?: string[]
}

export interface NodoArbol extends ActividadEntrada {
  /** Numeración por posición: '1', '1.2', '1.2.3'. */
  item: string
  /** 1 = primer nivel. */
  nivel: number
  esHoja: boolean
  hijos: NodoArbol[]
}
