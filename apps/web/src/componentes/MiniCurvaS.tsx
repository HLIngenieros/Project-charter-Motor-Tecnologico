import type { Estado, FechaISO } from '@charter/shared'
import { diasEntre } from '../formato'

export interface PuntoMini {
  fecha: FechaISO
  pv: number
  ev: number
}

const RELLENO: Record<Estado, string> = {
  al_dia: 'fill-ok',
  terminada: 'fill-ok',
  en_atencion: 'fill-amarillo stroke-amarillo-texto',
  en_riesgo: 'fill-naranja',
  atrasada: 'fill-alerta',
  vencida: 'fill-vencida',
  por_iniciar: 'fill-texto-3',
  sin_programar: 'fill-texto-3',
}

const MARGEN = 4

/**
 * Curva S en miniatura: planeado y real en los cortes, sin ejes ni interacción.
 * El eje vertical va de 0 a 100 % como la curva grande. `extra` es un punto nuevo
 * (el corte que se está registrando) que se suma al final y lleva el punto de estado.
 */
export function MiniCurvaS({
  puntos,
  extra,
  estado,
  ancho = 120,
  alto = 36,
}: {
  puntos: PuntoMini[]
  extra?: PuntoMini
  estado?: Estado
  ancho?: number
  alto?: number
}) {
  const serie = extra ? [...puntos.filter((p) => p.fecha < extra.fecha), extra] : puntos
  if (serie.length === 0) return null

  const inicio = serie[0]!.fecha
  const total = diasEntre(inicio, serie[serie.length - 1]!.fecha)
  const x = (f: FechaISO) =>
    total > 0 ? MARGEN + (diasEntre(inicio, f) / total) * (ancho - 2 * MARGEN) : ancho - MARGEN
  const y = (v: number) => MARGEN + (1 - Math.min(1, Math.max(0, v))) * (alto - 2 * MARGEN)
  const trazo = (v: (p: PuntoMini) => number) =>
    serie.map((p, i) => `${i ? 'L' : 'M'}${x(p.fecha).toFixed(1)} ${y(v(p)).toFixed(1)}`).join(' ')

  const ultimo = serie[serie.length - 1]!
  return (
    <svg
      aria-hidden="true"
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      className="overflow-visible"
    >
      <line
        x1={MARGEN}
        x2={ancho - MARGEN}
        y1={alto - MARGEN}
        y2={alto - MARGEN}
        className="stroke-linea"
        strokeWidth={1}
      />
      <path
        d={trazo((p) => p.pv)}
        fill="none"
        className="stroke-institucional"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d={trazo((p) => p.ev)}
        fill="none"
        className="stroke-acento"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        data-punto-final
        cx={x(ultimo.fecha)}
        cy={y(ultimo.ev)}
        r={3}
        className={estado ? RELLENO[estado] : 'fill-acento'}
        strokeWidth={estado === 'en_atencion' ? 1 : 0}
      />
    </svg>
  )
}
