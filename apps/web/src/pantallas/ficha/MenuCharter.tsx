import type { EstadoCharter } from '@charter/shared'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useEliminarCharter } from '../../api/charters'
import { ErrorCliente } from '../../api/cliente'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Dialogo } from '../../componentes/Dialogo'

export const NOMBRE_ESTADO: Record<EstadoCharter, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
}

const ESTADOS: EstadoCharter[] = ['activo', 'pausado', 'cerrado', 'cancelado']

const PUNTO: Record<EstadoCharter, string> = {
  activo: 'bg-ok',
  pausado: 'bg-amarillo',
  cerrado: 'bg-texto-3',
  cancelado: 'bg-alerta',
}

const CONFIRMAR: Partial<Record<EstadoCharter, { titulo: string; boton: string }>> = {
  cerrado: { titulo: '¿Cerrar el charter?', boton: 'Cerrar charter' },
  cancelado: { titulo: '¿Cancelar el charter?', boton: 'Cancelar charter' },
}

const OPCION =
  'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-sm text-tinta outline-none hover:bg-fondo focus-visible:bg-fondo focus-visible:shadow-[inset_0_0_0_2px_var(--color-acento)]'

function Chevron() {
  return (
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
  )
}

/**
 * Acciones del charter en la banda: cambiar el estado (cerrar o cancelar piden
 * confirmación) y eliminarlo.
 */
export function MenuCharter({
  charterId,
  nombre,
  estado,
  cambiarEstado,
}: {
  charterId: string
  nombre: string
  estado: EstadoCharter
  cambiarEstado(estado: EstadoCharter): void
}) {
  const idMenu = useId()
  const [abierto, setAbierto] = useState(false)
  const [confirmar, setConfirmar] = useState<EstadoCharter | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const eliminar = useEliminarCharter()
  const navegar = useNavigate()

  const opciones = () => [
    ...(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []),
  ]

  useEffect(() => {
    if (!abierto) return
    const actual = menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    ;(actual ?? opciones()[0])?.focus()
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !boton.current?.contains(t)) setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  const cerrarMenu = (devolverFoco = true) => {
    setAbierto(false)
    if (devolverFoco) boton.current?.focus()
  }

  const teclado = (e: KeyboardEvent) => {
    const lista = opciones()
    const i = lista.indexOf(document.activeElement as HTMLElement)
    const ir = (j: number) => lista[(j + lista.length) % lista.length]?.focus()
    if (e.key === 'ArrowDown') ir(i + 1)
    else if (e.key === 'ArrowUp') ir(i - 1)
    else if (e.key === 'Home') ir(0)
    else if (e.key === 'End') ir(lista.length - 1)
    else if (e.key === 'Escape') cerrarMenu()
    else if (e.key === 'Tab') return setAbierto(false)
    else return
    e.preventDefault()
  }

  const elegir = (nuevo: EstadoCharter) => {
    cerrarMenu()
    if (nuevo === estado) return
    if (CONFIRMAR[nuevo]) setConfirmar(nuevo)
    else cambiarEstado(nuevo)
  }

  const borrar = async () => {
    try {
      await eliminar.mutateAsync(charterId)
      void navegar('/', { replace: true })
    } catch {
      // El error se muestra en el diálogo.
    }
  }

  const textoConfirmar = confirmar ? CONFIRMAR[confirmar] : undefined

  return (
    <div className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={`Estado del charter: ${NOMBRE_ESTADO[estado]}`}
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
        className="inline-flex min-h-9 items-center gap-2 rounded-control border border-linea bg-superficie pr-2 pl-3 text-sm font-semibold text-tinta transition-colors duration-150 hover:border-texto-3 focus-visible:outline-2 focus-visible:outline-acento"
      >
        <span aria-hidden className={`size-[7px] rounded-full ${PUNTO[estado]}`} />
        {NOMBRE_ESTADO[estado]}
        <Chevron />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={menu}
            id={idMenu}
            role="menu"
            aria-label="Acciones del charter"
            onKeyDown={teclado}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 z-30 mt-1.5 w-56 rounded-tarjeta border border-linea bg-superficie p-1.5 shadow-dialogo"
          >
            <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-texto-2">Estado</p>
            {ESTADOS.map((e) => (
              <button
                key={e}
                type="button"
                role="menuitemradio"
                aria-checked={e === estado}
                tabIndex={-1}
                onClick={() => elegir(e)}
                className={OPCION}
              >
                <span aria-hidden className={`size-[7px] rounded-full ${PUNTO[e]}`} />
                <span className="flex-1">{NOMBRE_ESTADO[e]}</span>
                {e === estado && (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="text-institucional"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                )}
              </button>
            ))}
            <div role="separator" className="my-1.5 border-t border-linea-2" />
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                cerrarMenu()
                eliminar.reset()
                setEliminando(true)
              }}
              className={`${OPCION} text-alerta-texto`}
            >
              Eliminar charter…
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialogo
        abierto={textoConfirmar !== undefined}
        alCerrar={() => setConfirmar(null)}
        titulo={textoConfirmar?.titulo ?? ''}
      >
        <p className="text-[0.9375rem] text-texto">
          El charter quedará en solo lectura. Podrás reabrirlo cuando quieras.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmar(null)}>
            Volver
          </Boton>
          <Boton
            onClick={() => {
              if (confirmar) cambiarEstado(confirmar)
              setConfirmar(null)
            }}
          >
            {textoConfirmar?.boton}
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={eliminando} alCerrar={() => setEliminando(false)} titulo="Eliminar charter">
        <p className="text-[0.9375rem] text-texto">
          Se eliminará <b className="font-semibold text-tinta">«{nombre}»</b> con todo su contenido.
          No se puede deshacer.
        </p>
        {eliminar.error && (
          <Aviso tono="alerta" className="mt-4">
            {eliminar.error instanceof ErrorCliente
              ? eliminar.error.message
              : 'No se pudo eliminar. Intenta de nuevo.'}
          </Aviso>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setEliminando(false)}>
            Volver
          </Boton>
          <Boton variante="peligro" cargando={eliminar.isPending} onClick={() => void borrar()}>
            Eliminar charter
          </Boton>
        </div>
      </Dialogo>
    </div>
  )
}
