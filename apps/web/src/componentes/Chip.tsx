import type { CategoriaPublica } from '@charter/shared'
import type { ReactNode } from 'react'

export type TonoChip =
  'al_dia' | 'terminada' | 'en_atencion' | 'en_riesgo' | 'atrasada' | 'vencida' | 'neutro'

/** Tres piezas del semáforo: punto en el tono base, fondo suave y texto legible. */
const TONOS: Record<TonoChip, { fondo: string; texto: string; punto: string }> = {
  al_dia: { fondo: 'bg-ok-suave', texto: 'text-ok-texto', punto: 'bg-ok' },
  terminada: { fondo: 'bg-ok-suave', texto: 'text-ok-texto', punto: 'bg-ok' },
  en_atencion: { fondo: 'bg-amarillo-suave', texto: 'text-amarillo-texto', punto: 'bg-amarillo' },
  en_riesgo: { fondo: 'bg-naranja-suave', texto: 'text-naranja-texto', punto: 'bg-naranja' },
  atrasada: { fondo: 'bg-alerta-suave', texto: 'text-alerta-texto', punto: 'bg-alerta' },
  vencida: { fondo: 'bg-vencida-suave', texto: 'text-vencida', punto: 'bg-vencida' },
  neutro: { fondo: 'bg-fondo', texto: 'text-texto-2', punto: 'bg-texto-3' },
}

const BASE =
  'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.78125rem] leading-5 font-semibold'

export function Chip({
  tono = 'neutro',
  children,
  className = '',
}: {
  tono?: TonoChip
  children: ReactNode
  className?: string
}) {
  const t = TONOS[tono]
  return (
    <span className={`${BASE} ${t.fondo} ${t.texto} ${className}`}>
      <span aria-hidden className={`size-[7px] shrink-0 rounded-full ${t.punto}`} />
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Chip de categoría: el color del catálogo solo va en el punto y el fondo; el texto es tinta. */
export function ChipCategoria({
  categoria,
  className = '',
}: {
  categoria: CategoriaPublica | null
  className?: string
}) {
  if (!categoria) return <Chip className={className}>Sin categoría</Chip>
  return (
    <span
      className={`${BASE} text-tinta ${className}`}
      style={{ backgroundColor: categoria.colorFondo }}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoria.color }}
      />
      <span className="truncate">{categoria.nombre}</span>
    </span>
  )
}
