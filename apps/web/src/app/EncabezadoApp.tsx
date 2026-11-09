import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Marca } from '../componentes/Marca'

/** Banda institucional con la marca; `derecha` recibe el usuario y sus acciones. */
export function EncabezadoApp({ derecha }: { derecha?: ReactNode }) {
  return (
    <header className="reticula text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-sello focus-visible:outline-white">
          <Marca />
        </Link>
        {derecha && <div className="flex min-w-0 items-center gap-3 text-sm">{derecha}</div>}
      </div>
    </header>
  )
}
