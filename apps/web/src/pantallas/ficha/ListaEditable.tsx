import type { ItemLista, TipoLista } from '@charter/shared'
import { motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useGuardarLista } from '../../api/charters'
import { Boton } from '../../componentes/Boton'
import { useGuardado } from './colaGuardado'

/** Espera sin teclear antes de guardar mientras se escribe. */
const ESPERA_MS = 800
/** Máximo de ítems que acepta la API. */
const MAXIMO = 50

export interface ListaEditableProps {
  charterId: string
  /** Título visible y nombre accesible de la lista. */
  titulo: string
  /** Nombre de un ítem, para las etiquetas: «Objetivo» → «Objetivo 2», «Quitar objetivo 2». */
  etiquetaItem: string
  tipo: TipoLista
  items: ItemLista[]
  textoAgregar: string
  textoVacio: string
  numerada?: boolean
  soloLectura?: boolean
}

interface Fila {
  clave: string
  texto: string
}

let siguiente = 0
const claveLocal = () => `local-${++siguiente}`

const limpios = (filas: Fila[]) => filas.map((f) => f.texto.trim()).filter(Boolean)

export function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function BotonIcono({
  etiqueta,
  alPulsar,
  disabled,
  children,
}: {
  etiqueta: string
  alPulsar(): void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={disabled}
      onClick={alPulsar}
      className="grid size-7 place-items-center rounded-control text-texto-2 transition-colors duration-150 hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento disabled:pointer-events-none disabled:opacity-35"
    >
      <Icono>{children}</Icono>
    </button>
  )
}

function Marca({ numerada, n }: { numerada: boolean; n: number }) {
  return numerada ? (
    <span aria-hidden className="pt-px font-cifra text-[0.8125rem] font-semibold text-texto-2">
      {n}
    </span>
  ) : (
    <span aria-hidden className="mt-[0.6rem] ml-1 size-[5px] rounded-full bg-texto-3" />
  )
}

const FILA = 'grid gap-2 border-t border-linea-2 py-[9px] first:border-t-0'

/**
 * Lista de textos que se edita en su sitio: cada cambio (texto, agregar, quitar, mover)
 * guarda la lista completa por la cola de la ficha. Las claves locales no se cambian por
 * las del servidor, así no se pierde el foco al guardar.
 */
export function ListaEditable({
  charterId,
  titulo,
  etiquetaItem,
  tipo,
  items,
  textoAgregar,
  textoVacio,
  numerada = false,
  soloLectura = false,
}: ListaEditableProps) {
  const idTitulo = useId()
  const { encolar } = useGuardado()
  const { mutateAsync } = useGuardarLista(charterId, tipo)
  const [filas, setFilas] = useState<Fila[]>(() =>
    items.map((i) => ({ clave: i.id, texto: i.texto })),
  )
  /** Copia síncrona de `filas` para los manejadores que corren antes del render. */
  const actuales = useRef(filas)
  /** Últimos textos enviados (o recibidos): si no cambian, no se envía. */
  const enviados = useRef(JSON.stringify(items.map((i) => i.texto)))
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const campos = useRef(new Map<string, HTMLTextAreaElement>())
  /** Campo que debe recibir el foco tras el próximo render (agregar, quitar, mover). */
  const porEnfocar = useRef<{ clave: string; alFinal: boolean } | null>(null)
  const nombre = etiquetaItem.toLowerCase()

  useEffect(() => () => clearTimeout(espera.current), [])

  useEffect(() => {
    const destino = porEnfocar.current
    if (!destino) return
    porEnfocar.current = null
    const campo = campos.current.get(destino.clave)
    if (!campo) return
    campo.focus()
    if (destino.alFinal) campo.setSelectionRange(campo.value.length, campo.value.length)
  })

  const enfocar = (destino: { clave: string; alFinal: boolean }) => {
    porEnfocar.current = destino
  }

  const enviar = () => {
    clearTimeout(espera.current)
    const textos = limpios(actuales.current)
    const firma = JSON.stringify(textos)
    if (firma === enviados.current) return
    enviados.current = firma
    encolar(() => mutateAsync(textos.map((texto) => ({ texto }))))
  }

  const cambiar = (nuevas: Fila[], guardarYa = false) => {
    actuales.current = nuevas
    setFilas(nuevas)
    if (guardarYa) enviar()
  }

  const escribir = (clave: string, texto: string) => {
    cambiar(actuales.current.map((f) => (f.clave === clave ? { ...f, texto } : f)))
    clearTimeout(espera.current)
    espera.current = setTimeout(enviar, ESPERA_MS)
  }

  const agregar = (despuesDe?: number) => {
    if (actuales.current.length >= MAXIMO) return
    const nueva = { clave: claveLocal(), texto: '' }
    const filasAhora = [...actuales.current]
    filasAhora.splice(despuesDe === undefined ? filasAhora.length : despuesDe + 1, 0, nueva)
    cambiar(filasAhora)
    enfocar({ clave: nueva.clave, alFinal: true })
  }

  const quitar = (i: number, enfocarAnterior = false) => {
    const anterior = actuales.current[i - 1]
    cambiar(
      actuales.current.filter((_, j) => j !== i),
      true,
    )
    if (enfocarAnterior && anterior) enfocar({ clave: anterior.clave, alFinal: true })
  }

  const mover = (i: number, paso: -1 | 1) => {
    const j = i + paso
    if (j < 0 || j >= actuales.current.length) return
    const filasAhora = [...actuales.current]
    const [fila] = filasAhora.splice(i, 1)
    filasAhora.splice(j, 0, fila!)
    cambiar(filasAhora, true)
    enfocar({ clave: fila!.clave, alFinal: false })
  }

  const teclado = (e: KeyboardEvent<HTMLTextAreaElement>, i: number) => {
    const campo = e.currentTarget
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      mover(i, e.key === 'ArrowUp' ? -1 : 1)
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const alFinal =
        campo.selectionStart === campo.value.length && campo.selectionEnd === campo.value.length
      if (alFinal && campo.value.trim()) agregar(i)
    } else if (e.key === 'Backspace' && campo.value === '') {
      e.preventDefault()
      quitar(i, true)
    } else if (e.key === 'Escape') {
      campo.blur()
    }
  }

  const salir = (clave: string) => {
    // Un ítem que se deja vacío desaparece; si ya existía, su salida se guarda.
    const fila = actuales.current.find((f) => f.clave === clave)
    if (fila && fila.texto.trim() === '') {
      cambiar(actuales.current.filter((f) => f.clave !== clave))
    }
    enviar()
  }

  const Lista = numerada ? 'ol' : 'ul'

  if (soloLectura) {
    return (
      <div>
        <h2 id={idTitulo} className="mb-2 text-lg font-semibold">
          {titulo}
        </h2>
        {items.length === 0 ? (
          <p className="text-[0.9375rem] text-texto-2">{textoVacio}</p>
        ) : (
          <Lista aria-labelledby={idTitulo} className="flex flex-col">
            {items.map((item, i) => (
              <li key={item.id} className={`${FILA} grid-cols-[28px_minmax(0,1fr)]`}>
                <Marca numerada={numerada} n={i + 1} />
                <span className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-texto">
                  {item.texto}
                </span>
              </li>
            ))}
          </Lista>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <h2 id={idTitulo} className="mb-2 text-lg font-semibold">
        {titulo}
      </h2>
      {filas.length === 0 && <p className="mb-1 text-[0.9375rem] text-texto-2">{textoVacio}</p>}
      <Lista aria-labelledby={idTitulo} className="flex flex-col">
        {filas.map((fila, i) => (
          <motion.li
            key={fila.clave}
            layout="position"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`group ${FILA} grid-cols-[28px_minmax(0,1fr)_auto] items-start`}
          >
            <Marca numerada={numerada} n={i + 1} />
            <textarea
              ref={(el) => {
                if (el) campos.current.set(fila.clave, el)
                else campos.current.delete(fila.clave)
              }}
              rows={1}
              aria-label={`${etiquetaItem} ${i + 1}`}
              value={fila.texto}
              maxLength={1000}
              placeholder={`Escribe el ${nombre}`}
              onChange={(e) => escribir(fila.clave, e.target.value)}
              onKeyDown={(e) => teclado(e, i)}
              onBlur={() => salir(fila.clave)}
              className={[
                'block w-full resize-none rounded-[6px] bg-transparent px-1 py-px -mx-1 -my-px',
                '[field-sizing:content] text-[0.9375rem] leading-relaxed text-texto placeholder:text-texto-3',
                'transition-[background-color,box-shadow] duration-150',
                'hover:bg-[#f4f7fa] hover:shadow-[inset_0_-1px_0_#c3cfdd]',
                'focus:bg-superficie focus:shadow-[0_0_0_2px_var(--color-acento)] focus:outline-none',
              ].join(' ')}
            />
            <div className="-my-1 flex opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <BotonIcono
                etiqueta={`Subir ${nombre} ${i + 1}`}
                alPulsar={() => mover(i, -1)}
                disabled={i === 0}
              >
                <path d="M12 19V5M6 11l6-6 6 6" />
              </BotonIcono>
              <BotonIcono
                etiqueta={`Bajar ${nombre} ${i + 1}`}
                alPulsar={() => mover(i, 1)}
                disabled={i === filas.length - 1}
              >
                <path d="M12 5v14M6 13l6 6 6-6" />
              </BotonIcono>
              <BotonIcono etiqueta={`Quitar ${nombre} ${i + 1}`} alPulsar={() => quitar(i)}>
                <path d="M6 6l12 12M18 6L6 18" />
              </BotonIcono>
            </div>
          </motion.li>
        ))}
      </Lista>
      {filas.length < MAXIMO && (
        <Boton
          variante="fantasma"
          onClick={() => agregar()}
          className="mt-1.5 -ml-3 min-h-9 self-start px-3"
        >
          <Icono>
            <path d="M12 5v14M5 12h14" />
          </Icono>
          {textoAgregar}
        </Boton>
      )}
    </div>
  )
}
