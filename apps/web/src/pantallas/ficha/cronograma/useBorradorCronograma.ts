import {
  calcularCronograma,
  construirArbol,
  validarCronograma,
  type ActividadEntrada,
  type Aviso,
  type AvancesPorHoja,
  type FechaISO,
  type NodoArbol,
  type ResultadoCronograma,
  type Reglas,
} from '@charter/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorCliente } from '../../../api/cliente'
import { useCronograma, useGuardarCronograma } from '../../../api/cronograma'
import { hoyISO } from '../../../formato'
import type { ColaGuardado } from '../colaGuardado'

/** Espera tras el último cambio antes de enviar el árbol (una ráfaga de arrastres = un PUT). */
export const ESPERA_GUARDADO = 800

export interface BorradorCronograma {
  cargando: boolean
  error: ErrorCliente | null
  acts: ActividadEntrada[]
  arbol: NodoArbol[]
  calculo: ResultadoCronograma
  avisos: Aviso[]
  avances: AvancesPorHoja
  fechaCalculo: FechaISO
  /** Fecha del último corte; null si aún no hay cortes. */
  fechaCorte: FechaISO | null
  aplicar(op: (a: ActividadEntrada[]) => ActividadEntrada[]): void
  conflicto: boolean
  recargar(): void
}

/**
 * Copia local del cronograma: se edita al instante y se guarda completa por la cola de la
 * ficha (`encolar`). La versión vigente vive en un ref, así cada PUT usa la que devolvió el anterior.
 */
export function useBorradorCronograma(
  id: string,
  encolar: ColaGuardado['encolar'],
  reglas: Reglas,
): BorradorCronograma {
  const consulta = useCronograma(id)
  const { mutateAsync } = useGuardarCronograma(id)
  /** Lo editado aquí; null mientras manda lo que trae la API (al cargar o recargar). */
  const [local, setLocal] = useState<ActividadEntrada[] | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const version = useRef(0)
  const ultimo = useRef<ActividadEntrada[]>([])
  const adoptado = useRef(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const datos = consulta.data
  // `aplicar` lee estos dos por ref: así su identidad no cambia con cada respuesta del PUT y
  // las filas del Gantt (con `memo`) no se rehacen todas al guardar.
  const datosRef = useRef(datos)
  const conflictoRef = useRef(conflicto)
  useEffect(() => {
    datosRef.current = datos
    conflictoRef.current = conflicto
  }, [datos, conflicto])

  const enviar = useCallback(() => {
    temporizador.current = null
    encolar(async () => {
      try {
        const r = await mutateAsync({ version: version.current, actividades: ultimo.current })
        version.current = r.version
      } catch (e) {
        if (e instanceof ErrorCliente && e.codigo === 'cronograma_desactualizado') {
          setConflicto(true)
          return
        }
        throw e
      }
    })
  }, [encolar, mutateAsync])

  // Al salir de la ficha, lo pendiente se envía de inmediato.
  useEffect(
    () => () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current)
        enviar()
      }
    },
    [enviar],
  )

  const aplicar = useCallback(
    (op: (a: ActividadEntrada[]) => ActividadEntrada[]) => {
      const datos = datosRef.current
      if (conflictoRef.current || !datos) return
      // La primera edición parte de lo que trajo la API, con su versión.
      if (!adoptado.current) {
        adoptado.current = true
        version.current = datos.version
        ultimo.current = datos.actividades
      }
      const siguiente = op(ultimo.current)
      if (siguiente === ultimo.current) return
      ultimo.current = siguiente
      setLocal(siguiente)
      if (temporizador.current) clearTimeout(temporizador.current)
      temporizador.current = setTimeout(enviar, ESPERA_GUARDADO)
    },
    [enviar],
  )

  const recargar = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
    adoptado.current = false
    setConflicto(false)
    setLocal(null)
    void consulta.refetch()
  }, [consulta])

  const acts = local ?? datos?.actividades ?? null
  const lista = useMemo(() => acts ?? [], [acts])
  const ultimoCorte = datos?.ultimoCorte ?? null
  const fechaCalculo = ultimoCorte?.fecha ?? hoyISO()
  const avances = useMemo(() => ultimoCorte?.avances ?? {}, [ultimoCorte])
  const { arbol, calculo, avisos } = useMemo(() => {
    const arbol = construirArbol(lista)
    return {
      arbol,
      calculo: calcularCronograma(arbol, avances, fechaCalculo, reglas),
      avisos: lista.length ? validarCronograma(arbol, reglas) : [],
    }
  }, [lista, avances, fechaCalculo, reglas])

  return {
    cargando: acts === null && !consulta.isError,
    error: consulta.error instanceof ErrorCliente ? consulta.error : null,
    acts: lista,
    arbol,
    calculo,
    avisos,
    avances,
    fechaCalculo,
    fechaCorte: ultimoCorte?.fecha ?? null,
    aplicar,
    conflicto,
    recargar,
  }
}
