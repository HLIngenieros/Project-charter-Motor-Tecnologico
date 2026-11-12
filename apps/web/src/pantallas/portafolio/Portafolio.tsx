import type { AreaPublica, CharterResumen } from '@charter/shared'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useCategorias, useCharters } from '../../api/charters'
import { useSesion } from '../../api/sesion'
import { Layout } from '../../app/Layout'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { hoyISO } from '../../formato'
import { DialogoNuevoCharter } from './DialogoNuevoCharter'
import { columnas, FilaCharter } from './FilaCharter'
import {
  filtrarCharters,
  filtrarParaTablero,
  FILTROS_VACIOS,
  hayFiltros,
  semaforoAUrl,
  semaforoDeUrl,
  type FiltroSemaforo,
  type FiltrosPortafolio as Filtros,
} from './filtrar'
import { FiltrosPortafolio } from './FiltrosPortafolio'
import { Tablero } from './Tablero'
import { calcularTablero, grupoDe, NOMBRE_SEGMENTO, SIN_GRUPO } from './datosTablero'

const PARAMETROS = {
  texto: 'q',
  categoria: 'categoria',
  area: 'area',
  estado: 'estado',
  dueno: 'dueno',
  semaforo: 'sem',
} as const

/** Los filtros viven en la URL: sobreviven a recargar y a volver atrás. */
function useFiltrosEnUrl(): [Filtros, (cambios: Partial<Filtros>) => void, () => void] {
  const [parametros, setParametros] = useSearchParams()
  const filtros: Filtros = {
    texto: parametros.get(PARAMETROS.texto) ?? FILTROS_VACIOS.texto,
    categoria: parametros.get(PARAMETROS.categoria) ?? FILTROS_VACIOS.categoria,
    area: parametros.get(PARAMETROS.area) ?? FILTROS_VACIOS.area,
    estado:
      (parametros.get(PARAMETROS.estado) as Filtros['estado'] | null) ?? FILTROS_VACIOS.estado,
    dueno: parametros.get(PARAMETROS.dueno) ?? FILTROS_VACIOS.dueno,
    semaforo: semaforoDeUrl(parametros.get(PARAMETROS.semaforo)),
  }
  const cambiar = (cambios: Partial<Filtros>) =>
    setParametros(
      (previos) => {
        const nuevos = new URLSearchParams(previos)
        for (const [clave, valor] of Object.entries(cambios) as [
          keyof Filtros,
          Filtros[keyof Filtros],
        ][]) {
          const texto = typeof valor === 'object' && valor ? semaforoAUrl(valor) : valor
          if (!texto || texto === FILTROS_VACIOS[clave]) nuevos.delete(PARAMETROS[clave])
          else nuevos.set(PARAMETROS[clave], texto)
        }
        return nuevos
      },
      { replace: true },
    )
  // Limpiar quita los filtros, no la vista elegida.
  const limpiar = () =>
    setParametros(
      (previos) => {
        const nuevos = new URLSearchParams()
        const ver = previos.get('ver')
        if (ver) nuevos.set('ver', ver)
        return nuevos
      },
      { replace: true },
    )
  return [filtros, cambiar, limpiar]
}

/** `?ver=todos` solo lo atiende el Admin; a los demás se les muestra lo suyo. */
function useVista(esAdmin: boolean): ['mios' | 'todos', (ver: 'mios' | 'todos') => void] {
  const [parametros, setParametros] = useSearchParams()
  const ver = esAdmin && parametros.get('ver') === 'todos' ? 'todos' : 'mios'
  const cambiar = (nueva: 'mios' | 'todos') =>
    setParametros(
      (previos) => {
        const nuevos = new URLSearchParams(previos)
        if (nueva === 'todos') nuevos.set('ver', 'todos')
        else nuevos.delete('ver')
        nuevos.delete(PARAMETROS.dueno)
        return nuevos
      },
      { replace: true },
    )
  return [ver, cambiar]
}

/**
 * Mensaje que deja otra pantalla al llegar (p. ej. «Clave cambiada»). Se guarda al montar y
 * se borra del historial, para que no reaparezca al recargar o al volver atrás.
 */
function useAvisoAlVolver(): string | undefined {
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const [aviso] = useState(() => (ubicacion.state as { aviso?: string } | null)?.aviso)
  useEffect(() => {
    if ((ubicacion.state as { aviso?: string } | null)?.aviso)
      void navegar(ubicacion.pathname + ubicacion.search, { replace: true, state: null })
  }, [ubicacion, navegar])
  return aviso
}

function areasUsadas(lista: CharterResumen[]): AreaPublica[] {
  const porId = new Map<string, AreaPublica>()
  for (const c of lista) if (c.area) porId.set(c.area.id, c.area)
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function duenosDe(lista: CharterResumen[]): { id: string; nombre: string }[] {
  const porId = new Map<string, { id: string; nombre: string }>()
  for (const c of lista) porId.set(c.propietario.id, c.propietario)
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

/** «Financiera · rojo»: el nombre del grupo sale de la lista (o «Sin área»). */
function textoSemaforo(s: FiltroSemaforo, lista: CharterResumen[]): string {
  const nombre =
    s.grupo === 'ninguna'
      ? SIN_GRUPO[s.eje]
      : (lista.map((c) => grupoDe(c, s.eje)).find((g) => g.id === s.grupo)?.nombre ?? '…')
  return `${nombre} · ${NOMBRE_SEGMENTO[s.segmento]}`
}

/** Selector «Mis charters / Todos» del Admin. */
function SelectorVista({
  ver,
  cambiar,
}: {
  ver: 'mios' | 'todos'
  cambiar: (ver: 'mios' | 'todos') => void
}) {
  const opciones = [
    { valor: 'mios', texto: 'Mis charters' },
    { valor: 'todos', texto: 'Todos' },
  ] as const
  return (
    <div
      role="radiogroup"
      aria-label="Ver"
      className="inline-flex rounded-control border border-linea bg-fondo p-0.5"
    >
      {opciones.map((o) => (
        <label
          key={o.valor}
          className={[
            'relative cursor-pointer rounded-[6px] px-3 py-1.5 text-[0.84375rem] font-semibold transition-colors duration-150',
            'has-focus-visible:outline-2 has-focus-visible:outline-acento',
            ver === o.valor
              ? 'bg-superficie text-tinta shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
              : 'text-texto-2 hover:text-tinta',
          ].join(' ')}
        >
          <input
            type="radio"
            name="ver"
            value={o.valor}
            checked={ver === o.valor}
            onChange={() => cambiar(o.valor)}
            className="sr-only"
          />
          {o.texto}
        </label>
      ))}
    </div>
  )
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
  const esAdmin = useSesion().data?.esAdmin ?? false
  const [ver, cambiarVista] = useVista(esAdmin)
  const todos = ver === 'todos'
  const charters = useCharters(ver)
  const avisoAlVolver = useAvisoAlVolver()
  const categorias = useCategorias()
  const [enUrl, cambiar, limpiar] = useFiltrosEnUrl()
  // Fuera de «Todos» no hay filtro Dueño: uno que quede en la URL no debe esconder filas.
  const filtros: Filtros = todos ? enUrl : { ...enUrl, dueno: 'todos' }
  const [creando, setCreando] = useState(false)

  const lista = useMemo(() => charters.data ?? [], [charters.data])
  const visibles = filtrarCharters(lista, filtros)
  const tablero = calcularTablero(filtrarParaTablero(lista, filtros), hoyISO())
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
        <Tablero
          datos={tablero}
          semaforo={filtros.semaforo}
          alPulsar={(semaforo) => cambiar({ semaforo })}
        />
        <FiltrosPortafolio
          filtros={filtros}
          cambiar={cambiar}
          categorias={categorias.data ?? []}
          areas={areasUsadas(lista)}
          duenos={todos ? duenosDe(lista) : undefined}
          cuenta={`${visibles.length} de ${lista.length} charters`}
        >
          {filtros.semaforo && (
            <button
              type="button"
              onClick={() => cambiar({ semaforo: null })}
              aria-label={`Quitar filtro ${textoSemaforo(filtros.semaforo, lista)}`}
              className={[
                'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-acento/40 bg-acento/10 px-3',
                'text-[0.8125rem] font-semibold text-tinta transition-colors duration-150 hover:bg-acento/20',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento',
              ].join(' ')}
            >
              {textoSemaforo(filtros.semaforo, lista)}
              <span aria-hidden className="text-base leading-none text-texto-2">
                ×
              </span>
            </button>
          )}
        </FiltrosPortafolio>
        <div className="overflow-hidden rounded-tarjeta border border-linea bg-superficie">
          <div
            aria-hidden
            className={`hidden bg-fondo px-5 py-2.5 text-xs font-semibold text-texto-2 md:grid md:gap-5 ${columnas(todos)}`}
          >
            <div>Charter</div>
            {todos && <div className="hidden lg:block">Dueño</div>}
            <div>Avance</div>
            <div className="hidden lg:block">Curva S</div>
            <div>Estado</div>
            <div>Último corte</div>
          </div>
          {visibles.length > 0 ? (
            visibles.map((c, i) => (
              <FilaCharter key={c.id} charter={c} indice={i} conDueno={todos} />
            ))
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
      {avisoAlVolver && (
        <Aviso tono="ok" className="mb-6">
          {avisoAlVolver}
        </Aviso>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-[1.75rem] font-semibold max-md:text-2xl">
              {todos ? 'Todos los charters' : 'Mis charters'}
            </h1>
            {esAdmin && <SelectorVista ver={ver} cambiar={cambiarVista} />}
          </div>
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
