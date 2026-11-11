import type { Aviso, NodoArbol, ResultadoNodo } from '@charter/shared'
import type { KeyboardEvent, ReactNode } from 'react'
import { Chip } from '../../../componentes/Chip'
import { porcentaje } from '../../../formato'
import { chipDe } from './estados'

/** Rejilla compartida por la cabecera y las filas. */
export const COLUMNAS =
  'grid grid-cols-[minmax(0,1fr)_minmax(140px,1.2fr)] md:grid-cols-[60px_minmax(200px,1fr)_64px_118px_minmax(300px,1.35fr)]'

const FONDO_FILA: Partial<Record<string, string>> = {
  vencida: 'bg-vencida-suave/50',
  en_atencion: 'bg-amarillo-suave/50',
  en_riesgo: 'bg-naranja-suave/50',
  atrasada: 'bg-alerta-suave/50',
}

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export function FilaGantt({
  nodo,
  resultado,
  avisos,
  abierta,
  plegada,
  destello,
  noExistia = false,
  pista,
  alAbrir,
  alPlegar,
  alTecla,
}: {
  nodo: NodoArbol
  resultado: ResultadoNodo | undefined
  avisos: Aviso[]
  abierta: boolean
  plegada: boolean
  destello: boolean
  /** Vista histórica: la hoja se creó después del corte. */
  noExistia?: boolean
  pista: ReactNode
  alAbrir(): void
  alPlegar(): void
  alTecla(e: KeyboardEvent<HTMLButtonElement>): void
}) {
  const chip = resultado ? chipDe(resultado, nodo.esHoja) : null
  const tonoFila = nodo.esHoja ? resultado?.estado : resultado?.vencidas ? 'vencida' : undefined
  const peso = nodo.esHoja ? nodo.peso : resultado?.peso
  const aviso = avisos.map((a) => a.mensaje).join(' ')

  return (
    <div
      data-fila={nodo.id}
      className={[
        COLUMNAS,
        'min-h-9 items-center border-t border-linea-2 text-[0.8125rem] transition-colors duration-200',
        nodo.esHoja ? 'text-texto' : 'font-semibold text-tinta',
        (tonoFila && FONDO_FILA[tonoFila]) || '',
        abierta ? 'shadow-[inset_0_0_0_2px_var(--color-acento)]' : '',
        destello ? 'animate-destello' : '',
        noExistia ? 'opacity-55' : '',
      ].join(' ')}
    >
      <div className="px-2.5 font-mono text-xs text-texto-2 max-md:hidden">
        <span className={nodo.esHoja ? '' : 'font-semibold text-tinta'}>{nodo.item}</span>
      </div>
      <div
        className="flex min-w-0 items-center gap-1.5 pr-2.5"
        style={{ paddingLeft: 10 + (nodo.nivel - 1) * 16 }}
      >
        {nodo.esHoja ? (
          <span className="w-[22px] flex-none" />
        ) : (
          <button
            type="button"
            aria-expanded={!plegada}
            aria-label={`${plegada ? 'Desplegar' : 'Plegar'} ${nodo.nombre || nodo.item}`}
            onClick={alPlegar}
            className={`grid size-[22px] flex-none place-items-center rounded-[5px] text-texto-2 transition-transform hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento ${plegada ? '-rotate-90' : ''}`}
          >
            <Chevron />
          </button>
        )}
        <button
          type="button"
          aria-expanded={abierta}
          onClick={alAbrir}
          onKeyDown={alTecla}
          title={nodo.nombre}
          className="min-w-0 truncate rounded-sm text-left focus-visible:outline-2 focus-visible:outline-acento"
        >
          {nodo.nombre || <span className="font-normal text-texto-3 italic">Sin nombre</span>}
        </button>
        {noExistia && (
          <span className="flex-none text-xs font-normal text-texto-2 italic">
            no existía en este corte
          </span>
        )}
        {aviso && (
          <span
            role="img"
            aria-label={aviso}
            title={aviso}
            className="size-1.5 flex-none rounded-full bg-amarillo"
          />
        )}
      </div>
      <div className="px-2.5 text-right font-mono text-xs whitespace-nowrap max-md:hidden">
        {peso ? porcentaje(peso) : '—'}
      </div>
      <div className="min-w-0 px-2.5 max-md:hidden">
        {chip && <Chip tono={chip.tono}>{chip.texto}</Chip>}
      </div>
      <div className="min-w-0 self-stretch">{pista}</div>
    </div>
  )
}
