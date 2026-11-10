import {
  fechaISO,
  type ActividadEntrada,
  type NodoArbol,
  type ResultadoNodo,
} from '@charter/shared'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Boton } from '../../../componentes/Boton'
import { fechaCorta, porcentaje } from '../../../formato'

const ENTRADA =
  'min-h-9 w-full min-w-0 rounded-control border border-linea bg-superficie px-2.5 text-sm text-tinta focus-visible:border-acento focus-visible:outline-2 focus-visible:outline-acento/40'

const MAX_RESPONSABLES = 5

function Etiqueta({
  texto,
  children,
  className = '',
}: {
  texto: string
  children: ReactNode
  className?: string
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1 text-xs font-semibold text-texto-2 ${className}`}
    >
      {texto}
      {children}
    </label>
  )
}

function Dato({ texto, valor }: { texto: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-texto-2">{texto}</dt>
      <dd className="font-mono text-[0.8125rem] text-tinta">{valor}</dd>
    </div>
  )
}

const pesoATexto = (p: number | null | undefined) =>
  p == null ? '' : (p * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })

/** '40' o '12,5' → fracción; vacío → null; inválido → undefined. */
function textoAPeso(t: string): number | null | undefined {
  const limpio = t.trim().replace(',', '.')
  if (!limpio) return null
  const n = Number(limpio)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n / 100 : undefined
}

const fechaValida = (v: string) => fechaISO.safeParse(v).success

export interface AccionesDetalle {
  aplicar(cambios: Partial<Omit<ActividadEntrada, 'id' | 'padreId' | 'orden'>>): void
  agregarDebajo(): void
  indentar(): void
  desindentar(): void
  eliminar(): void
  cerrar(): void
}

/** Detalle A–J de una actividad, en línea bajo su fila, con K–N calculados. */
export function DetalleActividad({
  nodo,
  resultado,
  soloLectura,
  enfocar,
  acciones,
}: {
  nodo: NodoArbol
  resultado: ResultadoNodo | undefined
  soloLectura: boolean
  /** Enfoca el campo Actividad al montarse (fila nueva o recién movida). */
  enfocar: boolean
  acciones: AccionesDetalle
}) {
  const nombre = useRef<HTMLInputElement>(null)
  const [peso, setPeso] = useState(pesoATexto(nodo.peso))
  const [nuevoResp, setNuevoResp] = useState('')
  const responsables = nodo.responsables ?? []

  useEffect(() => {
    if (enfocar) nombre.current?.focus()
  }, [enfocar])
  // Si el peso cambia por fuera (deshacer, recarga), el texto lo sigue.
  const [pesoPrevio, setPesoPrevio] = useState(nodo.peso)
  if (pesoPrevio !== nodo.peso) {
    setPesoPrevio(nodo.peso)
    setPeso(pesoATexto(nodo.peso))
  }

  const confirmarPeso = () => {
    const p = textoAPeso(peso)
    if (p === undefined) setPeso(pesoATexto(nodo.peso))
    else if (p !== (nodo.peso ?? null)) acciones.aplicar({ peso: p })
  }

  const teclaNombre = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      acciones.agregarDebajo()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) acciones.desindentar()
      else acciones.indentar()
    } else if (e.key === 'Escape') {
      acciones.cerrar()
    }
  }

  const teclaResp = (e: KeyboardEvent<HTMLInputElement>) => {
    const texto = nuevoResp.trim()
    if (e.key === 'Enter' && texto) {
      e.preventDefault()
      if (responsables.length < MAX_RESPONSABLES)
        acciones.aplicar({ responsables: [...responsables, texto.slice(0, 120)] })
      setNuevoResp('')
    } else if (e.key === 'Backspace' && !nuevoResp && responsables.length) {
      acciones.aplicar({ responsables: responsables.slice(0, -1) })
    }
  }

  const r = resultado
  const calculados = (
    <dl className="col-span-full grid grid-cols-2 gap-3 border-t border-linea-2 pt-3 sm:grid-cols-5">
      <Dato texto="Planeado" valor={r ? porcentaje(r.pv) : '—'} />
      <Dato texto="Real" valor={r ? porcentaje(r.ev) : '—'} />
      <Dato texto="Desviación" valor={r?.dur ? `${Math.round(r.desv)} días` : '—'} />
      <Dato texto="Duración" valor={r?.dur ? `${r.dur} días` : '—'} />
      <Dato texto="Fin proyectado" valor={r?.forecast ? fechaCorta(r.forecast) : '—'} />
    </dl>
  )

  if (soloLectura) {
    return (
      <div className="grid gap-3 border-t border-linea-2 bg-fondo/60 px-4 py-3.5 sm:pl-[78px]">
        <dl className="grid gap-3 sm:grid-cols-4">
          <Dato texto="Actividad" valor={nodo.nombre || 'Sin nombre'} />
          <Dato texto="Entregable" valor={nodo.entregable || 'Sin entregable'} />
          <Dato texto="Responsables" valor={responsables.join(', ') || 'Sin responsable'} />
          <Dato
            texto="Fechas"
            valor={
              nodo.inicio && nodo.fin
                ? `${fechaCorta(nodo.inicio)} – ${fechaCorta(nodo.fin)}`
                : 'Sin fechas'
            }
          />
        </dl>
        {calculados}
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label={`Detalle de ${nodo.item}`}
      className="grid grid-cols-2 gap-3 border-t border-linea-2 bg-fondo/60 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_96px_150px_150px] sm:pl-[78px]"
    >
      <Etiqueta texto="Actividad" className="col-span-2 sm:col-span-1">
        <input
          ref={nombre}
          className={ENTRADA}
          value={nodo.nombre}
          maxLength={300}
          placeholder="Nombre de la actividad"
          onChange={(e) => acciones.aplicar({ nombre: e.target.value })}
          onKeyDown={teclaNombre}
        />
      </Etiqueta>
      <Etiqueta texto="Entregable" className="col-span-2 sm:col-span-1">
        <input
          className={ENTRADA}
          value={nodo.entregable ?? ''}
          maxLength={1000}
          placeholder="Sin entregable"
          onChange={(e) => acciones.aplicar({ entregable: e.target.value || null })}
        />
      </Etiqueta>
      {nodo.esHoja ? (
        <>
          <Etiqueta texto="Peso (%)">
            <input
              className={`${ENTRADA} text-right font-mono`}
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              onBlur={confirmarPeso}
              onKeyDown={(e) => e.key === 'Enter' && confirmarPeso()}
            />
          </Etiqueta>
          <Etiqueta texto="Inicio">
            <input
              type="date"
              className={ENTRADA}
              value={nodo.inicio ?? ''}
              onChange={(e) =>
                acciones.aplicar({ inicio: fechaValida(e.target.value) ? e.target.value : null })
              }
            />
          </Etiqueta>
          <Etiqueta texto="Fin">
            <input
              type="date"
              className={ENTRADA}
              value={nodo.fin ?? ''}
              onChange={(e) =>
                acciones.aplicar({ fin: fechaValida(e.target.value) ? e.target.value : null })
              }
            />
          </Etiqueta>
        </>
      ) : (
        <p className="col-span-2 self-end pb-2 text-xs text-texto-2 sm:col-span-3">
          Peso y fechas se calculan con sus actividades.
        </p>
      )}

      <div className="col-span-full flex flex-col gap-1">
        <span id={`resp-${nodo.id}`} className="text-xs font-semibold text-texto-2">
          Responsables
        </span>
        <div
          aria-labelledby={`resp-${nodo.id}`}
          className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-control border border-linea bg-superficie px-2 py-1"
        >
          {responsables.map((nombreResp, i) => (
            <span
              key={`${nombreResp}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-fondo px-2 py-0.5 text-xs font-semibold text-tinta"
            >
              {nombreResp}
              <button
                type="button"
                aria-label={`Quitar ${nombreResp}`}
                onClick={() =>
                  acciones.aplicar({ responsables: responsables.filter((_, j) => j !== i) })
                }
                className="flex rounded-full p-0.5 text-texto-2 hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {responsables.length < MAX_RESPONSABLES && (
            <input
              aria-label="Agregar responsable"
              placeholder="Agregar"
              value={nuevoResp}
              onChange={(e) => setNuevoResp(e.target.value)}
              onKeyDown={teclaResp}
              className="min-w-24 flex-1 bg-transparent px-1 text-sm text-tinta outline-none"
            />
          )}
        </div>
      </div>

      {calculados}

      <div className="col-span-full flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={acciones.agregarDebajo}>
          Agregar debajo
        </Boton>
        <Boton variante="fantasma" onClick={acciones.eliminar} className="text-alerta-texto">
          Eliminar actividad
        </Boton>
        <span className="ml-auto self-center text-xs text-texto-2 max-sm:hidden">
          Enter agrega debajo · Tab sangra · Mayús + Tab saca de nivel
        </span>
      </div>
    </div>
  )
}
