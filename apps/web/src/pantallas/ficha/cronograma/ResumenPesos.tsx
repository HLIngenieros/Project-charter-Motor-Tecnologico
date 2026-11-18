import type { ResumenPesos as Resumen } from '@charter/shared'
import { sumaCompleta } from '@charter/shared'
import { pesoTexto } from '../../../formato'
import { MarcaSuma } from './FilaGantt'

const Visto = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-3.5 text-ok-texto"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m5 12 5 5 9-10" />
  </svg>
)

/**
 * Suma de pesos siempre a la vista: la del primer nivel y los grupos cuyas subactividades no
 * suman 100 %, cada uno como enlace a su fila.
 */
export function ResumenPesos({
  resumen,
  obligatoria,
  alAbrir,
}: {
  resumen: Resumen
  /** Con suma obligatoria, faltar o sobrar impide registrar un corte. */
  obligatoria: boolean
  alAbrir(id: string): void
}) {
  const { proyecto, grupos } = resumen
  const completo = sumaCompleta(proyecto)
  const todoBien = completo && grupos.length === 0
  return (
    <div
      role="group"
      aria-label="Resumen de pesos"
      className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-control px-3 py-2 text-[0.8125rem] ${todoBien ? 'bg-fondo text-texto-2' : 'bg-amarillo-suave text-tinta'}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-tinta">Pesos:</span>
        proyecto {pesoTexto(proyecto)}
        {completo ? (
          <Visto />
        ) : (
          <span className={proyecto < 1 ? 'text-amarillo-texto' : 'text-alerta-texto'}>
            · {proyecto < 1 ? 'falta' : 'sobra'} {pesoTexto(Math.abs(1 - proyecto))}
          </span>
        )}
      </span>
      {grupos.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-texto-2">
            {grupos.length === 1 ? '1 grupo incompleto:' : `${grupos.length} grupos incompletos:`}
          </span>
          {grupos.map((g) => (
            <button
              key={g.id}
              type="button"
              title={g.nombre}
              onClick={() => alAbrir(g.id)}
              className="inline-flex items-baseline gap-1 rounded-[5px] bg-superficie px-1.5 py-0.5 font-mono text-xs text-tinta shadow-sm hover:bg-fondo focus-visible:outline-2 focus-visible:outline-acento"
            >
              {g.item} <MarcaSuma suma={g.suma} />
            </button>
          ))}
        </span>
      )}
      {!todoBien && obligatoria && (
        <span className="text-texto-2">Debes completarlos para registrar un corte.</span>
      )}
    </div>
  )
}
