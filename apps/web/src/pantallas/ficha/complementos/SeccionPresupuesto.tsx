import {
  totalPresupuesto,
  valorRubro,
  type CharterDetalle,
  type LineaRubro,
  type Rubro,
} from '@charter/shared'
import { motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { v7 } from 'uuid'
import { useGuardarPresupuesto } from '../../../api/charters'
import { Cifra } from '../../../componentes/Cifra'
import { leerPesos, pesos } from '../../../formato'
import { BotonIcono, Icono } from '../ListaEditable'
import {
  AccionesFila,
  BotonAgregar,
  CLASE_CAMPO,
  CampoNumero,
  CampoTexto,
  manejadoresFila,
  useEnfocarFila,
} from './controles'
import { useColeccion } from './useColeccion'

const MAXIMO = 50
const MAXIMO_VALOR = 1e13
const MAXIMO_CANTIDAD = 1e9

const nuevoRubro = (): Rubro => ({ id: v7(), descripcion: '', valor: 0, lineas: [] })
const nuevaLinea = (): LineaRubro => ({ id: v7(), concepto: '', cantidad: 0, valorUnitario: 0 })

const lineaVacia = (l: LineaRubro) =>
  !l.concepto.trim() && l.cantidad === 0 && l.valorUnitario === 0
const rubroVacio = (r: Rubro) => !r.descripcion.trim() && r.valor === 0 && r.lineas.length === 0

const conDatos = (lineas: LineaRubro[]) => lineas.filter((l) => !lineaVacia(l))

/** Con líneas útiles, el valor es su suma; si no, se conserva el escrito. */
function valorDeLineas(lineas: LineaRubro[], previo: number): number {
  const utiles = conDatos(lineas)
  return utiles.length ? valorRubro({ valor: 0, lineas: utiles }) : previo
}

/** Quita las líneas vacías; si no hay ninguna, devuelve el mismo rubro. */
function limpiar(r: Rubro): Rubro {
  if (!r.lineas.some(lineaVacia)) return r
  return { ...r, lineas: conDatos(r.lineas) }
}

const cop = (n: number) => `COP ${pesos(n)}`

/** Número · descripción · barra · valor · acciones. En celular la barra pasa bajo la descripción. */
const COLUMNAS =
  'grid grid-cols-[28px_minmax(0,1fr)_auto] gap-x-2 gap-y-1.5 md:grid-cols-[28px_minmax(0,1fr)_minmax(0,1.1fr)_9.5rem_auto] md:gap-x-4'
const FILA = `${COLUMNAS} items-center py-[9px]`
const NUMERO = 'font-cifra text-[0.8125rem] font-semibold text-texto-2'
/**
 * Concepto · cantidad · valor unitario · subtotal · quitar. En celular el concepto ocupa la
 * primera fila (con quitar) y las cifras pasan a la segunda.
 */
const SUBCOLUMNAS =
  'grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-2 sm:grid-cols-[minmax(0,1fr)_5rem_8.5rem_8.5rem_auto] sm:gap-x-3'
const EN_SM = 'sm:col-auto sm:row-auto'
const SUB = {
  concepto: `col-span-3 ${EN_SM}`,
  cantidad: `col-start-1 row-start-2 ${EN_SM}`,
  unitario: `col-start-2 row-start-2 ${EN_SM}`,
  subtotal: `col-start-3 row-start-2 ${EN_SM}`,
  quitar: `col-start-4 row-start-1 ${EN_SM}`,
}

function Barra({ valor, mayor }: { valor: number; mayor: number }) {
  const ancho = mayor > 0 ? (valor / mayor) * 100 : 0
  return (
    <div
      aria-hidden
      className="col-start-2 row-start-2 h-2.5 overflow-hidden rounded-full bg-fondo md:col-start-3 md:row-start-1"
    >
      <div
        data-barra
        className="h-full rounded-full bg-institucional transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: `${ancho.toFixed(2)}%` }}
      />
    </div>
  )
}

/** Valor en pesos con separador de miles; guarda lo escrito mientras se edita. */
function CampoPesos({
  etiqueta,
  valor,
  alCambiar,
  alSalir,
  className = '',
}: {
  etiqueta: string
  valor: number
  alCambiar(valor: number): void
  alSalir(): void
  className?: string
}) {
  const [texto, setTexto] = useState(() => (valor ? pesos(valor) : ''))
  const invalido = leerPesos(texto) === null
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={etiqueta}
      aria-invalid={invalido || undefined}
      value={texto}
      placeholder="0"
      maxLength={22}
      onChange={(e) => {
        setTexto(e.target.value)
        const n = leerPesos(e.target.value)
        if (n !== null) alCambiar(Math.min(n, MAXIMO_VALOR))
      }}
      onBlur={() => {
        setTexto(valor ? pesos(valor) : '')
        alSalir()
      }}
      className={`${CLASE_CAMPO} !mx-0 text-right font-cifra tabular-nums ${invalido ? 'shadow-[inset_0_-2px_0_var(--color-alerta)]' : ''} ${className}`}
    />
  )
}

function BotonDesglose({
  n,
  abierto,
  lineas,
  alPulsar,
  controla,
}: {
  n: number
  abierto: boolean
  lineas: number
  alPulsar(): void
  controla: string
}) {
  return (
    <button
      type="button"
      aria-expanded={abierto}
      aria-controls={controla}
      aria-label={`Desglose del rubro ${n}`}
      title={lineas ? `Desglose (${lineas})` : 'Desglose'}
      onClick={alPulsar}
      className="relative grid size-7 place-items-center rounded-control text-texto-2 transition-colors duration-150 hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
    >
      <Icono>
        <path
          d={abierto ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
          className="transition-[d] duration-150"
        />
      </Icono>
      {lineas > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-tinta px-0.5 font-cifra text-[0.625rem] leading-none font-semibold text-white"
        >
          {lineas}
        </span>
      )}
    </button>
  )
}

function CabeceraLineas() {
  return (
    <div aria-hidden className={`${SUBCOLUMNAS} pb-1 text-xs font-semibold text-texto-2`}>
      <span className="max-sm:hidden">Concepto</span>
      <span className="text-right">Cantidad</span>
      <span className="text-right">Valor unitario</span>
      <span className="text-right">Subtotal</span>
      <span className="w-7" />
    </div>
  )
}

/** Desglose de un rubro: concepto · cantidad · valor unitario · subtotal. */
function Desglose({
  id,
  n,
  lineas,
  editable,
  alCambiar,
  alSalir,
}: {
  id: string
  n: number
  lineas: LineaRubro[]
  editable?: boolean
  alCambiar?(lineas: LineaRubro[], inmediato?: boolean): void
  alSalir?(): void
}) {
  const cambiarLinea = (lineaId: string, cambios: Partial<LineaRubro>) =>
    alCambiar?.(lineas.map((l) => (l.id === lineaId ? { ...l, ...cambios } : l)))
  return (
    <div
      id={id}
      className="col-span-full mt-1 mb-1 ml-[36px] rounded-[8px] border border-linea-2 bg-[#f8fafc] px-3 py-2 md:ml-[44px]"
    >
      {lineas.length === 0 ? (
        <p className="text-sm text-texto-2">
          Sin desglose: el valor del rubro se escribe directamente.
        </p>
      ) : (
        <>
          <CabeceraLineas />
          <ul aria-label={`Desglose del rubro ${n}`} className="flex flex-col">
            {lineas.map((l, j) => {
              const m = j + 1
              const subtotal = Math.round(l.cantidad * l.valorUnitario)
              return (
                <li
                  key={l.id}
                  data-linea={l.id}
                  className={`${SUBCOLUMNAS} items-center border-t border-linea-2 py-1 first:border-t-0`}
                >
                  {editable ? (
                    <>
                      <input
                        type="text"
                        data-concepto
                        aria-label={`Concepto de la línea ${m} del rubro ${n}`}
                        value={l.concepto}
                        maxLength={300}
                        placeholder="Concepto"
                        onChange={(e) => cambiarLinea(l.id, { concepto: e.target.value })}
                        onBlur={alSalir}
                        className={`${CLASE_CAMPO} !mx-0 text-sm ${SUB.concepto}`}
                      />
                      <CampoNumero
                        etiqueta={`Cantidad de la línea ${m} del rubro ${n}`}
                        valor={l.cantidad || null}
                        alCambiar={(c) =>
                          cambiarLinea(l.id, {
                            cantidad: Math.min(Math.max(c ?? 0, 0), MAXIMO_CANTIDAD),
                          })
                        }
                        alSalir={alSalir!}
                        placeholder="0"
                        className={`!mx-0 text-right text-sm ${SUB.cantidad}`}
                      />
                      <CampoPesos
                        etiqueta={`Valor unitario de la línea ${m} del rubro ${n}`}
                        valor={l.valorUnitario}
                        alCambiar={(valorUnitario) => cambiarLinea(l.id, { valorUnitario })}
                        alSalir={alSalir!}
                        className={`text-sm ${SUB.unitario}`}
                      />
                    </>
                  ) : (
                    <>
                      <span className={`text-sm text-texto ${SUB.concepto}`}>
                        {l.concepto || 'Sin descripción'}
                      </span>
                      <span
                        className={`text-right font-cifra text-sm tabular-nums ${SUB.cantidad}`}
                      >
                        {l.cantidad.toLocaleString('es-CO')}
                      </span>
                      <span
                        className={`text-right font-cifra text-sm tabular-nums ${SUB.unitario}`}
                      >
                        {pesos(l.valorUnitario)}
                      </span>
                    </>
                  )}
                  <span
                    className={`text-right font-cifra text-sm text-tinta tabular-nums ${SUB.subtotal}`}
                  >
                    {pesos(subtotal)}
                  </span>
                  <span className={SUB.quitar}>
                    {editable && (
                      <BotonIcono
                        etiqueta={`Quitar línea ${m} del rubro ${n}`}
                        alPulsar={() =>
                          alCambiar?.(
                            lineas.filter((x) => x.id !== l.id),
                            true,
                          )
                        }
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </BotonIcono>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {editable && lineas.length < MAXIMO && (
        <BotonAgregar
          texto="Agregar línea"
          alPulsar={() => alCambiar?.([...lineas, nuevaLinea()])}
        />
      )}
    </div>
  )
}

function Total({ total }: { total: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[10px] bg-fondo px-4 py-3">
      <span className="text-sm font-semibold text-texto-2">Presupuesto total</span>
      <Cifra
        valor={total}
        formato={cop}
        className="font-titulo text-2xl font-semibold tracking-tight text-tinta tabular-nums"
      />
    </div>
  )
}

function useAbiertos() {
  const [abiertos, setAbiertos] = useState<ReadonlySet<string>>(new Set())
  const alternar = (id: string) =>
    setAbiertos((a) => {
      const b = new Set(a)
      if (b.has(id)) b.delete(id)
      else b.add(id)
      return b
    })
  return { abiertos, alternar }
}

function Lectura({ rubros, idTitulo }: { rubros: Rubro[]; idTitulo: string }) {
  const { abiertos, alternar } = useAbiertos()
  const idBase = useId()
  const mayor = Math.max(0, ...rubros.map((r) => r.valor))
  return (
    <ol aria-labelledby={idTitulo} className="flex flex-col">
      {rubros.map((r, i) => {
        const n = i + 1
        const idDesglose = `${idBase}-${r.id}`
        return (
          <li key={r.id} className={`${FILA} border-t border-linea-2 first:border-t-0`}>
            <span aria-hidden className={NUMERO}>
              {n}
            </span>
            <span
              className={`min-w-0 text-[0.9375rem] leading-relaxed ${r.descripcion ? 'text-tinta' : 'text-texto-3'}`}
            >
              {r.descripcion || 'Sin descripción'}
            </span>
            <span className="text-right font-cifra text-[0.9375rem] font-semibold text-tinta tabular-nums md:col-start-4 md:row-start-1">
              {pesos(r.valor)}
            </span>
            <Barra valor={r.valor} mayor={mayor} />
            <span className="col-start-3 row-start-2 justify-self-end md:col-start-5 md:row-start-1">
              {r.lineas.length > 0 ? (
                <BotonDesglose
                  n={n}
                  abierto={abiertos.has(r.id)}
                  lineas={r.lineas.length}
                  alPulsar={() => alternar(r.id)}
                  controla={idDesglose}
                />
              ) : (
                <span className="block w-7" />
              )}
            </span>
            {abiertos.has(r.id) && <Desglose id={idDesglose} n={n} lineas={r.lineas} />}
          </li>
        )
      })}
    </ol>
  )
}

function Edicion({ charter, idTitulo }: { charter: CharterDetalle; idTitulo: string }) {
  const { mutateAsync } = useGuardarPresupuesto(charter.id)
  const col = useColeccion<Rubro>({
    inicial: charter.rubros,
    guardar: mutateAsync,
    vacia: rubroVacio,
    limpiar,
    maximo: MAXIMO,
  })
  const lista = useRef<HTMLOListElement>(null)
  useEnfocarFila(col.porEnfocar, lista)
  const { abiertos, alternar } = useAbiertos()
  const idBase = useId()
  /** Línea recién agregada que debe recibir el foco. */
  const lineaPorEnfocar = useRef<string | null>(null)
  useEffect(() => {
    const id = lineaPorEnfocar.current
    if (!id) return
    lineaPorEnfocar.current = null
    lista.current?.querySelector<HTMLElement>(`[data-linea="${id}"] [data-concepto]`)?.focus()
  })

  const filas = col.filas
  const mayor = Math.max(0, ...filas.map((r) => r.valor))
  const total = totalPresupuesto(filas)

  return (
    <>
      {filas.length === 0 ? (
        <p className="mb-1 text-[0.9375rem] text-texto-2">Aún no hay presupuesto.</p>
      ) : (
        <Total total={total} />
      )}
      <ol ref={lista} aria-labelledby={idTitulo} className="flex flex-col">
        {filas.map((r, i) => {
          const n = i + 1
          const idDesglose = `${idBase}-${r.id}`
          const conLineas = conDatos(r.lineas).length > 0
          const cambiarLineas = (lineas: LineaRubro[], inmediato?: boolean) => {
            const nueva = lineas.find((l) => !r.lineas.some((x) => x.id === l.id))
            if (nueva) lineaPorEnfocar.current = nueva.id
            col.editar(r.id, { lineas, valor: valorDeLineas(lineas, r.valor) }, inmediato)
          }
          return (
            <motion.li
              key={r.id}
              layout="position"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              data-fila={r.id}
              className={`group ${FILA} border-t border-linea-2 first:border-t-0`}
              {...manejadoresFila(
                () => col.salir(r.id),
                (paso) => col.mover(r.id, paso),
              )}
            >
              <span aria-hidden className={NUMERO}>
                {n}
              </span>
              <CampoTexto
                primero
                etiqueta={`Rubro ${n}`}
                valor={r.descripcion}
                alCambiar={(descripcion) => col.editar(r.id, { descripcion })}
                alSalir={col.enviar}
                placeholder="Descripción del rubro"
                maximo={300}
                className="text-tinta"
              />
              <div className="w-[8.5rem] md:col-start-4 md:row-start-1 md:w-auto">
                {conLineas ? (
                  <span
                    aria-label={`Valor del rubro ${n}`}
                    className="block pr-1 text-right font-cifra text-[0.9375rem] font-semibold text-tinta tabular-nums"
                  >
                    {pesos(r.valor)}
                  </span>
                ) : (
                  <CampoPesos
                    etiqueta={`Valor del rubro ${n}`}
                    valor={r.valor}
                    alCambiar={(valor) => col.editar(r.id, { valor })}
                    alSalir={col.enviar}
                    className="font-semibold text-tinta"
                  />
                )}
              </div>
              <Barra valor={r.valor} mayor={mayor} />
              <div className="col-start-3 row-start-2 flex items-center justify-end md:col-start-5 md:row-start-1">
                <BotonDesglose
                  n={n}
                  abierto={abiertos.has(r.id)}
                  lineas={r.lineas.length}
                  alPulsar={() => alternar(r.id)}
                  controla={idDesglose}
                />
                <AccionesFila
                  nombre="rubro"
                  n={n}
                  total={filas.length}
                  mover={(paso) => col.mover(r.id, paso)}
                  quitar={() => col.quitar(r.id)}
                />
              </div>
              {abiertos.has(r.id) && (
                <Desglose
                  id={idDesglose}
                  n={n}
                  lineas={r.lineas}
                  editable
                  alCambiar={cambiarLineas}
                  alSalir={col.enviar}
                />
              )}
            </motion.li>
          )
        })}
      </ol>
      {filas.length < MAXIMO && (
        <BotonAgregar texto="Agregar rubro" alPulsar={() => col.agregar(nuevoRubro())} />
      )}
    </>
  )
}

/** Presupuesto planeado: total, barras por rubro y desglose opcional en líneas. */
export function SeccionPresupuesto({
  charter,
  soloLectura,
}: {
  charter: CharterDetalle
  soloLectura: boolean
}) {
  const idTitulo = useId()
  const rubros = charter.rubros
  return (
    <section id="presupuesto" aria-labelledby={idTitulo} className="flex scroll-mt-28 flex-col">
      <h2 id={idTitulo} className="mb-2 text-lg font-semibold">
        Presupuesto
      </h2>
      {soloLectura ? (
        rubros.length === 0 ? (
          <p className="text-[0.9375rem] text-texto-2">Aún no hay presupuesto.</p>
        ) : (
          <>
            <Total total={totalPresupuesto(rubros)} />
            <Lectura rubros={rubros} idTitulo={idTitulo} />
          </>
        )
      ) : (
        <Edicion charter={charter} idTitulo={idTitulo} />
      )}
    </section>
  )
}
