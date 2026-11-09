import type { ButtonHTMLAttributes } from 'react'

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro'

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  cargando?: boolean
  /** Ocupa todo el ancho disponible. */
  ancho?: boolean
}

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-institucional text-white hover:bg-institucional-2 active:bg-tinta disabled:bg-institucional/60',
  secundario:
    'bg-superficie text-tinta border border-linea hover:border-texto-3 hover:bg-fondo/60 disabled:text-texto-2',
  fantasma: 'text-institucional hover:bg-institucional/[0.06] disabled:text-texto-2',
  peligro: 'bg-alerta text-white hover:bg-[#a9432f] disabled:bg-alerta/60',
}

export function Boton({
  variante = 'primario',
  cargando = false,
  ancho = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={[
        'relative inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4',
        'text-[0.9375rem] font-semibold transition-colors duration-150 disabled:cursor-not-allowed',
        VARIANTES[variante],
        ancho ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      <span className={cargando ? 'invisible' : undefined}>{children}</span>
      {cargando && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          <span className="sr-only">Cargando</span>
        </span>
      )}
    </button>
  )
}
