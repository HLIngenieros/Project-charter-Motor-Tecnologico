import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface DialogoProps {
  abierto: boolean
  alCerrar: () => void
  titulo: string
  children: ReactNode
}

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialogo({ abierto, alCerrar, titulo, children }: DialogoProps) {
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)
  const anterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    anterior.current = document.activeElement as HTMLElement | null
    const primero = panel.current?.querySelector<HTMLElement>(ENFOCABLES)
    ;(primero ?? panel.current)?.focus()
    const desplazamiento = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = desplazamiento
      anterior.current?.focus()
    }
  }, [abierto])

  const teclado = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      alCerrar()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const enfocables = [...panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)]
    if (enfocables.length === 0) {
      e.preventDefault()
      return
    }
    const primero = enfocables[0]!
    const ultimo = enfocables[enfocables.length - 1]!
    if (
      e.shiftKey &&
      (document.activeElement === primero || document.activeElement === panel.current)
    ) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primero.focus()
    }
  }

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-tinta/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={alCerrar}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            tabIndex={-1}
            onKeyDown={teclado}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-tarjeta bg-superficie p-6 shadow-dialogo focus:outline-none"
          >
            <h2 id={idTitulo} className="mb-3 text-lg font-semibold">
              {titulo}
            </h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
