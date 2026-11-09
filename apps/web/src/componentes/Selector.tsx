import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

export interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string
  /** La etiqueta solo la leen los lectores de pantalla. */
  etiquetaOculta?: boolean
  error?: string
}

/** Flecha del `select` pintada como fondo (el control nativo se aplana con `appearance-none`). */
export const FLECHA =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235B6C7E' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export const CLASE_SELECTOR = [
  'min-h-11 w-full appearance-none rounded-control border bg-superficie py-0 pl-3 pr-8',
  'text-[0.9375rem] text-tinta transition-[border-color,box-shadow] duration-150',
  'bg-[length:14px] bg-[position:right_10px_center] bg-no-repeat',
  'focus:shadow-foco focus:outline-none',
].join(' ')

export const Selector = forwardRef<HTMLSelectElement, SelectorProps>(function Selector(
  { etiqueta, etiquetaOculta = false, error, id, className = '', style, children, ...props },
  ref,
) {
  const propio = useId()
  const idSelect = id ?? propio
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={idSelect}
        className={etiquetaOculta ? 'sr-only' : 'text-sm font-semibold text-tinta'}
      >
        {etiqueta}
      </label>
      <select
        ref={ref}
        id={idSelect}
        aria-invalid={error ? true : undefined}
        className={`${CLASE_SELECTOR} ${
          error ? 'border-alerta' : 'border-linea hover:border-texto-3 focus:border-acento'
        }`}
        style={{ backgroundImage: FLECHA, ...style }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm font-medium text-alerta-texto">{error}</p>}
    </div>
  )
})
