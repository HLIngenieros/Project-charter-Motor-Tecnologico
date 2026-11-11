import type { AreaPublica, CharterResumen } from '@charter/shared'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCategorias, useCharters } from '../../api/charters'
import { useSesion } from '../../api/sesion'
import { Layout } from '../../app/Layout'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { DialogoNuevoCharter } from './DialogoNuevoCharter'
import { COLUMNAS, FilaCharter } from './FilaCharter'
import {
  filtrarCharters,
  FILTROS_VACIOS,
  hayFiltros,
  type FiltrosPortafolio as Filtros,
} from './filtrar'
import { FiltrosPortafolio } from './FiltrosPortafolio'

const PARAMETROS = { texto: 'q', categoria: 'categoria', area: 'area', estado: 'estado' } as const

/** Los filtros viven en la URL: sobreviven a recargar y a volver atrás. */
function useFiltrosEnUrl(): [Filtros, (cambios: Partial<Filtros>) => void, () => void] {
  const [parametros, setParametros] = useSearchParams()
  const filtros: Filtros = {
    texto: parametros.get(PARAMETROS.texto) ?? FILTROS_VACIOS.texto,
    categoria: parametros.get(PARAMETROS.categoria) ?? FILTROS_VACIOS.categoria,
    area: parametros.get(PARAMETROS.area) ?? FILTROS_VACIOS.area,
    estado:
      (parametros.get(PARAMETROS.estado) as Filtros['estado'] | null) ?? FILTROS_VACIOS.estado,
  }
  const cambiar = (cambios: Partial<Filtros>) =>
    setParametros(
      (previos) => {
        const nuevos = new URLSearchParams(previos)
        for (const [clave, valor] of Object.entries(cambios) as [keyof Filtros, string][]) {
          if (valor === FILTROS_VACIOS[clave] || valor === '') nuevos.delete(PARAMETROS[clave])
          else nuevos.set(PARAMETROS[clave], valor)
        }
        return nuevos
      },
      { replace: true },
    )
  const limpiar = () => setParametros(new URLSearchParams(), { replace: true })
  return [filtros, cambiar, limpiar]
}

function areasUsadas(lista: CharterResumen[]): AreaPublica[] {
  const porId = new Map<string, AreaPublica>()
  for (const c of lista) if (c.area) porId.set(c.area.id, c.area)
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function IconoMas() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      className="size-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/** Ilustración del estado vacío: una curva S planeada y el primer tramo real. */
function CurvaVacia() {
  return (
    <svg aria-hidden viewBox="0 0 120 72" fill="none" className="mx-auto mb-4.5 h-18 w-30">
      <rect x="1" y="1" width="118" height="70" rx="8" stroke="#DCE3EC" strokeWidth="2" />
      <path
        d="M14 54 C40 52 52 40 64 30 S92 14 106 12"
        stroke="#003366"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M14 54 C26 53 34 50 42 46" stroke="#00A9E0" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="10" x2="42" y2="62" stroke="#00A9E0" strokeDasharray="3 3" />
    </svg>
  )
}

export function Portafolio() {
  const { data: usuario } = useSesion()
  const charters = useCharters()
  const categorias = useCategorias()
  const [filtros, cambiar, limpiar] = useFiltrosEnUrl()
  const [creando, setCreando] = useState(false)

  const lista = useMemo(() => charters.data ?? [], [charters.data])
  const visibles = useMemo(() => filtrarCharters(lista, filtros), [lista, filtros])
  const activas = (categorias.data ?? []).filter((c) => c.activa)
  const nuevo = (
    <Boton onClick={() => setCreando(true)} className="max-md:w-full">
      <IconoMas />
      Nuevo charter
    </Boton>
  )

  let contenido
  if (charters.isPending) contenido = <Cargando pantalla={false} />
  else if (charters.isError)
    contenido = (
      <div className="flex flex-col items-start gap-3">
        <Aviso tono="alerta">{charters.error.message}</Aviso>
        <Boton variante="secundario" onClick={() => void charters.refetch()}>
          Reintentar
        </Boton>
      </div>
    )
  else if (lista.length === 0)
    contenido = (
      <div className="rounded-tarjeta border border-linea bg-superficie px-6 pt-16 pb-18 text-center">
        <CurvaVacia />
        <h2 className="text-xl font-semibold">Aún no tienes charters</h2>
        <p className="mx-auto mt-2 mb-5 max-w-[52ch] text-texto-2">
          Un charter reúne la razón de ser, los objetivos y el cronograma de un proyecto. Crea el
          primero con su nombre; lo demás lo completas en la ficha.
        </p>
        {nuevo}
      </div>
    )
  else
    contenido = (
      <>
        <FiltrosPortafolio
          filtros={filtros}
          cambiar={cambiar}
          categorias={categorias.data ?? []}
          areas={areasUsadas(lista)}
          cuenta={`${visibles.length} de ${lista.length} charters`}
        />
        <div className="overflow-hidden rounded-tarjeta border border-linea bg-superficie">
          <div
            aria-hidden
            className={`hidden bg-fondo px-5 py-2.5 text-xs font-semibold text-texto-2 md:grid md:gap-5 ${COLUMNAS}`}
          >
            <div>Charter</div>
            <div>Avance</div>
            <div className="hidden lg:block">Curva S</div>
            <div>Estado</div>
            <div>Último corte</div>
          </div>
          {visibles.length > 0 ? (
            visibles.map((c, i) => <FilaCharter key={c.id} charter={c} indice={i} />)
          ) : (
            <div className="px-6 py-10 text-center">
              <h2 className="text-xl font-semibold">Ningún charter coincide</h2>
              <p className="mt-2 mb-4 text-texto-2">Prueba con otro nombre o quita los filtros.</p>
              {hayFiltros(filtros) && (
                <Boton variante="secundario" onClick={limpiar}>
                  Limpiar filtros
                </Boton>
              )}
            </div>
          )}
        </div>
      </>
    )

  return (
    <Layout ancho="portafolio">
      {usuario?.debeCambiarClave && (
        <Aviso tono="alerta" className="mb-6">
          Debes cambiar tu clave antes de seguir. La opción llega con la pantalla de cuenta.
        </Aviso>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold max-md:text-2xl">Mis charters</h1>
          <p className="mt-1 text-texto-2">Avance al último corte de cada uno.</p>
        </div>
        {lista.length > 0 && <div className="ml-auto max-md:ml-0 max-md:w-full">{nuevo}</div>}
      </div>
      <div className={lista.length === 0 ? 'mt-6' : undefined}>{contenido}</div>
      <DialogoNuevoCharter
        abierto={creando}
        alCerrar={() => setCreando(false)}
        categorias={activas}
      />
    </Layout>
  )
}
