import { motion } from 'motion/react'
import { useId, useRef, type KeyboardEvent } from 'react'

export interface Pestana {
  id: string
  etiqueta: string
}

export interface PestanasProps {
  pestanas: Pestana[]
  activa: string
  alCambiar: (id: string) => void
  /** Nombre accesible del grupo. */
  etiqueta: string
}

export function Pestanas({ pestanas, activa, alCambiar, etiqueta }: PestanasProps) {
  const grupo = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const mover = (e: KeyboardEvent, i: number) => {
    const destino =
      e.key === 'ArrowRight'
        ? (i + 1) % pestanas.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + pestanas.length) % pestanas.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? pestanas.length - 1
              : null
    if (destino === null) return
    e.preventDefault()
    alCambiar(pestanas[destino]!.id)
    refs.current[destino]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className="flex gap-1 overflow-x-auto border-b border-linea"
    >
      {pestanas.map((p, i) => {
        const seleccionada = p.id === activa
        return (
          <button
            key={p.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${grupo}-${p.id}`}
            aria-selected={seleccionada}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => alCambiar(p.id)}
            onKeyDown={(e) => mover(e, i)}
            className={[
              'relative shrink-0 px-3 pb-2.5 pt-2 text-sm font-semibold transition-colors',
              seleccionada ? 'text-institucional' : 'text-texto-2 hover:text-tinta',
            ].join(' ')}
          >
            {p.etiqueta}
            {seleccionada && (
              <motion.span
                layoutId={`${grupo}-marca`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-institucional"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
