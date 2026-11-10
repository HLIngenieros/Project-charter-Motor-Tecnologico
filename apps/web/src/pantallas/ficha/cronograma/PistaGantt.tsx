import { aDia, sumarDias, type FechaISO, type NodoArbol, type ResultadoNodo } from '@charter/shared'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { fechaCorta } from '../../../formato'
import { aPorcentaje, diasPorPixel, type Rango } from './escala'

export type Extremo = 'ambos' | 'inicio' | 'fin'

/** Avance real de una hoja, del color de su semáforo. */
export const COLOR_AVANCE: Record<string, string> = {
  terminada: 'bg-ok',
  al_dia: 'bg-ok',
  en_atencion: 'bg-amarillo',
  en_riesgo: 'bg-naranja',
  atrasada: 'bg-alerta',
  vencida: 'bg-vencida',
}

interface Arrastre {
  extremo: Extremo
  x0: number
  diasPx: number
  dias: number
}

/** Aplica el desplazamiento del arrastre a las fechas, sin dejar el fin antes del inicio. */
function desplazar(inicio: FechaISO, fin: FechaISO, dias: number, extremo: Extremo) {
  let i = extremo === 'fin' ? inicio : sumarDias(inicio, dias)
  let f = extremo === 'inicio' ? fin : sumarDias(fin, dias)
  if (extremo === 'inicio' && i > f) i = f
  if (extremo === 'fin' && f < i) f = i
  return { inicio: i, fin: f }
}

const textoFechas = (i: FechaISO, f: FechaISO) =>
  `${fechaCorta(i)} – ${fechaCorta(f)} · ${aDia(f) - aDia(i) + 1} días`

export function PistaGantt({
  nodo,
  resultado,
  rango,
  fechaCorte,
  marcas,
  soloLectura,
  alMover,
}: {
  nodo: NodoArbol
  resultado: ResultadoNodo | undefined
  rango: Rango
  fechaCorte: FechaISO
  marcas: { fecha: FechaISO }[]
  soloLectura: boolean
  alMover(dias: number, extremo: Extremo): void
}) {
  const pista = useRef<HTMLDivElement>(null)
  const [arrastre, setArrastre] = useState<Arrastre | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)

  // Una hoja muestra sus fechas aunque no tenga peso; una agrupadora, las calculadas.
  const base = nodo.esHoja
    ? nodo.inicio && nodo.fin && nodo.fin >= nodo.inicio
      ? { inicio: nodo.inicio, fin: nodo.fin }
      : null
    : resultado?.inicio && resultado.fin
      ? { inicio: resultado.inicio, fin: resultado.fin }
      : null
  const fechas =
    base && arrastre ? desplazar(base.inicio, base.fin, arrastre.dias, arrastre.extremo) : base
  const editable = nodo.esHoja && !soloLectura && !!base

  const corte = aPorcentaje(fechaCorte, rango)
  const lineas = marcas.map((m) => (
    <span
      key={m.fecha}
      aria-hidden
      className="absolute inset-y-0 border-l border-linea-2"
      style={{ left: `${aPorcentaje(m.fecha, rango)}%` }}
    />
  ))
  const lineaCorte = corte >= 0 && corte <= 100 && (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-[2] -ml-px w-0.5 bg-acento"
      style={{ left: `${corte}%` }}
    />
  )
  if (!fechas) {
    return (
      <div ref={pista} className="relative h-full min-h-9 overflow-hidden">
        {lineas}
        {lineaCorte}
      </div>
    )
  }

  const izq = aPorcentaje(fechas.inicio, rango)
  const ancho = aPorcentaje(sumarDias(fechas.fin, 1), rango) - izq
  const avance = (resultado?.ev ?? 0) * 100

  const empezar = (extremo: Extremo) => (e: PointerEvent<HTMLElement>) => {
    if (!editable || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const anchoPx = pista.current?.getBoundingClientRect().width ?? 0
    setArrastre({ extremo, x0: e.clientX, diasPx: diasPorPixel(rango, anchoPx), dias: 0 })
    setTip({ x: e.clientX, y: e.clientY })
  }
  const mover = (e: PointerEvent<HTMLElement>) => {
    if (!arrastre) return
    const dias = Math.round((e.clientX - arrastre.x0) * arrastre.diasPx)
    if (dias !== arrastre.dias) setArrastre({ ...arrastre, dias })
    setTip({ x: e.clientX, y: e.clientY })
  }
  const soltar = () => {
    if (arrastre?.dias) alMover(arrastre.dias, arrastre.extremo)
    setArrastre(null)
    setTip(null)
  }
  const eventos = (extremo: Extremo) => ({
    onPointerDown: empezar(extremo),
    onPointerMove: mover,
    onPointerUp: soltar,
    onPointerCancel: soltar,
  })

  const tecla = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    alMover(e.key === 'ArrowRight' ? 1 : -1, e.shiftKey ? 'fin' : 'ambos')
  }

  const asa = (extremo: 'inicio' | 'fin') => (
    <span
      data-testid={`asa-${extremo}-${nodo.id}`}
      aria-hidden
      {...eventos(extremo)}
      className={`absolute inset-y-0 z-[1] w-1.5 cursor-ew-resize ${extremo === 'inicio' ? 'left-0' : 'right-0'} after:absolute after:inset-y-0.5 after:w-[3px] after:rounded-sm after:bg-institucional after:opacity-0 after:transition-opacity group-hover:after:opacity-55 ${extremo === 'inicio' ? 'after:left-0.5' : 'after:right-0.5'} ${arrastre ? 'after:opacity-55' : ''}`}
    />
  )

  return (
    <div ref={pista} className="relative h-full min-h-9 overflow-hidden">
      {lineas}
      {lineaCorte}
      {nodo.esHoja ? (
        <span
          {...(editable
            ? {
                role: 'slider',
                tabIndex: 0,
                'aria-label': `Fechas de ${nodo.nombre || nodo.item}`,
                'aria-valuemin': aDia(rango.desde),
                'aria-valuemax': aDia(rango.hasta),
                'aria-valuenow': aDia(fechas.inicio),
                'aria-valuetext': `${fechaCorta(fechas.inicio)} a ${fechaCorta(fechas.fin)}`,
                onKeyDown: tecla,
                ...eventos('ambos'),
              }
            : {})}
          className={`group absolute top-[11px] h-3.5 min-w-[5px] touch-none rounded bg-barra transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${editable ? (arrastre ? 'cursor-grabbing shadow-flota' : 'cursor-grab hover:shadow-[0_0_0_2px_rgb(0_51_102/0.18)]') : ''}`}
          style={{ left: `${izq}%`, width: `${ancho}%` }}
        >
          <span
            className={`absolute inset-y-0 left-0 rounded ${COLOR_AVANCE[resultado?.estado ?? ''] ?? 'bg-transparent'}`}
            style={{ width: `${avance}%` }}
          />
          {editable && asa('inicio')}
          {editable && asa('fin')}
        </span>
      ) : (
        <span
          className="absolute top-[15px] h-[7px] rounded bg-tinta/18"
          style={{ left: `${izq}%`, width: `${ancho}%` }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded bg-tinta"
            style={{ width: `${avance}%` }}
          />
        </span>
      )}
      {tip && (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-50 rounded-[6px] bg-tinta px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-flota"
          style={{ left: tip.x + 12, top: tip.y - 40 }}
        >
          {textoFechas(fechas.inicio, fechas.fin)}
        </span>
      )}
    </div>
  )
}
