import type { Estado, ResultadoNodo } from '@charter/shared'
import type { TonoChip } from '../../../componentes/Chip'

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  terminada: 'Terminada',
  vencida: 'Vencida',
  por_iniciar: 'Por iniciar',
  al_dia: 'Al día',
  en_atencion: 'En atención',
  en_riesgo: 'En riesgo',
  atrasada: 'Atrasada',
  sin_programar: 'Sin programar',
}

export function tonoDe(estado: Estado): TonoChip {
  return estado === 'por_iniciar' || estado === 'sin_programar' ? 'neutro' : estado
}

/** Una agrupadora con hojas vencidas lo dice antes que su estado. */
export function chipDe(r: ResultadoNodo, esHoja: boolean): { tono: TonoChip; texto: string } {
  if (!esHoja && r.vencidas > 0) {
    return { tono: 'vencida', texto: r.vencidas === 1 ? '1 vencida' : `${r.vencidas} vencidas` }
  }
  return { tono: tonoDe(r.estado), texto: ETIQUETA_ESTADO[r.estado] }
}
