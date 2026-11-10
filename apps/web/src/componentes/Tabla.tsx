import type { ReactNode } from 'react'

export interface Columna<T> {
  id: string
  titulo: ReactNode
  celda: (fila: T) => ReactNode
  /** Alinea a la derecha y usa cifras tabulares. */
  numerica?: boolean
}

export interface TablaProps<T> {
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string
  /** Descripción accesible de la tabla. */
  titulo: string
  vacio?: ReactNode
}

export function Tabla<T>({ columnas, filas, claveFila, titulo, vacio }: TablaProps<T>) {
  return (
    <div className="relative overflow-x-auto rounded-tarjeta border border-linea bg-superficie">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="border-b border-linea bg-fondo/60 text-left">
            {columnas.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={`px-4 py-2.5 font-semibold whitespace-nowrap text-texto-2 ${c.numerica ? 'text-right' : ''}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-8 text-center text-texto-2">
                {vacio ?? 'No hay datos todavía.'}
              </td>
            </tr>
          ) : (
            filas.map((f) => (
              <tr
                key={claveFila(f)}
                className="border-b border-linea-2 last:border-0 hover:bg-fondo/40"
              >
                {columnas.map((c) => (
                  <td
                    key={c.id}
                    className={`px-4 py-2.5 text-texto ${c.numerica ? 'cifra text-right whitespace-nowrap text-tinta' : ''}`}
                  >
                    {c.celda(f)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
