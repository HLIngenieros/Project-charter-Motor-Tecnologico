import type { FechaISO } from '@charter/shared'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { descargarJson, rutaImpresion } from '../../api/exportar'
import { Aviso } from '../../componentes/Aviso'

const OPCION =
  'flex w-full items-start gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-sm text-tinta outline-none hover:bg-fondo focus-visible:bg-fondo focus-visible:shadow-[inset_0_0_0_2px_var(--color-acento)]'

const Icono = ({ d }: { d: string }) => (
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
    className="mt-0.5 shrink-0 text-texto-2"
  >
    <path d={d} />
  </svg>
)

const DESCARGA = 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14'
const DOCUMENTO = 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M9 13h6m-6 4h6'
const LLAVES =
  'M8 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1m8-16h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1'

/** «Exportar» en la banda: PDF (vista de impresión) o JSON, del corte que se está viendo. */
export function MenuExportar({
  charter,
  corte,
}: {
  charter: { id: string; nombre: string; codigo: string | null }
  /** Corte pasado que se está viendo; null = el último. */
  corte: FechaISO | null
}) {
  const idMenu = useId()
  const [abierto, setAbierto] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string>()
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto && !error) return
    if (abierto) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) {
        setAbierto(false)
        setError(undefined)
      }
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto, error])

  const cerrar = () => {
    setAbierto(false)
    boton.current?.focus()
  }

  const teclado = (e: KeyboardEvent) => {
    const lista = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
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

  const pdf = () => {
    cerrar()
    window.open(rutaImpresion(charter.id, corte), '_blank')
  }

  const json = async () => {
    cerrar()
    setDescargando(true)
    setError(undefined)
    try {
      await descargarJson(charter, corte)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar. Intenta de nuevo.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div ref={raiz} className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        aria-busy={descargando || undefined}
        onClick={() => {
          setError(undefined)
          setAbierto((a) => !a)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAbierto(true)
          }
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-control border border-linea bg-superficie pr-2 pl-3 text-sm font-semibold text-tinta transition-colors duration-150 hover:border-texto-3 focus-visible:outline-2 focus-visible:outline-acento disabled:opacity-60"
        disabled={descargando}
      >
        <Icono d={DESCARGA} />
        Exportar
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={menu}
            id={idMenu}
            role="menu"
            aria-label="Exportar el charter"
            onKeyDown={teclado}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 z-30 mt-1.5 w-64 max-sm:w-60 rounded-tarjeta border border-linea bg-superficie p-1.5 shadow-dialogo"
          >
            <button type="button" role="menuitem" tabIndex={-1} onClick={pdf} className={OPCION}>
              <Icono d={DOCUMENTO} />
              <span className="flex flex-col">
                <span className="font-semibold">PDF</span>
                <span className="text-xs text-texto-2">Documento completo para imprimir</span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => void json()}
              className={OPCION}
            >
              <Icono d={LLAVES} />
              <span className="flex flex-col">
                <span className="font-semibold">JSON</span>
                <span className="text-xs text-texto-2">Datos y cortes, para respaldo</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-72 bg-superficie shadow-dialogo">
          <Aviso tono="alerta">{error}</Aviso>
        </div>
      )}
    </div>
  )
}
