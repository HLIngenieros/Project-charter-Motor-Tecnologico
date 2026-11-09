import type { CharterDetalle, CharterEditar } from '@charter/shared'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { useAreas, useCategorias, useCharter, useEditarCharter } from '../../api/charters'
import { ErrorCliente } from '../../api/cliente'
import { Layout } from '../../app/Layout'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { BandaEstado } from './BandaEstado'
import { ContextoGuardado, useColaGuardado } from './colaGuardado'
import { EstadoGuardadoMovil, IndiceFicha, type SeccionIndice } from './IndiceFicha'
import { SeccionEncabezado } from './SeccionEncabezado'
import { SeccionRazon } from './SeccionRazon'

/** Solo las secciones ya construidas; las de fases siguientes se suman aquí. */
const SECCIONES: SeccionIndice[] = [
  { id: 'encabezado', titulo: 'Encabezado' },
  { id: 'razon', titulo: 'Razón de ser' },
]

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
  const cola = useColaGuardado()
  const { encolar } = cola
  const { mutateAsync } = editar

  const guardar = useCallback(
    <K extends keyof CharterEditar>(campo: K) =>
      (valor: CharterEditar[K]) =>
        encolar(() => mutateAsync({ [campo]: valor } as CharterEditar)),
    [encolar, mutateAsync],
  )
  const soloLectura = !charter.permisos.editar

  return (
    <ContextoGuardado.Provider value={cola}>
      <Layout ancho="ficha" arriba={<BandaEstado nombre={charter.nombre} />}>
        <div className="grid gap-8 lg:grid-cols-[216px_minmax(0,1fr)]">
          <IndiceFicha secciones={SECCIONES} />
          <article className="flex min-w-0 flex-col gap-8 rounded-tarjeta border border-linea bg-superficie px-10 pt-7.5 pb-11 max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0 max-lg:px-4 max-lg:pt-6 max-lg:pb-8 max-sm:gap-9">
            <EstadoGuardadoMovil />
            <SeccionEncabezado
              charter={charter}
              categorias={categorias.data ?? []}
              areas={areas.data ?? []}
              guardar={guardar}
              soloLectura={soloLectura}
            />
            <SeccionRazon charter={charter} guardar={guardar} soloLectura={soloLectura} />
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
