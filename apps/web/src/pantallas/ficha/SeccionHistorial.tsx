import type { CorteResumen, FechaISO } from '@charter/shared'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCortes, useEliminarCorte } from '../../api/cronograma'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Chip } from '../../componentes/Chip'
import { Dialogo } from '../../componentes/Dialogo'
import { Tabla, type Columna } from '../../componentes/Tabla'
import { fechaCorta, porcentaje, puntos } from '../../formato'
import { chipDe } from './cronograma/estados'

const ACCION =
  'rounded-sm text-[0.8125rem] font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-acento'

/** Historial de cortes al final de la hoja: del más reciente al más viejo. */
export function SeccionHistorial({
  charterId,
  soloLectura,
  elegido = null,
  elegirCorte,
}: {
  charterId: string
  soloLectura: boolean
  /** Corte que se ve en la ficha; null = el último. */
  elegido?: FechaISO | null
  elegirCorte?(fecha: FechaISO | null): void
}) {
  const consulta = useCortes(charterId)
  const eliminar = useEliminarCorte(charterId)
  const [porEliminar, setPorEliminar] = useState<FechaISO | null>(null)

  const cortes = useMemo(
    () => [...(consulta.data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [consulta.data],
  )
  const ultimo = cortes[0]?.fecha
  const viendo = elegido ?? ultimo

  const columnas: Columna<CorteResumen>[] = [
    {
      id: 'fecha',
      titulo: 'Corte',
      celda: (c) => (
        <span className="whitespace-nowrap">
          <b className="font-semibold text-tinta">{fechaCorta(c.fecha)}</b>
          {c.fecha === ultimo && <span className="text-texto-2"> · último</span>}
          {elegido && c.fecha === elegido && (
            <span className="font-semibold text-institucional"> · viendo</span>
          )}
        </span>
      ),
    },
    {
      id: 'estado',
      titulo: 'Estado',
      celda: (c) => {
        const chip = chipDe(c, false)
        return <Chip tono={chip.tono}>{chip.texto}</Chip>
      },
    },
    { id: 'pv', titulo: 'Planeado', numerica: true, celda: (c) => porcentaje(c.pv) },
    { id: 'ev', titulo: 'Real', numerica: true, celda: (c) => porcentaje(c.ev) },
    {
      id: 'brecha',
      titulo: 'Brecha',
      numerica: true,
      celda: (c) => puntos(Math.max(0, c.pv - c.ev)),
    },
    {
      id: 'nota',
      titulo: 'Nota',
      celda: (c) => (
        <span title={c.nota || undefined} className="block max-w-[22ch] truncate text-texto-2">
          {c.nota}
        </span>
      ),
    },
  ]
  if (elegirCorte || !soloLectura)
    columnas.push({
      id: 'acciones',
      titulo: <span className="sr-only">Acciones</span>,
      celda: (c) => (
        <span className="flex justify-end gap-3 whitespace-nowrap">
          {elegirCorte && c.fecha !== viendo && (
            <button
              type="button"
              onClick={() => {
                elegirCorte(c.fecha)
                document.querySelector('main')?.scrollIntoView?.({ block: 'start' })
              }}
              aria-label={`Ver la ficha al ${fechaCorta(c.fecha)}`}
              title="Ver la ficha a esta fecha"
              className={`${ACCION} text-institucional`}
            >
              Ver
            </button>
          )}
          {!soloLectura && (
            <>
              <Link
                to={`/charters/${charterId}/corte?fecha=${c.fecha}`}
                aria-label={`Editar el corte del ${fechaCorta(c.fecha)}`}
                className={`${ACCION} text-institucional`}
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => {
                  eliminar.reset()
                  setPorEliminar(c.fecha)
                }}
                aria-label={`Eliminar el corte del ${fechaCorta(c.fecha)}`}
                className={`${ACCION} text-alerta-texto`}
              >
                Eliminar
              </button>
            </>
          )}
        </span>
      ),
    })

  const confirmar = () => {
    if (!porEliminar) return
    eliminar.mutate(porEliminar, { onSuccess: () => setPorEliminar(null) })
  }

  return (
    <section id="cortes" aria-labelledby="titulo-cortes" className="scroll-mt-28">
      <h2 id="titulo-cortes" className="mb-3 text-lg font-semibold">
        Cortes
      </h2>
      {consulta.isError ? (
        <Aviso tono="alerta">{consulta.error.message}</Aviso>
      ) : (
        <Tabla
          titulo="Historial de cortes"
          columnas={columnas}
          filas={cortes}
          claveFila={(c) => c.fecha}
          vacio={
            consulta.isPending
              ? 'Cargando cortes…'
              : 'Aún no hay cortes. Registra el primero cuando arranque el trabajo.'
          }
        />
      )}
      <Dialogo
        abierto={porEliminar !== null}
        alCerrar={() => setPorEliminar(null)}
        titulo="Eliminar corte"
      >
        <p className="text-[0.9375rem] text-texto">
          Se eliminará el corte del {porEliminar ? fechaCorta(porEliminar) : ''}. Sus avances no se
          pueden recuperar.
        </p>
        {eliminar.isError && (
          <Aviso tono="alerta" className="mt-4">
            {eliminar.error.message}
          </Aviso>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setPorEliminar(null)}>
            Volver
          </Boton>
          <Boton variante="peligro" cargando={eliminar.isPending} onClick={confirmar}>
            Eliminar corte
          </Boton>
        </div>
      </Dialogo>
    </section>
  )
}
