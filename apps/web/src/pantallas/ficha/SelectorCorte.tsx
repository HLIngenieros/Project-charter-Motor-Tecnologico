import type { CorteResumen, FechaISO } from '@charter/shared'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Chip } from '../../componentes/Chip'
import { fechaCorta, porcentaje } from '../../formato'
import { chipDe } from './cronograma/estados'

const OPCION =
  'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-sm text-tinta outline-none hover:bg-fondo focus-visible:bg-fondo focus-visible:shadow-[inset_0_0_0_2px_var(--color-acento)] aria-checked:bg-fondo aria-checked:shadow-[inset_3px_0_0_var(--color-acento)]'

const sinAnio = (f: FechaISO) => fechaCorta(f).replace(/ \d{4}$/, '')

/** «Corte: 10 nov ▾» en la banda: elige en qué corte se ve la ficha. Oculto sin cortes. */
export function SelectorCorte({
  cortes,
  valor,
  alCambiar,
}: {
  /** Del más viejo al más reciente. */
  cortes: CorteResumen[]
  /** Corte elegido; null = el último. */
  valor: FechaISO | null
  alCambiar(fecha: FechaISO | null): void
}) {
  const idMenu = useId()
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const actual = valor ?? cortes.at(-1)?.fecha

  useEffect(() => {
    if (!abierto) return
    menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !boton.current?.contains(t)) setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  if (!actual) return null

  const cerrar = () => {
    setAbierto(false)
    boton.current?.focus()
  }

  const teclado = (e: KeyboardEvent) => {
    const lista = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
    const i = lista.indexOf(document.activeElement as HTMLElement)
    const ir = (j: number) => lista[(j + lista.length) % lista.length]?.focus()
    if (e.key === 'ArrowDown') ir(i + 1)
    else if (e.key === 'ArrowUp') ir(i - 1)
    else if (e.key === 'Home') ir(0)
    else if (e.key === 'End') ir(lista.length - 1)
    else if (e.key === 'Escape') cerrar()
    else if (e.key === 'Tab') return setAbierto(false)
    else return
    e.preventDefault()
  }

  return (
    <div className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAbierto(true)
          }
        }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-linea bg-superficie pr-2 pl-3 text-sm text-texto-2 transition-colors duration-150 hover:border-texto-3 focus-visible:outline-2 focus-visible:outline-acento"
      >
        Corte: <b className="font-semibold text-tinta">{sinAnio(actual)}</b>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={menu}
            id={idMenu}
            role="menu"
            aria-label="Cortes"
            onKeyDown={teclado}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 z-30 mt-1.5 max-h-80 w-72 overflow-y-auto rounded-tarjeta border border-linea bg-superficie p-1.5 shadow-dialogo"
          >
            {[...cortes].reverse().map((c, i) => {
              const chip = chipDe(c, false)
              return (
                <button
                  key={c.fecha}
                  type="button"
                  role="menuitemradio"
                  aria-checked={c.fecha === actual}
                  tabIndex={-1}
                  onClick={() => {
                    cerrar()
                    alCambiar(i === 0 ? null : c.fecha)
                  }}
                  className={OPCION}
                >
                  <span className="flex-1 whitespace-nowrap">
                    <b className="font-semibold">{fechaCorta(c.fecha)}</b>
                    {i === 0 && <span className="text-texto-2"> · último</span>}
                  </span>
                  <Chip tono={chip.tono}>{chip.texto}</Chip>
                  <span className="cifra w-14 text-right text-texto-2">{porcentaje(c.ev)}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
