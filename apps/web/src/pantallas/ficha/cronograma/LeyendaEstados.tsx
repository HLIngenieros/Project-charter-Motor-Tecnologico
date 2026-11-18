import type { Estado } from '@charter/shared'
import { ETIQUETA_ESTADO } from './estados'

/** Color del punto de cada estado: el mismo de la barra del Gantt. */
const PUNTO: [Estado, string][] = [
  ['al_dia', 'bg-ok'],
  ['en_atencion', 'bg-amarillo ring-1 ring-amarillo-texto/70 ring-inset'],
  ['en_riesgo', 'bg-naranja'],
  ['atrasada', 'bg-alerta'],
  ['vencida', 'bg-vencida'],
  ['terminada', 'bg-ok'],
  ['por_iniciar', 'bg-barra'],
]

/** Convenciones de color de las barras del cronograma. */
export function LeyendaEstados() {
  return (
    <ul
      aria-label="Convenciones"
      className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-texto-2"
    >
      {PUNTO.map(([estado, clase]) => (
        <li key={estado} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`size-2 flex-none rounded-full ${clase}`} />
          {ETIQUETA_ESTADO[estado]}
        </li>
      ))}
    </ul>
  )
}
