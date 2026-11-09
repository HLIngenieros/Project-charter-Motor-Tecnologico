import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

/** Espera sin teclear antes de guardar mientras se escribe. */
const ESPERA_MS = 800

export interface TextoEditableProps {
  /** Nombre accesible del campo (va como `aria-label`). */
  etiqueta: string
  valor: string
  alGuardar(valor: string): void
  multilinea?: boolean
  placeholder?: string
  maximo?: number
  /** Mensaje si queda vacío; con él, vacío no se guarda y se revierte. */
  requerido?: string
  soloLectura?: boolean
  como?: 'titulo' | 'texto' | 'dato'
  className?: string
}

const ESTILO = {
  titulo:
    'font-titulo text-[1.625rem] leading-tight font-semibold text-tinta max-sm:text-[1.375rem]',
  texto: 'text-[0.9375rem] leading-relaxed text-texto',
  dato: 'text-sm font-semibold text-tinta',
}

/**
 * Texto que se edita en su sitio: parece texto y al pasar o enfocar muestra que se puede
 * cambiar. Guarda al salir y tras 800 ms sin teclear, solo si el valor recortado cambió.
 */
export function TextoEditable({
  etiqueta,
  valor,
  alGuardar,
  multilinea = false,
  placeholder,
  maximo,
  requerido,
  soloLectura = false,
  como = 'texto',
  className = '',
}: TextoEditableProps) {
  const [borrador, setBorrador] = useState(valor)
  const [aviso, setAviso] = useState<string>()
  const idAviso = useId()
  const enfocado = useRef(false)
  /** Valor al entrar al campo (Escape vuelve a él). */
  const alEntrar = useRef(valor)
  /** Último valor que este campo mandó y la API aún no devolvió. */
  const enviado = useRef<string | null>(null)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Adopta el valor de afuera salvo mientras se edita o hay un envío propio en camino:
  // así una respuesta vieja no pisa lo último que se escribió.
  useEffect(() => {
    if (enfocado.current) return
    if (enviado.current !== null && valor !== enviado.current) return
    enviado.current = null
    setBorrador(valor)
  }, [valor])

  useEffect(() => () => clearTimeout(espera.current), [])

  const ultimoConocido = () => enviado.current ?? valor

  const confirmar = (texto: string, alSalir: boolean) => {
    clearTimeout(espera.current)
    const recortado = texto.trim()
    if (requerido && !recortado) {
      if (alSalir) {
        setBorrador(ultimoConocido())
        setAviso(requerido)
      }
      return
    }
    if (alSalir) setBorrador(recortado)
    if (recortado === ultimoConocido()) return
    enviado.current = recortado
    alGuardar(recortado)
  }

  const teclado = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      clearTimeout(espera.current)
      setBorrador(alEntrar.current)
      setAviso(undefined)
      if (alEntrar.current !== ultimoConocido()) {
        enviado.current = alEntrar.current
        alGuardar(alEntrar.current)
      }
      e.currentTarget.blur()
    } else if (e.key === 'Enter' && !multilinea) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  if (soloLectura) {
    const Etiqueta = multilinea ? 'p' : 'span'
    return (
      <Etiqueta className={`${ESTILO[como]} whitespace-pre-line ${className}`}>
        {valor || <span className="text-texto-2">{placeholder ?? '—'}</span>}
      </Etiqueta>
    )
  }

  const props = {
    'aria-label': etiqueta,
    'aria-invalid': aviso ? true : undefined,
    'aria-describedby': aviso ? idAviso : undefined,
    value: borrador,
    placeholder,
    maxLength: maximo,
    spellCheck: como !== 'titulo',
    onFocus: () => {
      enfocado.current = true
      alEntrar.current = ultimoConocido()
    },
    onChange: (e: { target: { value: string } }) => {
      const texto = e.target.value
      setBorrador(texto)
      setAviso(undefined)
      clearTimeout(espera.current)
      espera.current = setTimeout(() => confirmar(texto, false), ESPERA_MS)
    },
    onBlur: () => {
      enfocado.current = false
      confirmar(borrador, true)
    },
    onKeyDown: teclado,
    className: [
      'block w-full resize-none rounded-[6px] bg-transparent px-1 py-px -mx-1 -my-px',
      '[field-sizing:content] placeholder:text-texto-3',
      'transition-[background-color,box-shadow] duration-150',
      'hover:bg-[#f4f7fa] hover:shadow-[inset_0_-1px_0_#c3cfdd]',
      'focus:bg-superficie focus:shadow-[0_0_0_2px_var(--color-acento)] focus:outline-none',
      aviso ? 'shadow-[inset_0_-1px_0_var(--color-alerta)]' : '',
      ESTILO[como],
    ].join(' '),
  }

  return (
    <div className={className}>
      {multilinea ? <textarea rows={1} {...props} /> : <input type="text" {...props} />}
      {aviso && (
        <p id={idAviso} role="alert" className="mt-1 text-sm font-medium text-alerta-texto">
          {aviso}
        </p>
      )}
    </div>
  )
}
