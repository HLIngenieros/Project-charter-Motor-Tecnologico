import {
  aDia,
  aISO,
  type Estado,
  type FechaISO,
  type PuntoPlan,
  type PuntoReal,
} from '@charter/shared'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { fechaCorta } from '../../../formato'
import { useMovimientoReducido } from '../../../movimiento'
import { ETIQUETA_ESTADO } from '../cronograma/estados'
import { dominio, escalaX, escalaY, tramosBrecha, trazo, valorEn, type Zoom } from './geometria'

/** Lo que marca el puntero (o nada): fecha y valores leídos. */
export interface Marca {
  fecha: FechaISO
  pv: number
  ev: number | null
  proyectada: boolean
}

const RELLENO: Record<Estado, string> = {
  al_dia: 'fill-ok',
  terminada: 'fill-ok',
  en_atencion: 'fill-amarillo',
  en_riesgo: 'fill-naranja',
  atrasada: 'fill-alerta',
  vencida: 'fill-vencida',
  por_iniciar: 'fill-texto-3',
  sin_programar: 'fill-texto-3',
}

const PUNTO: Record<Estado, string> = {
  al_dia: 'bg-ok',
  terminada: 'bg-ok',
  en_atencion: 'bg-amarillo',
  en_riesgo: 'bg-naranja',
  atrasada: 'bg-alerta',
  vencida: 'bg-vencida',
  por_iniciar: 'bg-texto-3',
  sin_programar: 'bg-texto-3',
}

const N_TRAMO = 14
const IMAN = 9
const salida = [0.22, 1, 0.36, 1] as const
const NADA = () => {}

/** `d` como atributo (para quien no anima por CSS) y como estilo (para que la geometría se transforme). */
const geo = (d: string, retrasoTrazo?: number): { d: string; style: CSSProperties } => ({
  d,
  style: {
    d: `path("${d || 'M0 0'}")`,
    ...(retrasoTrazo !== undefined ? { animationDelay: `${retrasoTrazo}s` } : {}),
  } as CSSProperties,
})

function useAncho(fijo?: number, inicial = 880) {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(fijo ?? inicial)
  useEffect(() => {
    const el = ref.current
    if (fijo !== undefined || !el || typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(([e]) => {
      const w = Math.round(e!.contentRect.width)
      if (w > 0) setAncho((a) => (Math.abs(a - w) > 2 ? w : a))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [fijo])
  return [ref, ancho] as const
}

function meses(desde: number, hasta: number): { dia: number; etiqueta: string }[] {
  const salida: { dia: number; etiqueta: string }[] = []
  const [a, m] = aISO(desde).split('-').map(Number) as [number, number]
  for (let anio = a, mes = m; ; mes++) {
    if (mes > 12) {
      mes = 1
      anio++
    }
    const iso = `${anio}-${String(mes).padStart(2, '0')}-01`
    const dia = aDia(iso)
    if (dia > hasta) break
    if (dia < desde) continue
    const [, nombre] = fechaCorta(iso).split(' ')
    salida.push({ dia, etiqueta: mes === 1 ? `${nombre} ${anio}` : nombre! })
  }
  return salida
}

export function CurvaS({
  planeada,
  reales,
  vigente,
  proyeccion,
  guardado,
  finProyectado,
  zoom,
  marca,
  alPuntero = NADA,
  elegirCorte = NADA,
  etiqueta,
  estatica = false,
  ancho: anchoFijo,
}: {
  planeada: PuntoPlan[]
  /** Todos los cortes, del más viejo al más reciente (el último, en vivo en la vista actual). */
  reales: PuntoReal[]
  /** Posición del corte que se ve; los posteriores van tenues. −1 sin cortes. */
  vigente: number
  proyeccion: PuntoPlan[]
  /** Lo guardado en el último corte cuando la línea base cambió después: referencia tenue. */
  guardado: PuntoReal | null
  finProyectado: FechaISO | null
  zoom: Zoom
  marca: Marca | null
  alPuntero?(fecha: FechaISO | null): void
  elegirCorte?(fecha: FechaISO): void
  /** Resumen accesible de la gráfica. */
  etiqueta: string
  /** Para imprimir: sin animaciones, sin puntero y con los cortes como puntos del SVG. */
  estatica?: boolean
  /** Ancho fijo en px; sin él, la gráfica mide su contenedor. */
  ancho?: number
}) {
  const reducido = useMovimientoReducido() || estatica
  const [lienzo, ancho] = useAncho(anchoFijo)
  const movil = ancho < 640
  const alto = movil ? 260 : 380
  const m = { l: movil ? 38 : 52, r: movil ? 10 : 20, t: 22, b: movil ? 62 : 66 }
  const pw = Math.max(10, ancho - m.l - m.r)
  const ph = alto - m.t - m.b
  const yBase = m.t + ph

  const dom = dominio(planeada, reales, proyeccion, zoom)
  const sx = escalaX(dom, pw)
  const sy = escalaY(dom, ph)
  const x = (f: FechaISO | number) => m.l + sx(f)
  const y = (v: number) => m.t + sy(v)
  const pvEn = (dia: number) => valorEn(planeada, dia)

  const inicio = planeada[0]?.fecha
  const arranque =
    inicio && reales[0] && aDia(inicio) < aDia(reales[0].fecha) ? [{ fecha: inicio, ev: 0 }] : []
  const serieReal = [...arranque, ...reales.map((r) => ({ fecha: r.fecha, ev: r.ev }))]
  const corteReal = arranque.length + vigente
  const pts = (s: { fecha: FechaISO; ev: number }[]) =>
    s.map((p) => ({ x: x(p.fecha), y: y(p.ev) }))
  const dReal = trazo(pts(serieReal.slice(0, corteReal + 1)))
  const dRealDespues = trazo(pts(serieReal.slice(corteReal)))
  const dPlan = trazo(planeada.map((p) => ({ x: x(p.fecha), y: y(p.pv) })))
  const dProy = trazo(proyeccion.map((p) => ({ x: x(p.fecha), y: y(p.pv) })))

  const tramos = tramosBrecha(planeada, reales).map((t, i) => {
    const a = aDia(t.desde)
    const b = aDia(t.hasta)
    const evA = i === 0 ? (arranque.length ? 0 : reales[0]!.ev) : reales[i - 1]!.ev
    const arriba = Array.from({ length: N_TRAMO }, (_, k) => {
      const d = a + ((b - a) * k) / (N_TRAMO - 1)
      return { x: x(d), y: y(pvEn(d)) }
    })
    return {
      ...t,
      xa: x(a),
      xb: x(b),
      d: trazo([...arriba, { x: x(b), y: y(reales[i]!.ev) }, { x: x(a), y: y(evA) }]) + ' Z',
    }
  })

  const fechaVigente = reales[vigente]?.fecha
  const xv = fechaVigente ? x(fechaVigente) : null
  const finDia = Math.max(
    planeada.length ? aDia(planeada.at(-1)!.fecha) : 0,
    finProyectado ? aDia(finProyectado) : 0,
  )
  const lineasY = [0, 0.25, 0.5, 0.75, 1].map((v) => v * dom.techo)
  // Etiquetas de mes con al menos 64 px entre sí (las de enero llevan el año).
  const pxMes = (pw * 30.4) / Math.max(1, dom.hasta - dom.desde)
  const paso = Math.max(1, Math.ceil(64 / pxMes))
  const marcasMes = meses(dom.desde, dom.hasta).map((mm, i) => ({
    ...mm,
    etiqueta: i % paso === 0 ? mm.etiqueta : '',
  }))

  const mover = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width <= 0) return
    const px = m.l + ((e.clientX - r.left) / r.width) * pw
    const cerca = reales.find((c) => Math.abs(x(c.fecha) - px) < IMAN)
    if (cerca) return alPuntero(cerca.fecha)
    alPuntero(aISO(Math.round(dom.desde + ((px - m.l) / pw) * (dom.hasta - dom.desde))))
  }

  const entrar = (retraso: number, extra: object = {}) =>
    reducido
      ? { initial: false as const }
      : {
          initial: { opacity: 0, ...extra },
          animate: { opacity: 1, ...Object.fromEntries(Object.keys(extra).map((k) => [k, 1])) },
          transition: { duration: 0.5, delay: retraso, ease: salida },
        }

  return (
    <div ref={lienzo} className="relative">
      <svg
        role="img"
        aria-label={etiqueta}
        viewBox={`0 0 ${ancho} ${alto}`}
        height={alto}
        className="block w-full overflow-visible font-texto select-none"
      >
        <defs>
          <clipPath id="curva-recorte">
            <rect x={m.l} y={0} width={pw} height={yBase + 1} />
          </clipPath>
        </defs>

        <g className="text-[11.5px]">
          {lineasY.map((v) => (
            <g key={v} className="curva-geo" style={{ transform: `translateY(${y(v)}px)` }}>
              <line x1={m.l} x2={m.l + pw} className="stroke-linea-2" />
              <text x={m.l - 10} y={4} textAnchor="end" className="fill-texto-2 font-cifra">
                {Math.round(v * 100)} %
              </text>
            </g>
          ))}
          {marcasMes.map((mm) => (
            <g
              key={mm.dia}
              className="curva-geo"
              style={{ transform: `translateX(${x(mm.dia)}px)` }}
            >
              <line y1={m.t} y2={yBase} className="stroke-linea-2" />
              {mm.etiqueta && x(mm.dia) < m.l + pw - (movil ? 26 : 8) && (
                <text x={4} y={yBase + 20} className="fill-texto-2">
                  {mm.etiqueta}
                </text>
              )}
            </g>
          ))}
        </g>

        <g clipPath="url(#curva-recorte)">
          {xv !== null && (
            <rect
              x={xv}
              y={m.t}
              width={Math.max(0, m.l + pw - xv)}
              height={ph}
              className="fill-tinta/[0.025]"
            />
          )}
          <motion.g {...entrar(0.9)}>
            {tramos.map((t, i) => (
              <path
                key={t.hasta}
                {...geo(t.d)}
                className={`curva-geo ${RELLENO[t.estado]} ${i > vigente ? 'opacity-[0.08]' : 'opacity-[0.22]'}`}
              />
            ))}
          </motion.g>
          <path
            data-curva="planeada"
            {...geo(dPlan, 0)}
            pathLength={1}
            className={`curva-geo ${estatica ? '' : 'curva-trazo'} fill-none stroke-institucional`}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {dProy && (
            <motion.g {...entrar(1.2)}>
              <path
                data-curva="proyeccion"
                {...geo(dProy)}
                className="curva-geo fill-none stroke-acento"
                strokeWidth={2}
                strokeDasharray="2 6"
                strokeLinecap="round"
              />
            </motion.g>
          )}
          {reales.length > 0 && (
            <>
              {vigente < reales.length - 1 && (
                <path
                  {...geo(dRealDespues)}
                  className="curva-geo fill-none stroke-acento opacity-30"
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
              )}
              <path
                data-curva="real"
                {...geo(dReal, 0.35)}
                pathLength={1}
                className={`curva-geo ${estatica ? '' : 'curva-trazo'} fill-none stroke-acento`}
                strokeWidth={3.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}
          {xv !== null && (
            <line
              y1={m.t - 8}
              y2={yBase}
              className="curva-geo stroke-acento"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              style={{ transform: `translateX(${xv}px)` }}
            />
          )}
        </g>

        {xv !== null && fechaVigente && (
          <text
            y={m.t - 10}
            className="curva-geo fill-[#00759c] text-xs font-semibold"
            style={{ transform: `translateX(${Math.min(xv + 6, m.l + pw - 70)}px)` }}
          >
            Corte {fechaCorta(fechaVigente).replace(/ \d{4}$/, '')}
          </text>
        )}
        {finProyectado && zoom === 'proyecto' && x(finProyectado) <= m.l + pw && (
          <text
            x={x(finProyectado)}
            y={y(1) - 8}
            textAnchor="end"
            className="fill-texto-2 text-xs font-semibold"
          >
            {dProy ? 'Fin proyectado' : 'Fin'} {fechaCorta(finProyectado).replace(/ \d{4}$/, '')}
          </text>
        )}

        {/* Franja inferior: el semáforo corte a corte. */}
        <g>
          {!movil && (
            <text
              x={m.l - 10}
              y={alto - 21}
              textAnchor="end"
              className="fill-texto-2 text-[11.5px] font-semibold"
            >
              Semáforo
            </text>
          )}
          {tramos.map((t, i) => (
            <rect
              key={t.hasta}
              x={Math.max(m.l, t.xa + 1)}
              y={alto - 30}
              width={Math.max(2, Math.min(t.xb, m.l + pw) - Math.max(m.l, t.xa) - 2)}
              height={10}
              rx={2}
              className={`${RELLENO[t.estado]} ${i > vigente ? 'opacity-30' : ''}`}
            />
          ))}
          {xv !== null && finDia > 0 && (
            <rect
              x={xv + 1}
              y={alto - 30}
              width={Math.max(0, Math.min(x(finDia), m.l + pw) - xv - 1)}
              height={10}
              rx={2}
              className="fill-linea"
            />
          )}
        </g>

        {marca && (
          <g className="pointer-events-none">
            <line
              x1={x(marca.fecha)}
              x2={x(marca.fecha)}
              y1={m.t}
              y2={yBase}
              className="stroke-tinta"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(marca.fecha)}
              cy={y(marca.pv)}
              r={4.5}
              className="fill-superficie stroke-institucional"
              strokeWidth={2.5}
            />
            {marca.ev !== null && (
              <circle
                cx={x(marca.fecha)}
                cy={y(marca.ev)}
                r={5.5}
                className={
                  marca.proyectada
                    ? 'fill-superficie stroke-acento'
                    : 'fill-acento stroke-superficie'
                }
                strokeWidth={2.5}
              />
            )}
          </g>
        )}

        {estatica ? (
          reales.map((c, i) => (
            <circle
              key={c.fecha}
              data-corte={c.fecha}
              cx={x(c.fecha)}
              cy={y(c.ev)}
              r={5}
              strokeWidth={2}
              className={`${RELLENO[c.estado]} ${c.vencidas > 0 ? 'stroke-vencida' : c.estado === 'en_atencion' ? 'stroke-amarillo-texto' : 'stroke-superficie'} ${i > vigente ? 'opacity-30' : ''}`}
            />
          ))
        ) : (
          <rect
            x={m.l}
            y={0}
            width={pw}
            height={yBase}
            className="cursor-crosshair fill-transparent"
            onPointerMove={mover}
            onPointerLeave={() => alPuntero(null)}
          />
        )}
      </svg>

      {/* Puntos de corte: botones reales sobre la gráfica (foco, teclado y lector de pantalla). */}
      {guardado && (
        <span
          aria-hidden
          title="Guardado en el corte"
          className="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full border-2 border-acento bg-superficie opacity-60"
          style={{ left: x(guardado.fecha) + 10, top: y(guardado.ev) }}
        />
      )}
      {!estatica &&
        reales.map((c, i) => {
          const venc = c.vencidas > 0
          const nombre = `Corte del ${fechaCorta(c.fecha)}, ${ETIQUETA_ESTADO[c.estado]}${
            venc ? `, ${c.vencidas} ${c.vencidas === 1 ? 'vencida' : 'vencidas'}` : ''
          }`
          return (
            <motion.button
              key={c.fecha}
              type="button"
              aria-label={nombre}
              aria-current={i === vigente ? 'true' : undefined}
              onClick={() => elegirCorte(c.fecha)}
              onFocus={() => alPuntero(c.fecha)}
              onBlur={() => alPuntero(null)}
              {...(reducido
                ? {}
                : {
                    initial: { scale: 0 },
                    animate: { scale: 1 },
                    transition: { duration: 0.45, delay: 0.55 + i * 0.09, ease: salida },
                  })}
              className={`curva-punto absolute grid size-6 -translate-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-acento ${i > vigente ? 'opacity-30' : ''}`}
              style={{ left: x(c.fecha), top: y(c.ev) }}
            >
              <span
                className={`block size-3 rounded-full border-2 ${venc ? 'border-vencida' : c.estado === 'en_atencion' ? 'border-amarillo-texto' : 'border-superficie'} ${PUNTO[c.estado]} ${i === vigente ? 'ring-2 ring-acento/40' : ''}`}
              />
            </motion.button>
          )
        })}
    </div>
  )
}
