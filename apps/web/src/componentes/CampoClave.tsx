import { forwardRef, useState } from 'react'
import { Campo, type CampoProps } from './Campo'

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function Ojo({ tachado }: { tachado: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...trazo}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M4 4l16 16" />}
    </svg>
  )
}

/** Campo de clave con un botón para mostrarla u ocultarla. */
export const CampoClave = forwardRef<HTMLInputElement, Omit<CampoProps, 'type'>>(
  function CampoClave({ etiqueta, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div className={`relative ${className}`}>
        <Campo
          ref={ref}
          etiqueta={etiqueta}
          type={visible ? 'text' : 'password'}
          spellCheck={false}
          autoCapitalize="off"
          className="[&_input]:pr-12"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={`Mostrar ${etiqueta.toLowerCase()}`}
          title={visible ? 'Ocultar' : 'Mostrar'}
          className="absolute right-1 top-[1.75rem] flex size-10 items-center justify-center rounded-control text-texto-2 transition-colors hover:text-tinta focus-visible:shadow-foco focus-visible:outline-none"
        >
          <Ojo tachado={visible} />
        </button>
      </div>
    )
  },
)
