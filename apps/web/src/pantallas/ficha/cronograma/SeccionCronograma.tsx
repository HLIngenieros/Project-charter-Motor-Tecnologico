import { aDia, type NodoArbol } from '@charter/shared'
import { Fragment, useCallback, useMemo, useState, type KeyboardEvent } from 'react'
import { v7 } from 'uuid'
import { Aviso } from '../../../componentes/Aviso'
import { Boton } from '../../../componentes/Boton'
import { Cargando } from '../../../componentes/Cargando'
import { Dialogo } from '../../../componentes/Dialogo'
import { DetalleActividad, type AccionesDetalle } from './DetalleActividad'
import { COLUMNAS, FilaGantt } from './FilaGantt'
import * as op from './operaciones'
import { useBorradorCronograma } from './useBorradorCronograma'

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
  charterId,
  soloLectura,
}: {
  charterId: string
  soloLectura: boolean
}) {
  const b = useBorradorCronograma(charterId)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [enfocar, setEnfocar] = useState<string | null>(null)
  const [plegadas, setPlegadas] = useState<Set<string>>(new Set())
  const [porEliminar, setPorEliminar] = useState<string | null>(null)
  const { aplicar, acts, avances } = b

  const filas = useMemo(() => visibles(b.arbol, plegadas), [b.arbol, plegadas])
  const avisoPesos = b.avisos.find((a) => a.codigo === 'pesos_no_suman_100')

  const rango = useMemo(() => {
    const p = b.calculo.proyecto
    if (!p.inicio || !p.fin) return null
    return { desde: aDia(p.inicio), dias: aDia(p.fin) - aDia(p.inicio) + 1 }
  }, [b.calculo.proyecto])

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

  const teclaFila = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
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
  }

  const pista = (n: NodoArbol) => {
    const r = b.calculo.nodos[n.id]
    if (!rango || !r?.inicio || !r.fin) return null
    const izq = ((aDia(r.inicio) - rango.desde) / rango.dias) * 100
    const ancho = ((aDia(r.fin) - aDia(r.inicio) + 1) / rango.dias) * 100
    return (
      <div className="relative h-full min-h-9">
        <span
          className={`absolute rounded ${n.esHoja ? 'top-[11px] h-3.5 bg-barra' : 'top-[15px] h-[7px] bg-tinta/18'}`}
          style={{ left: `${izq}%`, width: `${ancho}%` }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded bg-tinta/70"
            style={{ width: `${r.ev * 100}%` }}
          />
        </span>
      </div>
    )
  }

  return (
    <section id="cronograma" aria-labelledby="titulo-cronograma" className="scroll-mt-28">
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 id="titulo-cronograma" className="text-lg font-semibold">
          Cronograma
        </h2>
        {!soloLectura && (
          <p className="text-[0.8125rem] text-texto-2 max-md:hidden">
            Haz clic en una actividad para editar su detalle.
          </p>
        )}
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
            <div className="px-2.5">Fechas</div>
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
                avisos={b.avisos.filter((a) => a.actividadId === n.id)}
                abierta={abierta === n.id}
                plegada={plegadas.has(n.id)}
                destello={false}
                pista={pista(n)}
                alAbrir={() => setAbierta((x) => (x === n.id ? null : n.id))}
                alPlegar={() =>
                  setPlegadas((p) => {
                    const s = new Set(p)
                    if (s.has(n.id)) s.delete(n.id)
                    else s.add(n.id)
                    return s
                  })
                }
                alTecla={teclaFila(n.id)}
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
