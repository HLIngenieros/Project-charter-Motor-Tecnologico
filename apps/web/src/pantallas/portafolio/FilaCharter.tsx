import type { CharterResumen, EstadoCharter } from '@charter/shared'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Chip, ChipCategoria } from '../../componentes/Chip'
import { diasEntre, fechaCorta, hoyISO, porcentaje } from '../../formato'
import { escalonado, useVariantes } from '../../movimiento'

const EnlaceAnimado = motion.create(Link)

/** Columnas fijas de la lista; la cabecera usa las mismas. */
export const COLUMNAS =
  'md:grid-cols-[minmax(0,1fr)_180px_130px_150px] lg:grid-cols-[minmax(0,1fr)_210px_140px_150px]'

/** Un corte con más de estos días se marca como viejo. */
const DIAS_CORTE_VIEJO = 21

const ESTADO_PAUSA: Partial<Record<EstadoCharter, string>> = {
  pausado: 'Pausado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
}

function hace(dias: number): string {
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

export function FilaCharter({ charter: c, indice }: { charter: CharterResumen; indice: number }) {
  const variantes = useVariantes(escalonado(indice))
  const corte = c.ultimoCorte
  const dias = corte ? diasEntre(corte.fecha, hoyISO()) : 0
  const pausa = ESTADO_PAUSA[c.estado]

  return (
    <EnlaceAnimado
      to={`/charters/${c.id}`}
      variants={variantes}
      initial="oculto"
      animate="visible"
      className={[
        'group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2.5 border-t border-linea-2 px-4 py-3.5',
        'transition-colors duration-150 hover:bg-[#f7f9fc] focus-visible:bg-[#f7f9fc]',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acento',
        `md:gap-5 md:px-5 md:py-4 ${COLUMNAS}`,
      ].join(' ')}
    >
      <div className="col-span-full min-w-0 md:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-titulo text-[0.96875rem] leading-snug font-semibold text-tinta transition-colors group-hover:text-institucional">
            {c.nombre}
          </span>
          {pausa && <Chip>{pausa}</Chip>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.8125rem] text-texto-2">
          <ChipCategoria categoria={c.categoria} />
          <span>{c.responsable}</span>
          {c.codigo && <span className="font-cifra text-xs">{c.codigo}</span>}
        </div>
      </div>

      <div className="text-[0.78125rem] text-texto-2">
        {corte ? (
          <>
            <b className="mr-1 font-cifra text-[0.9375rem] font-semibold text-tinta">
              {porcentaje(corte.ev)}
            </b>
            real de {porcentaje(corte.pv)}
            <div className="relative mt-1.5 h-1.5 rounded-full bg-fondo" aria-hidden>
              {/* El color del semáforo llega con T5.5; mientras tanto, neutro. */}
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-texto-3"
                style={{ width: `${Math.min(1, corte.ev) * 100}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 border-r-2 border-institucional"
                style={{ width: `${Math.min(1, corte.pv) * 100}%` }}
              />
            </div>
          </>
        ) : (
          'Registra el primer corte'
        )}
      </div>

      <div className="row-start-2 justify-self-end md:row-auto md:justify-self-start max-md:col-start-2">
        {!corte && <Chip>Sin cortes</Chip>}
      </div>

      <div className="text-[0.84375rem] leading-snug text-tinta max-md:row-start-3">
        {corte ? (
          <>
            {fechaCorta(corte.fecha)}
            <span
              className={`text-[0.78125rem] max-md:before:content-['_·_'] md:block ${
                dias > DIAS_CORTE_VIEJO ? 'font-semibold text-amarillo-texto' : 'text-texto-2'
              }`}
            >
              {hace(dias)}
            </span>
          </>
        ) : (
          <>
            Sin cortes
            <span className="text-[0.78125rem] text-texto-2 max-md:before:content-['_·_'] md:block">
              editado el {fechaCorta(c.actualizadoEn)}
            </span>
          </>
        )}
      </div>
    </EnlaceAnimado>
  )
}
