import type { ResultadoNodo } from '../calculo/cronograma'
import type { ActividadEntrada, FechaISO } from '../calculo/tipos'
import type { CharterDetalle } from './charter'
import type { CorteDetalle } from './cronograma'

/** Todo el charter en un archivo, para respaldo o para otro sistema (solo exportación). */
export interface ExportacionCharter {
  formato: 'project-charter'
  version: 1
  /** Marca ISO de cuándo se generó. */
  generadoEn: string
  /** Fecha del corte exportado; null si el charter aún no tiene cortes. */
  corte: FechaISO | null
  /** Encabezado, razón de ser, listas y reglas. */
  charter: CharterDetalle
  cronograma: {
    /** Columnas A–J; en un corte pasado, con el peso y las fechas de su foto. */
    actividades: ActividadEntrada[]
    /** Cálculo de cada nodo a la fecha exportada, con las reglas del charter. */
    calculo: Record<string, ResultadoNodo>
    proyecto: ResultadoNodo
  }
  /** Todos los cortes con su foto, del más viejo al más reciente. */
  cortes: CorteDetalle[]
}
