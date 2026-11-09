import { forwardRef, useId, type InputHTMLAttributes } from 'react'

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  error?: string
  ayuda?: string
}

export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  { etiqueta, error, ayuda, id, className = '', ...props },
  ref,
) {
  const propio = useId()
  const idInput = id ?? propio
  const idAyuda = `${idInput}-ayuda`
  const idError = `${idInput}-error`
  const describe = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={idInput} className="text-sm font-semibold text-tinta">
        {etiqueta}
      </label>
      <input
        ref={ref}
        id={idInput}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe || undefined}
        className={[
          'min-h-11 w-full rounded-control border bg-superficie px-3 text-[0.9375rem] text-tinta',
          'placeholder:text-texto-3 transition-[border-color,box-shadow] duration-150',
          'focus:shadow-foco focus:outline-none',
          error
            ? 'border-alerta focus:border-alerta'
            : 'border-linea hover:border-texto-3 focus:border-acento',
        ].join(' ')}
        {...props}
      />
      {error && (
        <p id={idError} className="text-sm font-medium text-alerta-texto">
          {error}
        </p>
      )}
      {ayuda && (
        <p id={idAyuda} className="text-sm text-texto-2">
          {ayuda}
        </p>
      )}
    </div>
  )
})
