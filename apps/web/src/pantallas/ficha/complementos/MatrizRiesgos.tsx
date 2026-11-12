import { nivelRiesgo, type Riesgo } from '@charter/shared'
import { ESCALA, enumerar, NIVELES } from './nivel'

/** Geometría en unidades del `viewBox`. */
const IZQ = 34
const ARRIBA = 4
const C = 48
const ABAJO = 34
const ANCHO = IZQ + 5 * C + 4
const ALTO = ARRIBA + 5 * C + ABAJO
const R = 9.5
const D = 11

/** Posiciones dentro de la casilla según cuántos puntos se ven (hasta 4, en 2 × 2). */
function posiciones(n: number): [number, number][] {
  if (n === 1) return [[0, 0]]
  if (n === 2)
    return [
      [-D, 0],
      [D, 0],
    ]
  return [
    [-D, -D],
    [D, -D],
    [-D, D],
    [D, D],
  ]
}

interface Ubicado {
  riesgo: Riesgo
  n: number
}

export interface MatrizRiesgosProps {
  /** El número de cada riesgo es su posición + 1. */
  riesgos: Riesgo[]
  resaltado?: string | null
  alResaltar?(id: string | null): void
  /** PDF: sin foco ni eventos. */
  estatica?: boolean
}

/**
 * Matriz 5 × 5 de probabilidad (vertical, 5 arriba) por impacto (horizontal, 5 a la derecha).
 * Cada riesgo calificado es un punto con su número; los que caen en la misma casilla se
 * acomodan en 2 × 2 y, si no caben, la cuarta posición dice «+n».
 */
export function MatrizRiesgos({
  riesgos,
  resaltado = null,
  alResaltar,
  estatica = false,
}: MatrizRiesgosProps) {
  const casillas = new Map<string, Ubicado[]>()
  riesgos.forEach((riesgo, i) => {
    if (riesgo.probabilidad == null || riesgo.impacto == null) return
    const clave = `${riesgo.probabilidad}-${riesgo.impacto}`
    casillas.set(clave, [...(casillas.get(clave) ?? []), { riesgo, n: i + 1 }])
  })
  const vacia = casillas.size === 0

  return (
    <div
      role="group"
      aria-label="Matriz de probabilidad e impacto"
      data-vacia={vacia || undefined}
      className={`transition-opacity duration-200 ${vacia ? 'opacity-55' : ''}`}
    >
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="block h-auto w-full overflow-visible">
        <g aria-hidden>
          {ESCALA.map((p) =>
            ESCALA.map((imp) => {
              const nivel = nivelRiesgo(p, imp)!.nivel
              return (
                <rect
                  key={`${p}-${imp}`}
                  x={IZQ + (imp - 1) * C + 1}
                  y={ARRIBA + (5 - p) * C + 1}
                  width={C - 2}
                  height={C - 2}
                  rx={5}
                  className={NIVELES[nivel].casilla}
                />
              )
            }),
          )}
          {ESCALA.map((p) => (
            <text
              key={`p${p}`}
              x={IZQ - 7}
              y={ARRIBA + (5 - p) * C + C / 2}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-texto-2 font-cifra text-[11px]"
            >
              {p}
            </text>
          ))}
          {ESCALA.map((imp) => (
            <text
              key={`i${imp}`}
              x={IZQ + (imp - 1) * C + C / 2}
              y={ARRIBA + 5 * C + 12}
              textAnchor="middle"
              className="fill-texto-2 font-cifra text-[11px]"
            >
              {imp}
            </text>
          ))}
          <text
            x={IZQ + (5 * C) / 2}
            y={ALTO - 3}
            textAnchor="middle"
            className="fill-texto-2 text-[11px] font-semibold"
          >
            Impacto
          </text>
          <text
            transform={`translate(9 ${ARRIBA + (5 * C) / 2}) rotate(-90)`}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-texto-2 text-[11px] font-semibold"
          >
            Probabilidad
          </text>
        </g>
        {[...casillas.entries()].map(([clave, ubicados]) => {
          const [p, imp] = clave.split('-').map(Number) as [number, number]
          const cx = IZQ + (imp - 1) * C + C / 2
          const cy = ARRIBA + (5 - p) * C + C / 2
          const sobran = ubicados.length > 4 ? ubicados.length - 3 : 0
          const visibles = sobran ? ubicados.slice(0, 3) : ubicados
          const lugares = posiciones(sobran ? 4 : visibles.length)
          return (
            <g
              key={clave}
              role="group"
              aria-label={`Probabilidad ${p}, impacto ${imp}: ${ubicados.length === 1 ? 'riesgo' : 'riesgos'} ${enumerar(ubicados.map((u) => u.n))}`}
            >
              {visibles.map(({ riesgo, n }, k) => {
                const [dx, dy] = lugares[k]!
                const activo = resaltado === riesgo.id
                const nivel = nivelRiesgo(p, imp)!.nivel
                return (
                  <g
                    key={riesgo.id}
                    role="img"
                    aria-label={`Riesgo ${n}: ${riesgo.riesgo.trim() || 'Sin descripción'}, probabilidad ${p}, impacto ${imp}, nivel ${NIVELES[nivel].texto.toLowerCase()}`}
                    data-resaltado={activo || undefined}
                    tabIndex={estatica ? undefined : 0}
                    onFocus={estatica ? undefined : () => alResaltar?.(riesgo.id)}
                    onBlur={estatica ? undefined : () => alResaltar?.(null)}
                    onMouseEnter={estatica ? undefined : () => alResaltar?.(riesgo.id)}
                    onMouseLeave={estatica ? undefined : () => alResaltar?.(null)}
                    transform={`translate(${cx + dx} ${cy + dy})`}
                    className={estatica ? undefined : 'cursor-default outline-none'}
                  >
                    <circle
                      r={R + 3}
                      className={`fill-none stroke-acento transition-opacity duration-150 ${activo ? 'opacity-100' : 'opacity-0'}`}
                      strokeWidth={2.5}
                    />
                    <circle r={R} className="fill-tinta" />
                    <text
                      aria-hidden
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none fill-white font-cifra text-[11px] font-semibold"
                    >
                      {n}
                    </text>
                  </g>
                )
              })}
              {sobran > 0 && (
                <text
                  aria-hidden
                  x={cx + lugares[3]![0]}
                  y={cy + lugares[3]![1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-tinta font-cifra text-[11px] font-semibold"
                >
                  +{sobran}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
