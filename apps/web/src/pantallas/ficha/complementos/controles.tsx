import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { Boton } from '../../../componentes/Boton'
import { FLECHA } from '../../../componentes/Selector'
import { BotonIcono, Icono } from '../ListaEditable'

/** Campo en su sitio, con el mismo aspecto que los ítems de las listas de la ficha. */
export const CLASE_CAMPO = [
  'block w-full rounded-[6px] bg-transparent px-1 py-px -mx-1 -my-px min-w-0',
  'text-[0.9375rem] leading-relaxed text-texto placeholder:text-texto-3',
  'transition-[background-color,box-shadow] duration-150',
  'hover:bg-[#f4f7fa] hover:shadow-[inset_0_-1px_0_#c3cfdd]',
  'focus:bg-superficie focus:shadow-[0_0_0_2px_var(--color-acento)] focus:outline-none',
].join(' ')

/** Texto de varias líneas que crece con su contenido. */
export function CampoTexto({
  etiqueta,
  valor,
  alCambiar,
  alSalir,
  placeholder,
  maximo,
  primero = false,
  className = '',
}: {
  etiqueta: string
  valor: string
  alCambiar(valor: string): void
  alSalir(): void
  placeholder?: string
  maximo: number
  /** Recibe el foco al agregar o mover la fila. */
  primero?: boolean
  className?: string
}) {
  return (
    <textarea
      rows={1}
      aria-label={etiqueta}
      data-primero={primero || undefined}
      value={valor}
      maxLength={maximo}
      placeholder={placeholder}
      onChange={(e) => alCambiar(e.target.value)}
      onBlur={alSalir}
      onKeyDown={(e) => {
        // Enter no parte el texto: las celdas son de una idea; Mayús + Enter sí.
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey) e.preventDefault()
      }}
      className={`${CLASE_CAMPO} resize-none [field-sizing:content] ${className}`}
    />
  )
}

const aTexto = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

/** «2,5», «2.5» o «1.500,5» → número; vacío → null; inválido → undefined. */
export function leerNumero(texto: string): number | null | undefined {
  const limpio = texto.trim().replace(/\s/g, '')
  if (limpio === '') return null
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  const n = Number(normal)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Número con coma decimal. Guarda lo escrito tal cual mientras se edita y solo informa
 * valores válidos; al salir, vuelve a la forma canónica del valor.
 */
export function CampoNumero({
  etiqueta,
  valor,
  alCambiar,
  alSalir,
  placeholder,
  className = '',
}: {
  etiqueta: string
  valor: number | null
  alCambiar(valor: number | null): void
  alSalir(): void
  placeholder?: string
  className?: string
}) {
  const [texto, setTexto] = useState(() => aTexto(valor))
  const invalido = leerNumero(texto) === undefined
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={etiqueta}
      aria-invalid={invalido || undefined}
      value={texto}
      placeholder={placeholder}
      maxLength={24}
      onChange={(e) => {
        setTexto(e.target.value)
        const n = leerNumero(e.target.value)
        if (n !== undefined) alCambiar(n)
      }}
      onBlur={() => {
        setTexto(aTexto(valor))
        alSalir()
      }}
      className={`${CLASE_CAMPO} font-cifra tabular-nums ${invalido ? 'shadow-[inset_0_-2px_0_var(--color-alerta)]' : ''} ${className}`}
    />
  )
}

/** Selector compacto que convive con los campos en su sitio. */
export function SelectorCompacto({
  etiqueta,
  valor,
  alCambiar,
  children,
  className = '',
}: {
  etiqueta: string
  valor: string
  alCambiar(valor: string): void
  children: ReactNode
  className?: string
}) {
  return (
    <select
      aria-label={etiqueta}
      value={valor}
      onChange={(e) => alCambiar(e.target.value)}
      style={{ backgroundImage: FLECHA }}
      className={[
        'min-h-8 appearance-none rounded-[6px] border border-linea bg-superficie py-0 pr-6 pl-2',
        'bg-[length:12px] bg-[position:right_6px_center] bg-no-repeat',
        'text-[0.9375rem] text-tinta transition-[border-color,box-shadow] duration-150',
        'hover:border-texto-3 focus:border-acento focus:shadow-foco focus:outline-none',
        className,
      ].join(' ')}
    >
      {children}
    </select>
  )
}

/** Subir, bajar y quitar una fila; visibles al pasar o enfocar la fila. */
export function AccionesFila({
  nombre,
  n,
  total,
  mover,
  quitar,
}: {
  /** En minúscula: «indicador» → «Subir indicador 2». */
  nombre: string
  n: number
  total: number
  mover(paso: -1 | 1): void
  quitar(): void
}) {
  return (
    <div className="-my-1 flex opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
      <BotonIcono etiqueta={`Subir ${nombre} ${n}`} alPulsar={() => mover(-1)} disabled={n === 1}>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </BotonIcono>
      <BotonIcono
        etiqueta={`Bajar ${nombre} ${n}`}
        alPulsar={() => mover(1)}
        disabled={n === total}
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </BotonIcono>
      <BotonIcono etiqueta={`Quitar ${nombre} ${n}`} alPulsar={quitar}>
        <path d="M6 6l12 12M18 6L6 18" />
      </BotonIcono>
    </div>
  )
}

export function BotonAgregar({ texto, alPulsar }: { texto: string; alPulsar(): void }) {
  return (
    <Boton variante="fantasma" onClick={alPulsar} className="mt-1.5 -ml-3 min-h-9 self-start px-3">
      <Icono>
        <path d="M12 5v14M5 12h14" />
      </Icono>
      {texto}
    </Boton>
  )
}

/**
 * Manejadores de una fila editable: al salir del todo de la fila (no al pasar entre sus
 * campos) llama `salir`; Alt + flechas la mueven y Escape suelta el foco.
 */
export function manejadoresFila(salir: () => void, mover: (paso: -1 | 1) => void) {
  return {
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) salir()
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        mover(e.key === 'ArrowUp' ? -1 : 1)
      } else if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement | null)?.blur()
      }
    },
  }
}

/** Tras cada render, enfoca el primer campo de la fila pedida (al agregar o mover). */
export function useEnfocarFila(
  pedidoRef: RefObject<string | null>,
  contenedor: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const id = pedidoRef.current
    if (!id) return
    pedidoRef.current = null
    const campo = contenedor.current?.querySelector<HTMLElement>(
      `[data-fila="${id}"] [data-primero]`,
    )
    campo?.focus()
  })
}

/** Etiqueta de columna que solo se ve en celular (en pantallas anchas la da la cabecera). */
export function EtiquetaMovil({ children }: { children: ReactNode }) {
  return (
    <span className="mb-0.5 block text-xs font-semibold text-texto-2 md:sr-only">{children}</span>
  )
}
