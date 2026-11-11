import {
  calcularCronograma,
  construirArbol,
  hojasProgramadas,
  pesosCompletos,
  sumarDias,
  type AvancesPorHoja,
  type FechaISO,
  type Reglas,
} from '@charter/shared'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCharter } from '../../api/charters'
import { ErrorCliente } from '../../api/cliente'
import { useCorte, useCortes, useCronograma, useGuardarCorte } from '../../api/cronograma'
import { Layout } from '../../app/Layout'
import { Aviso } from '../../componentes/Aviso'
import { Boton, clasesBoton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { Chip, textoTono } from '../../componentes/Chip'
import { MiniCurvaS, type PuntoMini } from '../../componentes/MiniCurvaS'
import { Cifra } from '../../componentes/Cifra'
import { fechaCorta, hoyISO, porcentaje, puntos } from '../../formato'
import { chipDe, tonoDe } from '../ficha/cronograma/estados'
import { clasificarHojas } from './clasificar'
import { FilaAvance, leerPorcentaje, textoPorcentaje, type FilaCorte } from './FilaAvance'

const pct = (n: number) => porcentaje(n)

/** Valores fijos con que se arma el formulario. */
interface Preparado {
  filas: FilaCorte[]
  /** Fecha en que cada hoja llegó al 100 % antes de este corte. */
  terminadas: Record<string, FechaISO>
  nota: string
  /** Fecha fija al editar; null en un corte nuevo. */
  fechaFija: FechaISO | null
  minimo: FechaISO | null
  anterior: FechaISO | null
}

function Grupo({
  titulo,
  ayuda,
  children,
  vacio,
}: {
  titulo: string
  ayuda?: string
  children: ReactNode
  vacio?: boolean
}) {
  const id = `grupo-${titulo.split(' ')[0]!.toLowerCase()}`
  return (
    <section
      aria-labelledby={id}
      className="mb-4 overflow-hidden rounded-tarjeta border border-linea bg-superficie"
    >
      <header className="flex flex-wrap items-baseline gap-x-2.5 px-4.5 pt-3.5 pb-2.5">
        <h2 id={id} className="text-base font-semibold">
          {titulo}
        </h2>
        {ayuda && <p className="text-[0.8125rem] text-texto-2">{ayuda}</p>}
      </header>
      {vacio ? (
        <p className="border-t border-linea-2 px-4.5 py-4 text-sm text-texto-2">
          Nada aquí a esta fecha.
        </p>
      ) : (
        children
      )}
    </section>
  )
}

function Formulario({
  charterId,
  nombre,
  p,
  reglas,
  historia,
}: {
  charterId: string
  nombre: string
  p: Preparado
  reglas: Reglas
  /** Cortes guardados: la mini curva usa los anteriores a la fecha. */
  historia: PuntoMini[]
}) {
  const navegar = useNavigate()
  const guardar = useGuardarCorte(charterId)
  const enviando = useRef(false)
  const hoy = hoyISO()
  const [fecha, setFecha] = useState<FechaISO>(p.fechaFija ?? hoy)
  const [textos, setTextos] = useState<Record<string, string>>(() =>
    Object.fromEntries(p.filas.map((f) => [f.id, textoPorcentaje(f.inicial)])),
  )
  const [nota, setNota] = useState(p.nota)
  const [mostrarResto, setMostrarResto] = useState(false)
  const [error, setError] = useState<string>()

  const pcts = useMemo(() => {
    const salida: Record<string, number> = {}
    for (const f of p.filas) salida[f.id] = leerPorcentaje(textos[f.id] ?? '') ?? f.inicial
    return salida
  }, [p.filas, textos])
  // Los grupos se arman con los % del momento en que se eligió la fecha: escribir 100 no
  // saca la fila de su grupo mientras se edita.
  const [pctsGrupos, setPctsGrupos] = useState(pcts)
  const grupos = useMemo(
    () => clasificarHojas(p.filas, pctsGrupos, fecha),
    [p.filas, pctsGrupos, fecha],
  )

  const raices = useMemo(
    () =>
      construirArbol(
        p.filas.map((f, i) => ({
          id: f.id,
          padreId: null,
          orden: i,
          nombre: f.nombre,
          peso: f.peso,
          inicio: f.inicio,
          fin: f.fin,
        })),
      ),
    [p.filas],
  )
  const bloqueado = reglas.sumaPesos === 'obligatoria' && !pesosCompletos(raices, reglas)

  const calculo = useMemo(() => {
    const avances: AvancesPorHoja = Object.fromEntries(
      p.filas.map((f) => [
        f.id,
        { pct: pcts[f.id]!, terminadaEn: pcts[f.id]! >= 1 ? (p.terminadas[f.id] ?? fecha) : null },
      ]),
    )
    return calcularCronograma(raices, avances, fecha, reglas)
  }, [raices, p.filas, p.terminadas, pcts, fecha, reglas])

  const invalidos = p.filas.filter((f) => leerPorcentaje(textos[f.id] ?? '') === null).length
  const proyecto = calculo.proyecto
  const chip = chipDe(proyecto, false)
  const brecha = Math.max(0, proyecto.pv - proyecto.ev)

  const cambiarFecha = (valor: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return
    if ((p.minimo && valor < p.minimo) || valor > hoy) return
    setFecha(valor)
    setPctsGrupos(pcts)
  }

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault()
    if (enviando.current) return
    if (bloqueado) return
    if (invalidos > 0) {
      setError('Revisa los avances: van de 0 a 100.')
      return
    }
    enviando.current = true
    setError(undefined)
    try {
      await guardar.mutateAsync({
        fecha,
        entrada: { nota, avances: p.filas.map((f) => ({ actividadId: f.id, pct: pcts[f.id]! })) },
      })
      void navegar(`/charters/${charterId}`, { state: { aviso: 'Corte guardado' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el corte.')
    } finally {
      enviando.current = false
    }
  }

  const fila = (f: FilaCorte) => (
    <FilaAvance
      key={f.id}
      fila={f}
      texto={textos[f.id] ?? ''}
      resultado={calculo.nodos[f.id]}
      alCambiar={(t) => setTextos((prev) => ({ ...prev, [f.id]: t }))}
    />
  )

  const editar = p.fechaFija !== null
  const botonGuardar = (
    <Boton type="submit" cargando={guardar.isPending} disabled={bloqueado} className="flex-1">
      Guardar corte
    </Boton>
  )

  return (
    <Layout>
      <form
        onSubmit={(e) => void enviar(e)}
        className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] max-lg:gap-4"
      >
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 lg:col-span-2">
          <div>
            <nav aria-label="Ruta" className="mb-1 text-xs text-texto-2">
              <Link to="/" className="rounded-sm hover:text-institucional hover:underline">
                Mis charters
              </Link>
              <span aria-hidden> / </span>
              <Link
                to={`/charters/${charterId}`}
                className="rounded-sm hover:text-institucional hover:underline"
              >
                {nombre}
              </Link>
              <span aria-hidden> / </span>
              <span aria-current="page">{editar ? 'Editar corte' : 'Registrar corte'}</span>
            </nav>
            <h1 className="text-[1.625rem] font-semibold">
              {editar ? 'Editar corte' : 'Registrar corte'}
            </h1>
            <p className="mt-1 text-texto-2">
              {editar
                ? `Corte del ${fechaCorta(fecha)}. Las fechas y pesos son los de ese día.`
                : 'Solo te mostramos lo que debería moverse a esta fecha. Lo demás sigue como estaba.'}
            </p>
          </div>
          {!editar && (
            <div className="ml-auto flex items-end gap-4 max-lg:ml-0 max-lg:w-full">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
                Fecha de corte
                <input
                  type="date"
                  value={fecha}
                  min={p.minimo ?? undefined}
                  max={hoy}
                  onChange={(e) => cambiarFecha(e.target.value)}
                  className="min-h-11 rounded-control border border-linea bg-superficie px-3 font-normal text-tinta hover:border-texto-3 focus:border-acento focus:shadow-foco focus:outline-none"
                />
              </label>
              {p.anterior && (
                <span className="pb-2.5 text-[0.8125rem] text-texto-2">
                  Corte anterior: {fechaCorta(p.anterior)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Grupo
            titulo={`Vencidas · ${grupos.vencidas.length}`}
            ayuda="Su fin ya pasó y no llegan al 100 %."
            vacio={grupos.vencidas.length === 0}
          >
            {grupos.vencidas.map(fila)}
          </Grupo>
          <Grupo
            titulo={`En curso · ${grupos.enCurso.length}`}
            ayuda="La línea indica cuánto deberían llevar a la fecha de corte."
            vacio={grupos.enCurso.length === 0}
          >
            {grupos.enCurso.map(fila)}
          </Grupo>
          {grupos.resto.length > 0 && (
            <Grupo titulo={`Resto · ${grupos.resto.length}`}>
              {mostrarResto && grupos.resto.map(fila)}
              <button
                type="button"
                onClick={() => setMostrarResto((m) => !m)}
                aria-expanded={mostrarResto}
                className="flex min-h-11 w-full items-center border-t border-linea-2 px-4.5 text-left text-sm font-semibold text-institucional hover:bg-fondo/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acento"
              >
                {mostrarResto
                  ? grupos.resto.length === 1
                    ? 'Ocultar la restante'
                    : 'Ocultar las restantes'
                  : grupos.resto.length === 1
                    ? 'Mostrar la restante (terminada o por iniciar)'
                    : `Mostrar las ${grupos.resto.length} restantes (terminadas o por iniciar)`}
              </button>
            </Grupo>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-tarjeta border border-linea bg-superficie p-5 lg:sticky lg:top-5">
          <h2 className="flex items-center justify-between gap-3 text-[0.9375rem] font-semibold">
            Así queda el charter
            <Chip tono={chip.tono}>{chip.texto}</Chip>
          </h2>
          <div className="grid grid-cols-3 rounded-control border border-linea">
            {[
              { t: 'Planeado', v: <Cifra valor={proyecto.pv} formato={pct} /> },
              { t: 'Real', v: <Cifra valor={proyecto.ev} formato={pct} /> },
              {
                t: 'Brecha',
                v: (
                  <Cifra
                    valor={brecha}
                    formato={puntos}
                    className={textoTono(tonoDe(proyecto.estado))}
                  />
                ),
              },
            ].map((c) => (
              <div key={c.t} className="border-r border-linea px-3 py-2.5 last:border-r-0">
                <span className="block text-xs text-texto-2">{c.t}</span>
                <b className="font-titulo text-[1.0625rem] font-semibold text-tinta tabular-nums">
                  {c.v}
                </b>
              </div>
            ))}
          </div>
          <div className="max-md:hidden">
            <MiniCurvaS
              puntos={historia}
              extra={{ fecha, pv: proyecto.pv, ev: proyecto.ev }}
              estado={proyecto.estado}
              ancho={298}
              alto={64}
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
            Nota del corte
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Qué pasó en este periodo, qué bloquea, qué sigue"
              className="resize-y rounded-control border border-linea bg-superficie px-3 py-2 text-[0.9375rem] font-normal text-tinta placeholder:text-texto-3 hover:border-texto-3 focus:border-acento focus:shadow-foco focus:outline-none"
            />
          </label>
          {bloqueado && (
            <Aviso tono="alerta">
              Los pesos de las actividades deben sumar 100 % para registrar un corte.
            </Aviso>
          )}
          {error && <Aviso tono="alerta">{error}</Aviso>}
          <div className="flex gap-2 max-md:hidden">
            <Link to={`/charters/${charterId}`} className={clasesBoton('secundario')}>
              Cancelar
            </Link>
            {botonGuardar}
          </div>
        </aside>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-linea bg-superficie px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(11_31_51/0.2)] md:hidden">
          <p className="text-[0.8125rem] leading-snug text-texto-2">
            Real <b className="text-tinta tabular-nums">{pct(proyecto.ev)}</b> de{' '}
            <b className="text-tinta tabular-nums">{pct(proyecto.pv)}</b> planeado
          </p>
          <Boton
            type="submit"
            cargando={guardar.isPending}
            disabled={bloqueado}
            className="ml-auto shrink-0 whitespace-nowrap"
          >
            Guardar corte
          </Boton>
        </div>
      </form>
    </Layout>
  )
}

function Mensaje({ children, charterId }: { children: ReactNode; charterId: string }) {
  return (
    <Layout>
      <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-12">
        <h1 className="text-2xl font-semibold">Registrar corte</h1>
        <p className="text-texto-2">{children}</p>
        <Link to={`/charters/${charterId}#cronograma`} className={clasesBoton('secundario')}>
          Ir al cronograma
        </Link>
      </div>
    </Layout>
  )
}

export function RegistrarCorte() {
  const { id = '' } = useParams()
  const [busqueda] = useSearchParams()
  const fechaEditar = busqueda.get('fecha')
  const charter = useCharter(id)
  const cronograma = useCronograma(id)
  const cortes = useCortes(id)
  const fechas = useMemo(() => (cortes.data ?? []).map((c) => c.fecha).sort(), [cortes.data])
  const anteriorAEditar = fechaEditar
    ? (fechas.filter((f) => f < fechaEditar).at(-1) ?? null)
    : null
  const foto = useCorte(id, fechaEditar)
  const fotoAnterior = useCorte(id, anteriorAEditar)

  const consultas = [charter, cronograma, cortes, ...(fechaEditar ? [foto] : [])]
  const fallo = consultas.find((c) => c.isError)?.error
  const esperando =
    consultas.some((c) => c.isPending) || (!!anteriorAEditar && fotoAnterior.isPending)

  const preparado = useMemo((): Preparado | null => {
    if (esperando || fallo || !cronograma.data || !cortes.data || !charter.data) return null
    const actuales = new Map(cronograma.data.actividades.map((a) => [a.id, a]))
    if (fechaEditar && foto.data) {
      const previos = new Map(fotoAnterior.data?.avances.map((a) => [a.actividadId, a.pct]))
      const terminadas: Record<string, FechaISO> = {}
      for (const [idHoja, v] of previos)
        if (v >= 1 && anteriorAEditar) terminadas[idHoja] = anteriorAEditar
      return {
        filas: foto.data.avances.map((f) => ({
          id: f.actividadId,
          item: f.item,
          nombre: f.nombre,
          responsables: actuales.get(f.actividadId)?.responsables ?? [],
          peso: f.peso,
          inicio: f.inicio,
          fin: f.fin,
          eliminada: f.eliminada,
          antes: anteriorAEditar ? (previos.get(f.actividadId) ?? 0) : null,
          inicial: f.pct,
        })),
        terminadas,
        nota: foto.data.nota,
        fechaFija: fechaEditar,
        minimo: null,
        anterior: anteriorAEditar,
      }
    }
    const ultimo = cronograma.data.ultimoCorte
    const avances = ultimo?.avances ?? {}
    const terminadas: Record<string, FechaISO> = {}
    for (const [idHoja, a] of Object.entries(avances))
      if (a.terminadaEn) terminadas[idHoja] = a.terminadaEn
    const ultimaFecha = fechas.at(-1) ?? null
    return {
      filas: hojasProgramadas(
        construirArbol(cronograma.data.actividades),
        charter.data?.reglas,
      ).map((h) => ({
        id: h.id,
        item: h.item,
        nombre: h.nombre,
        responsables: h.responsables ?? [],
        peso: h.peso ?? null,
        inicio: h.inicio ?? null,
        fin: h.fin ?? null,
        eliminada: false,
        antes: ultimo ? (avances[h.id]?.pct ?? 0) : null,
        inicial: avances[h.id]?.pct ?? 0,
      })),
      terminadas,
      nota: '',
      fechaFija: null,
      minimo: ultimaFecha ? sumarDias(ultimaFecha, 1) : null,
      anterior: ultimaFecha,
    }
  }, [
    esperando,
    fallo,
    charter.data,
    cronograma.data,
    cortes.data,
    fechas,
    fechaEditar,
    foto.data,
    fotoAnterior.data,
    anteriorAEditar,
  ])

  if (esperando) return <Cargando />
  if (fallo) {
    if (fallo instanceof ErrorCliente && fallo.estado === 404)
      return <Navigate to={`/charters/${id}`} replace />
    return (
      <Layout>
        <Aviso tono="alerta">{fallo.message}</Aviso>
      </Layout>
    )
  }
  if (!charter.data?.permisos.editar) return <Navigate to={`/charters/${id}`} replace />
  if (!preparado) return <Cargando />

  if (!preparado.fechaFija) {
    if (preparado.filas.length === 0)
      return (
        <Mensaje charterId={id}>
          Aún no hay actividades con peso y fechas. Prográmalas en el cronograma antes de registrar
          un corte.
        </Mensaje>
      )
    if (preparado.minimo && preparado.minimo > hoyISO())
      return (
        <Layout>
          <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-12">
            <h1 className="text-2xl font-semibold">Registrar corte</h1>
            <p className="text-texto-2">
              Ya registraste el corte de hoy. Puedes editarlo o volver mañana para el siguiente.
            </p>
            <Link
              to={`/charters/${id}/corte?fecha=${preparado.anterior}`}
              className={clasesBoton('primario')}
            >
              Editar el corte de hoy
            </Link>
          </div>
        </Layout>
      )
  }

  return (
    <Formulario
      key={preparado.fechaFija ?? 'nuevo'}
      charterId={id}
      nombre={charter.data.nombre}
      reglas={charter.data.reglas}
      historia={cortes.data ?? []}
      p={preparado}
    />
  )
}
