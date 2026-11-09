import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ANCHOS } from '../../app/Layout'
import { Chip } from '../../componentes/Chip'

/** Banda fija bajo la institucional: dónde estoy, qué charter y sus acciones. */
export function BandaEstado({ nombre, acciones }: { nombre: string; acciones?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 border-b border-linea bg-superficie shadow-[0_1px_0_rgb(11_31_51/0.02)] max-lg:static">
      <div
        className={`mx-auto flex ${ANCHOS.ficha} flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6`}
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
            <Chip>Sin cortes</Chip>
          </div>
        </div>
        {acciones && <div className="ml-auto flex items-center gap-2">{acciones}</div>}
      </div>
    </div>
  )
}
