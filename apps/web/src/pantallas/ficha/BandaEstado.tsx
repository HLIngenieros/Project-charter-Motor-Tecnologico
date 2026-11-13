import type { FechaISO, ResultadoNodo } from '@charter/shared'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ANCHOS } from '../../app/Layout'
import { clasesBoton } from '../../componentes/Boton'
import { Chip, textoTono } from '../../componentes/Chip'
import { Cifra } from '../../componentes/Cifra'
import { fechaCorta, porcentaje, puntos } from '../../formato'
import { chipDe, tonoDe } from './cronograma/estados'

export interface Situacion {
  proyecto: ResultadoNodo
  /** Fecha del corte que se ve; null si aún no hay cortes. */
  fechaCorte: FechaISO | null
  /** Se ve un corte pasado, no el último. */
  historica?: boolean
  /** El cronograma cambió después del último corte. */
  lineaBaseModificada?: boolean
}

const pct = (n: number) => porcentaje(n)
const entero = (n: number) => String(Math.round(n))

function Dato({
  titulo,
  opcional,
  children,
}: {
  titulo: string
  opcional?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`flex flex-col leading-tight whitespace-nowrap ${opcional ? 'max-xl:hidden max-lg:flex' : ''}`}
    >
      <span className="text-xs text-texto-2">{titulo}</span>
      <b className="font-titulo text-[1.0625rem] font-semibold text-tinta tabular-nums">
        {children}
      </b>
    </div>
  )
}

function Datos({ proyecto: p, fechaCorte, historica, lineaBaseModificada }: Situacion) {
  const tono = tonoDe(p.estado)
  return (
    <div className="flex flex-col gap-1 border-l border-linea pl-6 max-lg:order-3 max-lg:w-full max-lg:border-0 max-lg:pl-0">
      <div
        role="group"
        aria-label="Situación del charter"
        className="flex items-center gap-[22px] max-lg:grid max-lg:grid-cols-3 max-lg:justify-start max-lg:gap-x-6 max-lg:gap-y-2.5"
      >
        <Dato titulo="Planeado">
          <Cifra valor={p.pv} formato={pct} />
        </Dato>
        <Dato titulo="Real">
          <Cifra valor={p.ev} formato={pct} />
        </Dato>
        <Dato titulo="Brecha" opcional>
          <Cifra
            valor={Math.max(0, p.pv - p.ev)}
            formato={puntos}
            className={fechaCorte ? textoTono(tono) : undefined}
          />
        </Dato>
        <Dato titulo="Vencidas">
          <a
            href="#cronograma"
            className={`rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-acento ${p.vencidas > 0 ? 'text-vencida' : 'text-tinta'}`}
          >
            <Cifra valor={p.vencidas} formato={entero} />
          </a>
        </Dato>
        {fechaCorte && (
          <Dato titulo={historica ? 'Corte' : 'Último corte'} opcional>
            {fechaCorta(fechaCorte)}
          </Dato>
        )}
      </div>
      {lineaBaseModificada && (
        <p className="text-xs text-texto-2">Línea base modificada desde el corte</p>
      )}
    </div>
  )
}

/** Banda fija bajo la institucional: dónde estoy, qué charter, su situación y sus acciones. */
export function BandaEstado({
  nombre,
  situacion,
  registrarCorte,
  selectorCorte,
  exportar,
  acciones,
}: {
  /** Elige en qué corte se ve la ficha. */
  selectorCorte?: ReactNode
  /** Menú «Exportar»; va antes de «Registrar corte». */
  exportar?: ReactNode
  nombre: string
  /** Situación actual; se omite mientras el cronograma no tiene actividades. */
  situacion?: Situacion
  /** Ruta de «Registrar corte»; se omite en solo lectura. */
  registrarCorte?: string
  acciones?: ReactNode
}) {
  const chip =
    situacion?.fechaCorte != null
      ? chipDe(situacion.proyecto, false)
      : { tono: 'neutro' as const, texto: 'Sin cortes' }
  return (
    <div className="sticky top-0 z-20 border-b border-linea bg-superficie shadow-[0_1px_0_rgb(11_31_51/0.02)] max-lg:static">
      <div
        className={`mx-auto flex ${ANCHOS.ficha} flex-wrap items-center gap-x-6 gap-y-2.5 px-4 py-3 sm:px-6`}
      >
        <div className="min-w-0">
          <nav aria-label="Ruta" className="text-xs text-texto-2">
            <Link
              to="/"
              className="rounded-sm hover:text-institucional hover:underline focus-visible:outline-2 focus-visible:outline-acento"
            >
              Mis charters
            </Link>
            <span aria-hidden> / </span>
            <span aria-current="page">{nombre}</span>
          </nav>
          <div className="mt-0.5 flex min-w-0 items-center gap-3">
            <p className="truncate font-titulo text-[1.1875rem] font-semibold text-tinta max-sm:text-[1.0625rem]">
              {nombre}
            </p>
            <Chip tono={chip.tono}>{chip.texto}</Chip>
          </div>
        </div>
        {situacion && <Datos {...situacion} />}
        {(registrarCorte || acciones || selectorCorte || exportar) && (
          // En celular, dos filas: «Corte» y «Exportar»; debajo, «Registrar corte» y el estado.
          <div className="ml-auto flex items-center gap-2 max-sm:ml-0 max-sm:w-full max-sm:flex-wrap">
            {selectorCorte}
            {exportar && <div className="max-sm:ml-auto">{exportar}</div>}
            <div aria-hidden className="hidden max-sm:order-last max-sm:block max-sm:basis-full" />
            {registrarCorte && (
              <Link
                to={registrarCorte}
                className={clasesBoton('primario', 'max-sm:order-last max-sm:flex-1')}
              >
                Registrar corte
              </Link>
            )}
            {acciones && <div className="max-sm:order-last max-sm:ml-auto">{acciones}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
