import {
  aDia,
  curvaSPlaneada,
  lecturaEn,
  proyeccionAlRitmo,
  raicesDeFoto,
  type CorteResumen,
  type FechaISO,
  type PuntoReal,
  type Reglas,
} from '@charter/shared'
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { Cargando } from '../../../componentes/Cargando'
import { Chip } from '../../../componentes/Chip'
import { fechaCorta, porcentaje, puntos } from '../../../formato'
import { chipDe } from '../cronograma/estados'
import type { VistaCronograma } from '../useVistaCronograma'
import { CurvaS, type Marca } from './CurvaS'
import { estadoPorBrecha, type Zoom } from './geometria'

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col leading-tight whitespace-nowrap">
      <span className="text-xs text-texto-2">{titulo}</span>
      <b className="font-titulo text-2xl font-semibold text-tinta tabular-nums max-sm:text-xl">
        {children}
      </b>
    </div>
  )
}

const ZOOMS: [Zoom, string][] = [
  ['proyecto', 'Todo el proyecto'],
  ['cortes', 'Cortes'],
]

/** Curva S a todo el ancho, entre la razón de ser y el cronograma. */
export function SeccionCurvaS({
  vista,
  cortes,
  elegirCorte,
  reglas,
  estatica = false,
  ancho,
}: {
  vista: VistaCronograma
  /** Del más viejo al más reciente. */
  cortes: CorteResumen[]
  elegirCorte?(fecha: FechaISO | null): void
  reglas: Reglas
  /** Versión para imprimir: sin zoom, sin puntero y a un ancho fijo. */
  estatica?: boolean
  ancho?: number
}) {
  const [zoom, setZoom] = useState<Zoom>('proyecto')
  const [puntero, setPuntero] = useState<FechaISO | null>(null)
  const { historica, calculo, fechaCorte } = vista
  const p = calculo.proyecto
  const foto = historica?.foto
  // Diferido: al soltar una barra, el Gantt se pinta primero y la curva en el render siguiente.
  const arbol = useDeferredValue(vista.arbol)

  // Una pasada del motor por semana del proyecto: solo cuando cambia el cronograma.
  const planeada = useMemo(
    () => curvaSPlaneada(foto ? raicesDeFoto(foto) : arbol, reglas),
    [foto, arbol, reglas],
  )

  const guardados = useMemo<PuntoReal[]>(
    () =>
      cortes.map(({ fecha, pv, ev, estado, vencidas }) => ({ fecha, pv, ev, estado, vencidas })),
    [cortes],
  )
  // En la vista actual, el último corte se recalcula en vivo con el cronograma de hoy.
  const enVivo = !historica && guardados.at(-1)?.fecha === fechaCorte
  const reales = enVivo
    ? [
        ...guardados.slice(0, -1),
        { fecha: fechaCorte!, pv: p.pv, ev: p.ev, estado: p.estado, vencidas: p.vencidas },
      ]
    : guardados
  const guardado = enVivo && vista.lineaBaseModificada ? guardados.at(-1)! : null
  const vigente = fechaCorte ? reales.findIndex((r) => r.fecha === fechaCorte) : -1
  const corteVisto = reales[vigente]
  const vistos = reales.slice(0, vigente + 1)
  const proyeccion = corteVisto ? proyeccionAlRitmo(planeada, corteVisto, p.forecast, p.fin) : []

  const titulo = (
    <h2 id="titulo-curva" className="text-[1.375rem] font-semibold">
      Curva S
    </h2>
  )
  const marco = (cuerpo: ReactNode, cabecera?: ReactNode) =>
    estatica ? (
      <section aria-labelledby="titulo-curva" className="seccion-impresion">
        <div className="mb-3">{titulo}</div>
        {cuerpo}
      </section>
    ) : (
      <section
        id="curva"
        aria-labelledby="titulo-curva"
        className="-mx-10 scroll-mt-28 border-y border-linea-2 bg-[#f7f9fc] px-10 pt-7.5 pb-6.5 max-lg:-mx-4 max-lg:px-4"
      >
        <div className="mb-4 flex flex-wrap items-end gap-4">
          {titulo}
          {cabecera}
        </div>
        {cuerpo}
      </section>
    )

  if (vista.cargando) return marco(<Cargando />)
  if (planeada.length === 0)
    return marco(
      <p className="text-sm text-texto-2">
        Programa el cronograma para ver la curva S.
        {!estatica && ' '}
        {!estatica && (
          <a
            href="#cronograma"
            className="rounded-sm font-semibold text-institucional underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
          >
            Ir al cronograma
          </a>
        )}
      </p>,
    )

  // Lectura: por defecto el corte que se ve; con el puntero, la fecha bajo él.
  const fechaLeida = puntero ?? fechaCorte
  const corteLeido = fechaLeida ? reales.find((r) => r.fecha === fechaLeida) : undefined
  const l = fechaLeida ? lecturaEn(fechaLeida, planeada, vistos, proyeccion) : null
  const pv = corteLeido?.pv ?? l?.pv ?? 0
  const ev = corteLeido ? corteLeido.ev : (l?.ev ?? null)
  const proyectada = !corteLeido && l?.tipo === 'proyeccion'
  const chip = corteLeido
    ? chipDe(corteLeido, true)
    : ev !== null
      ? chipDe({ estado: estadoPorBrecha(pv, ev, reglas.umbrales), vencidas: 0 }, true)
      : null
  const etiquetaLectura = corteLeido
    ? corteLeido.fecha === fechaCorte
      ? historica
        ? 'Corte elegido'
        : 'Último corte'
      : 'Corte'
    : l?.tipo === 'entre_cortes'
      ? 'Entre cortes'
      : l?.tipo === 'proyeccion'
        ? 'Proyección'
        : 'Planeado a la fecha'
  const marca: Marca | null = puntero && l ? { fecha: puntero, pv, ev, proyectada } : null
  const atraso = p.forecast && p.fin ? aDia(p.forecast) - aDia(p.fin) : 0

  const etiqueta = corteVisto
    ? `Curva S: al ${fechaCorta(corteVisto.fecha)}, planeado ${porcentaje(corteVisto.pv)} y real ${porcentaje(corteVisto.ev)}`
    : `Curva S planeada, del ${fechaCorta(planeada[0]!.fecha)} al ${fechaCorta(planeada.at(-1)!.fecha)}`

  return marco(
    <>
      {fechaLeida ? (
        <div
          role="group"
          aria-label="Lectura de la curva"
          className="mb-2 flex min-h-[58px] flex-wrap items-end gap-x-7 gap-y-3 max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-4"
        >
          <div className="flex min-w-[150px] flex-col leading-tight max-sm:col-span-3 max-sm:min-w-0">
            <span className="text-xs text-texto-2">{etiquetaLectura}</span>
            <b className="font-titulo text-[0.9375rem] font-semibold text-tinta">
              {fechaCorta(fechaLeida)}
            </b>
          </div>
          <Dato titulo="Planeado">{porcentaje(pv)}</Dato>
          <Dato titulo={proyectada ? 'Proyectado' : 'Real'}>
            {ev === null ? '—' : porcentaje(ev)}
          </Dato>
          <Dato titulo="Brecha">{ev === null ? '—' : puntos(Math.max(0, pv - ev))}</Dato>
          {chip && (
            <div className="flex items-center gap-2 pb-1 max-sm:col-span-3">
              <Chip tono={chip.tono}>{chip.texto}</Chip>
              {corteLeido && corteLeido.vencidas > 0 && (
                <span className="text-[0.78125rem] font-semibold text-vencida">
                  {corteLeido.vencidas} {corteLeido.vencidas === 1 ? 'vencida' : 'vencidas'}
                </span>
              )}
            </div>
          )}
          {corteVisto && p.forecast && (
            <div className="ml-auto flex flex-col text-right leading-tight max-sm:col-span-3 max-sm:ml-0 max-sm:text-left">
              <span className="text-xs text-texto-2">Fin al ritmo actual</span>
              <b className="font-titulo text-[0.9375rem] font-semibold text-tinta">
                {fechaCorta(p.forecast)}
                {atraso > 0 && (
                  <span className="font-texto text-[0.8125rem] font-semibold text-alerta-texto">
                    {' '}
                    (+{atraso} {atraso === 1 ? 'día' : 'días'})
                  </span>
                )}
              </b>
            </div>
          )}
        </div>
      ) : (
        <p className="mb-2 flex min-h-[58px] items-end text-sm text-texto-2">
          Registra el primer corte para ver el avance real.
        </p>
      )}
      {fechaLeida && reales.length === 0 && (
        <p className="text-sm text-texto-2">Registra el primer corte para ver el avance real.</p>
      )}
      <CurvaS
        planeada={planeada}
        reales={reales}
        vigente={vigente}
        proyeccion={proyeccion}
        guardado={guardado}
        finProyectado={p.forecast}
        zoom={reales.length ? zoom : 'proyecto'}
        marca={marca}
        alPuntero={estatica ? undefined : setPuntero}
        elegirCorte={elegirCorte}
        etiqueta={etiqueta}
        estatica={estatica}
        ancho={ancho}
      />
    </>,
    !estatica && reales.length > 0 && (
      <div
        role="group"
        aria-label="Zoom de la curva"
        className="ml-auto inline-flex rounded-control bg-fondo p-[3px]"
      >
        {ZOOMS.map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={zoom === valor}
            onClick={() => setZoom(valor)}
            className="rounded-[6px] px-3 py-1 text-[0.8125rem] font-semibold text-texto-2 aria-pressed:bg-superficie aria-pressed:text-tinta aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-acento"
          >
            {texto}
          </button>
        ))}
      </div>
    ),
  )
}
