import {
  arbolHistorico,
  calcularCronograma,
  construirArbol,
  type AvanceFoto,
  type CorteResumen,
  type FechaISO,
  type Reglas,
} from '@charter/shared'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useCorte, useCortes } from '../../api/cronograma'
import type { BorradorCronograma } from './cronograma/useBorradorCronograma'

export interface Historica {
  fecha: FechaISO
  /** Posición del corte, contando desde 1 por el más viejo. */
  indice: number
  total: number
  foto: AvanceFoto[]
  noExistia: Set<string>
  eliminadas: AvanceFoto[]
  /** Lo guardado al registrar el corte: manda en la banda. */
  resumen: CorteResumen
}

/** Lo que muestran banda, curva y Gantt: el borrador en vivo o la ficha en un corte pasado. */
export interface VistaCronograma extends BorradorCronograma {
  /** null en la vista actual. En la histórica, `aplicar` no hace nada. */
  historica: Historica | null
  /** El cálculo en vivo difiere de lo guardado en el último corte. */
  lineaBaseModificada: boolean
}

export interface ControlCorte {
  /** Cortes del más viejo al más reciente. */
  cortes: CorteResumen[]
  /** Fecha del corte que se ve; null = el último (vista actual). */
  corteElegido: FechaISO | null
  elegirCorte(fecha: FechaISO | null): void
  avisoCorte: string | null
  /** Se pidió un corte en la URL y la lista de cortes aún no llega. */
  resolviendoCorte: boolean
}

const MARGEN = 1e-4
const NADA = () => {}

/** Lee el corte elegido de `?corte=` y arma la vista del cronograma para esa fecha. */
export function useVistaCronograma(
  charterId: string,
  borrador: BorradorCronograma,
  reglas: Reglas,
): VistaCronograma & ControlCorte {
  const [params, setParams] = useSearchParams()
  const consulta = useCortes(charterId)
  const cortes = useMemo(
    () => [...(consulta.data ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [consulta.data],
  )
  const ultimo = cortes.at(-1) ?? null
  const pedido = params.get('corte')
  const indice = pedido ? cortes.findIndex((c) => c.fecha === pedido) : -1
  const elegido = indice >= 0 && indice < cortes.length - 1 ? cortes[indice]! : null
  const avisoCorte =
    pedido && consulta.isSuccess && indice < 0
      ? 'No hay un corte en esa fecha; se muestra el último.'
      : null

  const elegirCorte = useCallback(
    (fecha: FechaISO | null) =>
      setParams((p) => {
        const s = new URLSearchParams(p)
        if (!fecha || fecha === ultimo?.fecha) s.delete('corte')
        else s.set('corte', fecha)
        return s
      }),
    [setParams, ultimo?.fecha],
  )

  const detalle = useCorte(charterId, elegido?.fecha ?? null)
  const foto = detalle.data?.avances

  const historica = useMemo(() => {
    if (!elegido) return null
    const h = arbolHistorico(borrador.acts, foto ?? [])
    const arbol = construirArbol(h.acts)
    const calculo = calcularCronograma(arbol, h.avances, elegido.fecha, reglas)
    const { pv, ev, desv, estado, vencidas } = elegido
    return {
      acts: h.acts,
      arbol,
      avances: h.avances,
      calculo: { ...calculo, proyecto: { ...calculo.proyecto, pv, ev, desv, estado, vencidas } },
      historica: {
        fecha: elegido.fecha,
        indice: indice + 1,
        total: cortes.length,
        foto: foto ?? [],
        noExistia: h.noExistia,
        eliminadas: h.eliminadas,
        resumen: elegido,
      },
    }
  }, [elegido, foto, borrador.acts, reglas, indice, cortes.length])

  const lineaBaseModificada =
    !historica &&
    !borrador.cargando &&
    !!ultimo &&
    borrador.fechaCorte === ultimo.fecha &&
    (Math.abs(borrador.calculo.proyecto.pv - ultimo.pv) > MARGEN ||
      Math.abs(borrador.calculo.proyecto.ev - ultimo.ev) > MARGEN)

  const control = {
    cortes,
    corteElegido: elegido?.fecha ?? null,
    elegirCorte,
    avisoCorte,
    resolviendoCorte: !!pedido && consulta.isPending,
  }
  if (!historica) return { ...borrador, historica: null, lineaBaseModificada, ...control }
  return {
    ...borrador,
    acts: historica.acts,
    arbol: historica.arbol,
    avances: historica.avances,
    calculo: historica.calculo,
    avisos: [],
    fechaCalculo: historica.historica.fecha,
    fechaCorte: historica.historica.fecha,
    cargando: borrador.cargando || detalle.isPending,
    aplicar: NADA,
    conflicto: false,
    historica: historica.historica,
    lineaBaseModificada: false,
    ...control,
  }
}
