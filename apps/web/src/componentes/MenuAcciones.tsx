import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export interface Accion {
  etiqueta: string
  alElegir: () => void
  peligro?: boolean
}

const OPCION =
  'flex w-full items-center rounded-[6px] px-2.5 py-2 text-left text-sm outline-none hover:bg-fondo focus-visible:bg-fondo focus-visible:shadow-[inset_0_0_0_2px_var(--color-acento)]'

function Puntos() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

/** Botón «⋯» con un menú de acciones (teclado: flechas, Inicio, Fin, Escape). */
export function MenuAcciones({ etiqueta, acciones }: { etiqueta: string; acciones: Accion[] }) {
  const idMenu = useId()
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  const opciones = () => [
    ...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
  ]

  useEffect(() => {
    if (!abierto) return
    opciones()[0]?.focus()
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !boton.current?.contains(t)) setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  const cerrar = () => {
    setAbierto(false)
    boton.current?.focus()
  }

  const teclado = (e: KeyboardEvent) => {
    const lista = opciones()
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

  if (acciones.length === 0) return null
  return (
    <div className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
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
        className="flex size-9 items-center justify-center rounded-control text-texto-2 transition-colors hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
      >
        <Puntos />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={menu}
            id={idMenu}
            role="menu"
            aria-label={etiqueta}
            onKeyDown={teclado}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 z-30 mt-1 w-52 rounded-tarjeta border border-linea bg-superficie p-1.5 shadow-dialogo"
          >
            {acciones.map((a) => (
              <button
                key={a.etiqueta}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  cerrar()
                  a.alElegir()
                }}
                className={`${OPCION} ${a.peligro ? 'text-alerta-texto' : 'text-tinta'}`}
              >
                {a.etiqueta}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
