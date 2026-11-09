import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ErrorCliente } from '../../api/cliente'

export type EstadoGuardado = 'guardado' | 'guardando' | 'error'

export interface ColaGuardado {
  estado: EstadoGuardado
  /** Marca ISO del último vaciado exitoso de la cola. */
  ultimoGuardado: string | null
  error: ErrorCliente | null
  encolar(tarea: () => Promise<unknown>): void
  reintentar(): void
}

function comoErrorCliente(e: unknown): ErrorCliente {
  return e instanceof ErrorCliente
    ? e
    : new ErrorCliente(0, 'error_desconocido', 'Algo falló. Intenta de nuevo.')
}

/** Pide confirmar antes de cerrar la pestaña. */
function avisarAlSalir(e: BeforeUnloadEvent) {
  e.preventDefault()
  e.returnValue = ''
}

/**
 * Cola serial de guardados: corre las tareas de una en una y en orden, así el último
 * valor siempre llega de último. Si una falla, la cola se detiene (sin perder las
 * siguientes) hasta `reintentar`. Mientras haya trabajo pendiente pide confirmar al salir.
 */
export function useColaGuardado(): ColaGuardado {
  const pendientes = useRef<(() => Promise<unknown>)[]>([])
  const corriendo = useRef(false)
  const detenida = useRef(false)
  const [estado, setEstado] = useState<EstadoGuardado>('guardado')
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null)
  const [error, setError] = useState<ErrorCliente | null>(null)
  const [hayPendientes, setHayPendientes] = useState(false)

  const avanzar = useCallback(async () => {
    if (corriendo.current || detenida.current) return
    corriendo.current = true
    setEstado('guardando')
    setError(null)
    while (pendientes.current.length > 0) {
      try {
        await pendientes.current[0]!()
        pendientes.current.shift()
      } catch (e) {
        corriendo.current = false
        detenida.current = true
        setError(comoErrorCliente(e))
        setEstado('error')
        return
      }
    }
    corriendo.current = false
    setHayPendientes(false)
    setUltimoGuardado(new Date().toISOString())
    setEstado('guardado')
  }, [])

  const encolar = useCallback(
    (tarea: () => Promise<unknown>) => {
      pendientes.current.push(tarea)
      setHayPendientes(true)
      void avanzar()
    },
    [avanzar],
  )

  const reintentar = useCallback(() => {
    detenida.current = false
    void avanzar()
  }, [avanzar])

  useEffect(() => {
    if (!hayPendientes) return
    window.addEventListener('beforeunload', avisarAlSalir)
    return () => window.removeEventListener('beforeunload', avisarAlSalir)
  }, [hayPendientes])

  return { estado, ultimoGuardado, error, encolar, reintentar }
}

export const ContextoGuardado = createContext<ColaGuardado | null>(null)

export function useGuardado(): ColaGuardado {
  const cola = useContext(ContextoGuardado)
  if (!cola) throw new Error('useGuardado va dentro de ContextoGuardado')
  return cola
}
