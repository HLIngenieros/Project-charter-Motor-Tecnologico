import type { AvanceFoto, Aviso as AvisoCronograma, NodoArbol } from '@charter/shared'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { v7 } from 'uuid'
import { Aviso } from '../../../componentes/Aviso'
import { Boton } from '../../../componentes/Boton'
import { Cargando } from '../../../componentes/Cargando'
import { Dialogo } from '../../../componentes/Dialogo'
import { fechaCorta, porcentaje } from '../../../formato'
import { DetalleActividad, type AccionesDetalle } from './DetalleActividad'
import { COLUMNAS, FilaGantt } from './FilaGantt'
import { aPorcentaje, marcas as marcasDe, rangoVisible, type Escala } from './escala'
import * as op from './operaciones'
import type { Extremo } from './PistaGantt'
import type { BorradorCronograma } from './useBorradorCronograma'

/** Filas visibles en preorden: las hijas de una agrupadora plegada no se muestran. */
function visibles(arbol: NodoArbol[], plegadas: Set<string>): NodoArbol[] {
  const salida: NodoArbol[] = []
  const visitar = (n: NodoArbol) => {
    salida.push(n)
    if (!plegadas.has(n.id)) n.hijos.forEach(visitar)
  }
  arbol.forEach(visitar)
  return salida
}

const SIN_AVISOS: AvisoCronograma[] = []

/** Ancho real de la pista de fechas, para separar las etiquetas de mes de la del corte. */
function useAnchoPista() {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState<number | undefined>(undefined)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(([e]) => {
      const w = Math.round(e!.contentRect.width)
      if (w > 0) setAncho(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, ancho] as const
}

const Mas = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export function SeccionCronograma({
  borrador: b,
  soloLectura,
  noExistia,
  eliminadas = [],
}: {
  borrador: BorradorCronograma
  soloLectura: boolean
  /** Vista histórica: hojas actuales que no estaban en el corte. */
  noExistia?: Set<string>
  /** Vista histórica: filas de la foto cuya actividad ya no existe. */
  eliminadas?: AvanceFoto[]
}) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const [enfocar, setEnfocar] = useState<string | null>(null)
  const [plegadas, setPlegadas] = useState<Set<string>>(new Set())
  const [porEliminar, setPorEliminar] = useState<string | null>(null)
  const { aplicar, acts, avances } = b

  const filas = useMemo(() => visibles(b.arbol, plegadas), [b.arbol, plegadas])
  const avisoPesos = b.avisos.find((a) => a.codigo === 'pesos_no_suman_100')
  const avisosPorId = useMemo(() => {
    const m = new Map<string, AvisoCronograma[]>()
    for (const a of b.avisos)
      if (a.actividadId) m.set(a.actividadId, [...(m.get(a.actividadId) ?? []), a])
    return m
  }, [b.avisos])
  const grupos = useMemo(() => b.arbol.filter((n) => !n.esHoja).map((n) => n.id), [b.arbol])

  const [escala, setEscala] = useState<Escala>('semestre')
  const [destello, setDestello] = useState<string | null>(null)
  const [cabecera, anchoPista] = useAnchoPista()
  // Por fechas, no por el objeto del cálculo: así las filas no cambian de props en cada recálculo.
  const { inicio, fin } = b.calculo.proyecto
  const rango = useMemo(
    () => rangoVisible({ inicio, fin }, escala, b.fechaCalculo),
    [inicio, fin, escala, b.fechaCalculo],
  )
  const marcas = useMemo(
    () => marcasDe(rango, escala, b.fechaCalculo, anchoPista),
    [rango, escala, b.fechaCalculo, anchoPista],
  )
  const corte = aPorcentaje(b.fechaCalculo, rango)
  useEffect(() => {
    if (!destello) return
    const t = setTimeout(() => setDestello(null), 1200)
    return () => clearTimeout(t)
  }, [destello])

  const agregar = useCallback(
    (despuesDe: string | null) => {
      const id = v7()
      aplicar((a) => op.agregar(a, despuesDe, id))
      setAbierta(id)
      setEnfocar(id)
    },
    [aplicar],
  )

  const eliminar = useCallback(
    (id: string) => {
      aplicar((a) => op.eliminar(a, id))
      setAbierta(null)
      setPorEliminar(null)
    },
    [aplicar],
  )

  const pedirEliminar = (id: string) => {
    const afectadas = [id, ...op.descendientes(acts, id)]
    if (afectadas.some((x) => x in avances)) setPorEliminar(id)
    else eliminar(id)
  }

  const acciones = (id: string): AccionesDetalle => ({
    aplicar: (cambios) => aplicar((a) => op.editar(a, id, cambios)),
    agregarDebajo: () => agregar(id),
    indentar: () => {
      aplicar((a) => op.indentar(a, id))
      setEnfocar(id)
    },
    desindentar: () => {
      aplicar((a) => op.desindentar(a, id))
      setEnfocar(id)
    },
    eliminar: () => pedirEliminar(id),
    cerrar: () => setAbierta(null),
  })

  const alTecla = useCallback(
    (id: string, e: KeyboardEvent<HTMLButtonElement>) => {
      if (soloLectura || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
      e.preventDefault()
      aplicar((a) => op.mover(a, id, e.key === 'ArrowUp' ? -1 : 1))
      // Mover reordena los nodos y React les quita el foco: se devuelve a la fila.
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(
            `[data-fila="${id}"] button[aria-expanded]:not([aria-label])`,
          )
          ?.focus(),
      )
    },
    [soloLectura, aplicar],
  )
  const alAbrir = useCallback((id: string) => setAbierta((x) => (x === id ? null : id)), [])
  const alPlegar = useCallback(
    (id: string) =>
      setPlegadas((p) => {
        const s = new Set(p)
        if (s.has(id)) s.delete(id)
        else s.add(id)
        return s
      }),
    [],
  )
  const alMover = useCallback(
    (id: string, dias: number, extremo: Extremo) => {
      aplicar((a) => op.moverFechas(a, id, dias, extremo))
      setDestello(id)
    },
    [aplicar],
  )

  return (
    <section id="cronograma" aria-labelledby="titulo-cronograma" className="scroll-mt-28">
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 id="titulo-cronograma" className="text-lg font-semibold">
          Cronograma
        </h2>
        {!soloLectura && (
          <p className="text-[0.8125rem] text-texto-2 max-2xl:hidden">
            Arrastra una barra para mover sus fechas; sus extremos cambian el inicio o el fin.
          </p>
        )}
        {grupos.length > 0 && (
          <div className="ml-auto flex items-center gap-1 max-md:hidden">
            <button
              type="button"
              onClick={() => setPlegadas(new Set(grupos))}
              className="rounded-[6px] px-2.5 py-1 text-[0.8125rem] font-semibold text-texto-2 hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
            >
              Plegar a grupos
            </button>
            <button
              type="button"
              onClick={() => setPlegadas(new Set())}
              className="rounded-[6px] px-2.5 py-1 text-[0.8125rem] font-semibold text-texto-2 hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
            >
              Desplegar todo
            </button>
          </div>
        )}
        <div
          role="group"
          aria-label="Escala"
          className={`${grupos.length > 0 ? 'md:ml-0' : ''} ml-auto inline-flex rounded-control bg-fondo p-[3px]`}
        >
          {(
            [
              ['trimestre', 'Trimestre'],
              ['semestre', 'Semestre'],
              ['anio', 'Año'],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={escala === valor}
              onClick={() => setEscala(valor)}
              className="rounded-[6px] px-3 py-1 text-[0.8125rem] font-semibold text-texto-2 aria-pressed:bg-superficie aria-pressed:text-tinta aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-acento"
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      {b.conflicto && (
        <Aviso tono="alerta" className="mb-3">
          <span className="flex flex-wrap items-center gap-x-3">
            El cronograma cambió en otra pestaña.
            <button
              type="button"
              onClick={b.recargar}
              className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
            >
              Recargar
            </button>
          </span>
        </Aviso>
      )}
      {avisoPesos && <Aviso className="mb-3">{avisoPesos.mensaje}</Aviso>}

      {b.error ? (
        <Aviso tono="alerta">No se pudo cargar el cronograma. {b.error.message}</Aviso>
      ) : b.cargando ? (
        <Cargando />
      ) : (
        <div className="overflow-hidden rounded-control border border-linea">
          <div
            className={`${COLUMNAS} min-h-8 items-center bg-fondo text-xs font-semibold text-texto-2`}
          >
            <div className="px-2.5 max-md:hidden">Ítem</div>
            <div className="px-2.5">Actividad</div>
            <div className="px-2.5 text-right max-md:hidden">Peso</div>
            <div className="px-2.5 max-md:hidden">Estado</div>
            <div ref={cabecera} className="relative h-8 overflow-hidden" aria-label="Fechas">
              <span className="sr-only">Fechas</span>
              {marcas.map((m) => (
                <Fragment key={m.fecha}>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 border-l border-linea-2"
                    style={{ left: `${aPorcentaje(m.fecha, rango)}%` }}
                  />
                  <span
                    aria-hidden
                    className="absolute top-2 pl-1.5 text-[0.71875rem] font-normal"
                    style={{ left: `${aPorcentaje(m.fecha, rango)}%` }}
                  >
                    {m.etiqueta}
                  </span>
                </Fragment>
              ))}
              {corte >= 0 && corte <= 100 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 z-[2] -ml-px w-0.5 bg-acento"
                  style={{ left: `${corte}%` }}
                >
                  <span className="absolute top-[7px] left-1.5 rounded-[3px] bg-fondo px-1 text-[0.6875rem] font-semibold whitespace-nowrap text-[#00759c]">
                    {fechaCorta(b.fechaCalculo).replace(/ \d{4}$/, '')}
                  </span>
                </span>
              )}
            </div>
          </div>

          {filas.length === 0 && (
            <p className="border-t border-linea-2 px-4 py-6 text-sm text-texto-2">
              Aún no hay actividades.
            </p>
          )}
          {filas.map((n) => (
            <Fragment key={n.id}>
              <FilaGantt
                nodo={n}
                resultado={b.calculo.nodos[n.id]}
                avisos={avisosPorId.get(n.id) ?? SIN_AVISOS}
                abierta={abierta === n.id}
                plegada={plegadas.has(n.id)}
                destello={destello === n.id}
                noExistia={noExistia?.has(n.id) ?? false}
                rango={rango}
                fechaCorte={b.fechaCalculo}
                marcas={marcas}
                soloLectura={soloLectura}
                alAbrir={alAbrir}
                alPlegar={alPlegar}
                alTecla={alTecla}
                alMover={alMover}
              />
              {abierta === n.id && (
                <DetalleActividad
                  nodo={n}
                  resultado={b.calculo.nodos[n.id]}
                  soloLectura={soloLectura}
                  enfocar={enfocar === n.id}
                  acciones={acciones(n.id)}
                />
              )}
            </Fragment>
          ))}

          {eliminadas.map((f) => (
            <div
              key={f.actividadId}
              className={`${COLUMNAS} min-h-9 items-center border-t border-linea-2 text-[0.8125rem] text-texto-2`}
            >
              <div className="px-2.5 font-mono text-xs max-md:hidden">{f.item}</div>
              <div className="flex min-w-0 items-baseline gap-2 pr-2.5 pl-[42px]">
                <span className="truncate line-through decoration-texto-3">{f.nombre}</span>
                <span className="flex-none text-xs italic">actividad eliminada</span>
              </div>
              <div className="px-2.5 text-right font-mono text-xs max-md:hidden">
                {f.peso ? porcentaje(f.peso) : '—'}
              </div>
              <div className="px-2.5 font-mono text-xs max-md:hidden">{porcentaje(f.pct)} real</div>
              <div />
            </div>
          ))}

          {!soloLectura && (
            <div className="flex items-center gap-2.5 border-t border-linea-2 px-2.5 py-2 max-md:hidden">
              <Boton variante="fantasma" onClick={() => agregar(acts.at(-1)?.id ?? null)}>
                <Mas />
                Agregar actividad
              </Boton>
            </div>
          )}
        </div>
      )}

      <Dialogo
        abierto={porEliminar !== null}
        alCerrar={() => setPorEliminar(null)}
        titulo="Eliminar actividad"
      >
        <p className="mb-5 text-sm text-texto">
          Tiene avances registrados. Los cortes pasados los conservan.
        </p>
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setPorEliminar(null)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={() => porEliminar && eliminar(porEliminar)}>
            Eliminar
          </Boton>
        </div>
      </Dialogo>
    </section>
  )
}
