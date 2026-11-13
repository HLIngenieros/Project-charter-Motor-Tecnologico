import type { AreaPublica, CategoriaPublica } from '@charter/shared'
import type { ReactNode } from 'react'
import { Selector } from '../../componentes/Selector'
import type { FiltrosPortafolio as Filtros } from './filtrar'

const ESTADOS: { valor: Filtros['estado']; texto: string }[] = [
  { valor: 'todos', texto: 'Todos los estados' },
  { valor: 'activo', texto: 'Activos' },
  { valor: 'pausado', texto: 'Pausados' },
  { valor: 'cerrado', texto: 'Cerrados' },
  { valor: 'cancelado', texto: 'Cancelados' },
  { valor: 'sin_cortes', texto: 'Sin cortes' },
  { valor: 'con_vencidas', texto: 'Con vencidas' },
]

export function FiltrosPortafolio({
  filtros,
  cambiar,
  categorias,
  areas,
  duenos,
  cuenta,
  children,
}: {
  filtros: Filtros
  cambiar: (cambios: Partial<Filtros>) => void
  categorias: CategoriaPublica[]
  /** Solo se muestra el filtro si algún charter tiene área. */
  areas: AreaPublica[]
  /** Solo en la vista «Todos» del Admin. */
  duenos?: { id: string; nombre: string }[]
  cuenta: string
  /** Chips de filtros extra (el segmento del tablero). */
  children?: ReactNode
}) {
  return (
    <div className="mt-6 mb-3.5 flex flex-wrap items-center gap-2.5 max-md:mt-5">
      <label className="relative max-w-[400px] flex-[1_1_260px] max-md:max-w-none max-md:basis-full">
        <span className="sr-only">Buscar</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute top-3.5 left-3 size-4 text-texto-2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={filtros.texto}
          onChange={(e) => cambiar({ texto: e.target.value })}
          placeholder="Buscar por nombre, código o responsable"
          className={[
            'min-h-11 w-full rounded-control border border-linea bg-superficie pr-3 pl-9',
            'text-[0.9375rem] text-tinta placeholder:text-texto-3',
            'transition-[border-color,box-shadow] duration-150 hover:border-texto-3',
            'focus:border-acento focus:shadow-foco focus:outline-none',
          ].join(' ')}
        />
      </label>
      <Selector
        etiqueta="Categoría"
        etiquetaOculta
        value={filtros.categoria}
        onChange={(e) => cambiar({ categoria: e.target.value })}
        className="max-md:flex-[1_1_40%]"
      >
        <option value="todas">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
        <option value="ninguna">Sin categoría</option>
      </Selector>
      {areas.length > 0 && (
        <Selector
          etiqueta="Área"
          etiquetaOculta
          value={filtros.area}
          onChange={(e) => cambiar({ area: e.target.value })}
          className="max-md:flex-[1_1_40%]"
        >
          <option value="todas">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Selector>
      )}
      <Selector
        etiqueta="Estado"
        etiquetaOculta
        value={filtros.estado}
        onChange={(e) => cambiar({ estado: e.target.value as Filtros['estado'] })}
        className="max-md:flex-[1_1_40%]"
      >
        {ESTADOS.map((e) => (
          <option key={e.valor} value={e.valor}>
            {e.texto}
          </option>
        ))}
      </Selector>
      {duenos && (
        <Selector
          etiqueta="Dueño"
          etiquetaOculta
          value={filtros.dueno}
          onChange={(e) => cambiar({ dueno: e.target.value })}
          className="max-md:flex-[1_1_40%]"
        >
          <option value="todos">Todos los dueños</option>
          {duenos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </Selector>
      )}
      {children}
      <span aria-live="polite" className="ml-auto text-[0.8125rem] text-texto-2 max-md:hidden">
        {cuenta}
      </span>
    </div>
  )
}
