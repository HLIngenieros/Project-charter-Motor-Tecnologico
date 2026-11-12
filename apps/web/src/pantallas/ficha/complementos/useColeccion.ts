import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useGuardado } from '../colaGuardado'

/** Espera sin teclear antes de guardar mientras se escribe (como las listas de la ficha). */
const ESPERA_MS = 800

export interface OpcionesColeccion<T extends { id: string }> {
  inicial: T[]
  /** Guarda la colección completa; se encola en la cola de la ficha. */
  guardar(items: T[]): Promise<unknown>
  /** Fila sin nada escrito: no se envía y desaparece al salir de ella. */
  vacia(item: T): boolean
  /** Se aplica al enviar y al salir (p. ej. quitar líneas vacías de un rubro). */
  limpiar?(item: T): T
  maximo: number
}

export interface Coleccion<T extends { id: string }> {
  filas: T[]
  /** Cambia una fila: guarda a los 800 ms sin cambios, o ya con `inmediato`. */
  editar(id: string, cambios: Partial<T>, inmediato?: boolean): void
  agregar(nueva: T, despuesDe?: number): void
  quitar(id: string): void
  mover(id: string, paso: -1 | 1): void
  /** El foco salió de la fila: se limpia, se quita si quedó vacía y se envía. */
  salir(id: string): void
  /** Envía ya lo pendiente (al salir de un campo). */
  enviar(): void
  /** Id de la fila que debe recibir el foco tras el próximo render. */
  porEnfocar: RefObject<string | null>
}

/**
 * Copia local de una colección de la ficha (indicadores, riesgos, rubros) que se guarda
 * completa por la cola. Los ids los genera la web y son estables, así que la copia local
 * nunca adopta la respuesta de la API: lo que se escribe mientras un envío va en camino no
 * se pisa, y el siguiente envío lleva lo último.
 */
export function useColeccion<T extends { id: string }>({
  inicial,
  guardar,
  vacia,
  limpiar,
  maximo,
}: OpcionesColeccion<T>): Coleccion<T> {
  const { encolar } = useGuardado()
  const [filas, setFilas] = useState(inicial)
  /** Copia síncrona de `filas` para los manejadores que corren antes del render. */
  const actuales = useRef(inicial)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const porEnfocar = useRef<string | null>(null)
  /** Lo que se pasa por las props cambia en cada render: se lee por ref. */
  const opciones = useRef({ guardar, vacia, limpiar })
  useEffect(() => {
    opciones.current = { guardar, vacia, limpiar }
  })

  const paraEnviar = useCallback((lista: T[]) => {
    const { vacia, limpiar } = opciones.current
    return lista.map((f) => (limpiar ? limpiar(f) : f)).filter((f) => !vacia(f))
  }, [])

  /** Firma de lo último enviado (o recibido): si no cambia, no se envía. */
  const [firmaInicial] = useState(() =>
    JSON.stringify(inicial.map((f) => (limpiar ? limpiar(f) : f)).filter((f) => !vacia(f))),
  )
  const enviados = useRef(firmaInicial)

  useEffect(() => () => clearTimeout(espera.current), [])

  const enviar = useCallback(() => {
    clearTimeout(espera.current)
    const items = paraEnviar(actuales.current)
    const firma = JSON.stringify(items)
    if (firma === enviados.current) return
    enviados.current = firma
    encolar(() => opciones.current.guardar(items))
  }, [encolar, paraEnviar])

  const cambiar = useCallback(
    (nuevas: T[], guardarYa = false) => {
      actuales.current = nuevas
      setFilas(nuevas)
      if (guardarYa) enviar()
    },
    [enviar],
  )

  const editar = useCallback(
    (id: string, cambios: Partial<T>, inmediato = false) => {
      cambiar(actuales.current.map((f) => (f.id === id ? { ...f, ...cambios } : f)))
      clearTimeout(espera.current)
      if (inmediato) enviar()
      else espera.current = setTimeout(enviar, ESPERA_MS)
    },
    [cambiar, enviar],
  )

  const agregar = useCallback(
    (nueva: T, despuesDe?: number) => {
      if (actuales.current.length >= maximo) return
      const lista = [...actuales.current]
      lista.splice(despuesDe === undefined ? lista.length : despuesDe + 1, 0, nueva)
      porEnfocar.current = nueva.id
      cambiar(lista)
    },
    [cambiar, maximo],
  )

  const quitar = useCallback(
    (id: string) =>
      cambiar(
        actuales.current.filter((f) => f.id !== id),
        true,
      ),
    [cambiar],
  )

  const mover = useCallback(
    (id: string, paso: -1 | 1) => {
      const i = actuales.current.findIndex((f) => f.id === id)
      const j = i + paso
      if (i < 0 || j < 0 || j >= actuales.current.length) return
      const lista = [...actuales.current]
      const [fila] = lista.splice(i, 1)
      lista.splice(j, 0, fila!)
      porEnfocar.current = id
      cambiar(lista, true)
    },
    [cambiar],
  )

  const salir = useCallback(
    (id: string) => {
      const { vacia, limpiar } = opciones.current
      const fila = actuales.current.find((f) => f.id === id)
      if (fila) {
        const limpia = limpiar ? limpiar(fila) : fila
        if (vacia(limpia)) cambiar(actuales.current.filter((f) => f.id !== id))
        else if (limpia !== fila) cambiar(actuales.current.map((f) => (f.id === id ? limpia : f)))
      }
      enviar()
    },
    [cambiar, enviar],
  )

  return { filas, editar, agregar, quitar, mover, salir, enviar, porEnfocar }
}
