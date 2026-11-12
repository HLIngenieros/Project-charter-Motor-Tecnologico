import type { CharterDetalle, CharterEditar, EstadoCharter } from '@charter/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { CLAVES, useAreas, useCategorias, useCharter, useEditarCharter } from '../../api/charters'
import { ErrorCliente } from '../../api/cliente'
import { CLAVE_SESION, useSesion } from '../../api/sesion'
import { Layout } from '../../app/Layout'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { BandaEstado } from './BandaEstado'
import { ContextoGuardado, useColaGuardado, type AlFallar } from './colaGuardado'
import { EstadoGuardadoMovil, IndiceFicha, type SeccionIndice } from './IndiceFicha'
import { MenuCharter } from './MenuCharter'
import { MenuExportar } from './MenuExportar'
import { fechaCorta } from '../../formato'
import { SeccionCronograma } from './cronograma/SeccionCronograma'
import { SeccionCurvaS } from './curva/SeccionCurvaS'
import { SelectorCorte } from './SelectorCorte'
import { useVistaCronograma } from './useVistaCronograma'
import { useBorradorCronograma } from './cronograma/useBorradorCronograma'
import { SeccionHistorial } from './SeccionHistorial'
import { SeccionEncabezado } from './SeccionEncabezado'
import { SeccionObjetivos } from './SeccionObjetivos'
import { SeccionRazon } from './SeccionRazon'
import { SeccionSupuestos } from './SeccionSupuestos'
import { SeccionIndicadores } from './complementos/SeccionIndicadores'

/** Solo las secciones ya construidas; las de fases siguientes se suman aquí. */
function secciones(
  { listas, indicadores }: CharterDetalle,
  actividades?: number,
  cortes?: number,
): SeccionIndice[] {
  return [
    { id: 'encabezado', titulo: 'Encabezado' },
    { id: 'razon', titulo: 'Razón de ser' },
    { id: 'objetivos', titulo: 'Objetivos', cuenta: listas.objetivo.length },
    { id: 'curva', titulo: 'Curva S' },
    { id: 'cronograma', titulo: 'Cronograma', cuenta: actividades },
    {
      id: 'supuestos',
      titulo: 'Supuestos y éxito',
      cuenta: listas.supuesto.length + listas.criterio_exito.length,
    },
    { id: 'indicadores', titulo: 'Indicadores', cuenta: indicadores.length },
    { id: 'cortes', titulo: 'Cortes', cuenta: cortes },
  ]
}

function NoEncontrado() {
  return (
    <Layout ancho="ficha">
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">No encontramos ese charter</h1>
        <p className="mt-2 mb-5 text-texto-2">Puede que lo hayan eliminado o que no sea tuyo.</p>
        <Link
          to="/"
          className="font-semibold text-institucional underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-acento"
        >
          Volver a mis charters
        </Link>
      </div>
    </Layout>
  )
}

function Hoja({ charter }: { charter: CharterDetalle }) {
  const categorias = useCategorias()
  const areas = useAreas()
  const editar = useEditarCharter(charter.id)
  const cliente = useQueryClient()
  const sesion = useSesion()
  /** Mensaje de la API cuando un guardado chocó con un charter ya cerrado. */
  const [rechazo, setRechazo] = useState<string>()

  const alFallar = useCallback<AlFallar>(
    (error) => {
      if (error.estado === 401) {
        cliente.setQueryData(CLAVE_SESION, null)
        return true
      }
      if (error.estado === 409 && error.codigo === 'charter_cerrado') {
        setRechazo(error.message)
        void cliente.invalidateQueries({ queryKey: CLAVES.charter(charter.id) })
        return true
      }
      return false
    },
    [cliente, charter.id],
  )
  const cola = useColaGuardado(alFallar)
  const { encolar } = cola
  const { mutateAsync } = editar

  const guardar = useCallback(
    <K extends keyof CharterEditar>(campo: K) =>
      (valor: CharterEditar[K]) =>
        encolar(() => mutateAsync({ [campo]: valor } as CharterEditar)),
    [encolar, mutateAsync],
  )
  const cambiarEstado = useCallback(
    (estado: EstadoCharter) => {
      setRechazo(undefined)
      encolar(() => mutateAsync({ estado }))
    },
    [encolar, mutateAsync],
  )
  /**
   * Mensaje que deja otra pantalla al volver (p. ej. «Corte guardado»). Se guarda al montar y se
   * borra del historial, para que no reaparezca al recargar o al volver atrás.
   */
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const [avisoAlVolver] = useState(() => (ubicacion.state as { aviso?: string } | null)?.aviso)
  useEffect(() => {
    if ((ubicacion.state as { aviso?: string } | null)?.aviso)
      void navegar(ubicacion.pathname + ubicacion.search, { replace: true, state: null })
  }, [ubicacion, navegar])
  const borrador = useBorradorCronograma(charter.id, cola.encolar, charter.reglas)
  const vista = useVistaCronograma(charter.id, borrador, charter.reglas)
  const { historica } = vista
  /** Un corte pasado se ve siempre en solo lectura (también mientras se resuelve el pedido). */
  const soloLectura = !charter.permisos.editar || historica !== null || vista.resolviendoCorte
  const esDueno = sesion.data?.id === charter.propietario.id
  const aviso = !esDueno ? (
    <Aviso>Charter de {charter.propietario.nombre} · solo lectura</Aviso>
  ) : charter.permisos.reabrir ? (
    <Aviso tono={rechazo ? 'alerta' : 'info'}>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          {rechazo && <span className="block">{rechazo}</span>}
          Este charter está {charter.estado === 'cancelado' ? 'cancelado' : 'cerrado'}.
        </span>
        <button
          type="button"
          onClick={() => cambiarEstado('activo')}
          className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
        >
          Reabrir
        </button>
      </span>
    </Aviso>
  ) : rechazo ? (
    <Aviso tono="alerta">{rechazo}</Aviso>
  ) : null

  return (
    <ContextoGuardado.Provider value={cola}>
      <Layout
        ancho="ficha"
        arriba={
          <BandaEstado
            nombre={charter.nombre}
            situacion={
              vista.arbol.length > 0
                ? {
                    proyecto: vista.calculo.proyecto,
                    fechaCorte: vista.fechaCorte,
                    historica: historica !== null,
                    lineaBaseModificada: vista.lineaBaseModificada,
                  }
                : undefined
            }
            exportar={<MenuExportar charter={charter} corte={historica?.fecha ?? null} />}
            registrarCorte={soloLectura ? undefined : `/charters/${charter.id}/corte`}
            selectorCorte={
              <SelectorCorte
                cortes={vista.cortes}
                valor={vista.corteElegido}
                alCambiar={vista.elegirCorte}
              />
            }
            acciones={
              esDueno &&
              !historica && (
                <MenuCharter
                  charterId={charter.id}
                  nombre={charter.nombre}
                  estado={charter.estado}
                  cambiarEstado={cambiarEstado}
                />
              )
            }
          />
        }
      >
        <div className="grid gap-8 lg:grid-cols-[216px_minmax(0,1fr)]">
          <IndiceFicha
            secciones={secciones(
              charter,
              borrador.cargando ? undefined : borrador.acts.length,
              vista.cortes.length || undefined,
            )}
          />
          <article className="flex min-w-0 flex-col gap-8 rounded-tarjeta border border-linea bg-superficie px-10 pt-7.5 pb-11 max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0 max-lg:px-4 max-lg:pt-6 max-lg:pb-8 max-sm:gap-9">
            {avisoAlVolver && <Aviso tono="ok">{avisoAlVolver}</Aviso>}
            {vista.avisoCorte && <Aviso>{vista.avisoCorte}</Aviso>}
            {historica && (
              <Aviso tono="info">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Estás viendo el charter como estaba el {fechaCorta(historica.fecha)} (corte{' '}
                    {historica.indice} de {historica.total}). Solo lectura.
                  </span>
                  <button
                    type="button"
                    onClick={() => vista.elegirCorte(null)}
                    className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
                  >
                    Volver al último corte
                  </button>
                </span>
              </Aviso>
            )}
            {aviso}
            <EstadoGuardadoMovil />
            {/* Al pasar a solo lectura o volver, los campos se rehacen desde los datos de la API. */}
            <Fragment key={soloLectura ? 'lectura' : 'edicion'}>
              <SeccionEncabezado
                charter={charter}
                categorias={categorias.data ?? []}
                areas={areas.data ?? []}
                guardar={guardar}
                soloLectura={soloLectura}
              />
              <SeccionRazon
                charter={charter}
                guardar={guardar}
                soloLectura={soloLectura}
                derecha={<SeccionObjetivos charter={charter} soloLectura={soloLectura} />}
              />
              <SeccionCurvaS
                vista={vista}
                cortes={vista.cortes}
                elegirCorte={vista.elegirCorte}
                reglas={charter.reglas}
              />
              <SeccionCronograma
                borrador={vista}
                soloLectura={soloLectura}
                noExistia={historica?.noExistia}
                eliminadas={historica?.eliminadas}
              />
              <SeccionSupuestos charter={charter} soloLectura={soloLectura} />
              <SeccionIndicadores charter={charter} soloLectura={soloLectura} />
              <SeccionHistorial
                charterId={charter.id}
                soloLectura={soloLectura}
                elegido={vista.corteElegido}
                elegirCorte={vista.elegirCorte}
              />
            </Fragment>
          </article>
        </div>
      </Layout>
    </ContextoGuardado.Provider>
  )
}

export function Ficha() {
  const { id = '' } = useParams()
  const charter = useCharter(id)

  if (charter.isPending) return <Cargando />
  if (charter.isError) {
    if (charter.error instanceof ErrorCliente && charter.error.estado === 404)
      return <NoEncontrado />
    return (
      <Layout ancho="ficha">
        <div className="flex flex-col items-start gap-3">
          <Aviso tono="alerta">{charter.error.message}</Aviso>
          <Boton variante="secundario" onClick={() => void charter.refetch()}>
            Reintentar
          </Boton>
        </div>
      </Layout>
    )
  }
  return <Hoja key={id} charter={charter.data} />
}
