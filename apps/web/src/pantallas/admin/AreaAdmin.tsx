import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Layout } from '../../app/Layout'

const PESTANAS = [{ ruta: '/admin/parametros', etiqueta: 'Parametrización' }]

/** Marco del área de Admin: título y pestañas (por ahora solo Parametrización). */
export function AreaAdmin({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <Layout>
      <h1 className="text-[1.625rem] font-semibold">Administración</h1>
      <nav
        aria-label="Secciones de administración"
        className="mt-4 mb-6 flex gap-1 border-b border-linea"
      >
        {PESTANAS.map((p) => {
          const activa = pathname === p.ruta
          return (
            <Link
              key={p.ruta}
              to={p.ruta}
              aria-current={activa ? 'page' : undefined}
              className={[
                'relative -mb-px border-b-2 px-3 pt-2 pb-2.5 text-sm font-semibold transition-colors',
                'rounded-t-sm focus-visible:outline-2 focus-visible:outline-acento',
                activa
                  ? 'border-institucional text-institucional'
                  : 'border-transparent text-texto-2 hover:text-tinta',
              ].join(' ')}
            >
              {p.etiqueta}
            </Link>
          )
        })}
      </nav>
      {children}
    </Layout>
  )
}
