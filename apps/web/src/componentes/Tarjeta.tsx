import type { HTMLAttributes, ReactNode } from 'react'

export interface TarjetaProps extends HTMLAttributes<HTMLElement> {
  titulo?: ReactNode
  /** Acciones a la derecha del título. */
  acciones?: ReactNode
  /** Color del borde superior (p. ej. el de la categoría). */
  acento?: string
}

export function Tarjeta({
  titulo,
  acciones,
  acento,
  className = '',
  children,
  style,
  ...props
}: TarjetaProps) {
  return (
    <section
      className={`rounded-tarjeta border border-linea bg-superficie p-5 ${acento ? 'border-t-[3px]' : ''} ${className}`}
      style={acento ? { borderTopColor: acento, ...style } : style}
      {...props}
    >
      {(titulo || acciones) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          {titulo && <h3 className="text-base font-semibold">{titulo}</h3>}
          {acciones}
        </header>
      )}
      {children}
    </section>
  )
}
