import { PALETA_CATEGORIAS, type CategoriaAdmin } from '@charter/shared'
import { useId, useState, type FormEvent } from 'react'
import {
  useCatalogoAdmin,
  useCrearCatalogo,
  useEditarCatalogo,
  useEliminarCatalogo,
  type CambiosCatalogo,
  type FilaCatalogo,
  type TipoCatalogo,
} from '../../api/admin'
import { ErrorCliente } from '../../api/cliente'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Campo } from '../../componentes/Campo'
import { Cargando } from '../../componentes/Cargando'
import { Chip } from '../../componentes/Chip'
import { Dialogo } from '../../componentes/Dialogo'
import { MenuAcciones, type Accion } from '../../componentes/MenuAcciones'
import { separarError } from '../errores'

/** Nombre de cada par de la paleta, en el mismo orden (para lectores de pantalla). */
const NOMBRES_COLOR = [
  'Gris',
  'Ámbar',
  'Violeta',
  'Turquesa',
  'Verde',
  'Frambuesa',
  'Azul',
  'Terracota',
]

const TEXTOS: Record<TipoCatalogo, { titulo: string; nueva: string; vacio: string }> = {
  categorias: { titulo: 'Categorías', nueva: 'Nueva categoría', vacio: 'No hay categorías.' },
  areas: { titulo: 'Áreas', nueva: 'Nueva área', vacio: 'Aún no hay áreas. Agrega la primera.' },
}

const mensajeDe = (error: unknown) =>
  error instanceof ErrorCliente ? error.message : 'Algo falló. Intenta de nuevo.'

const esCategoria = (f: FilaCatalogo<TipoCatalogo>): f is CategoriaAdmin => 'color' in f

function Flecha({ arriba }: { arriba: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={arriba ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  )
}

const BOTON_ICONO =
  'flex size-8 items-center justify-center rounded-control text-texto-2 transition-colors hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento disabled:pointer-events-none disabled:opacity-35'

/** Nombre editable en su sitio: guarda al salir; si la API lo rechaza, vuelve al anterior. */
function NombreEditable({
  valor,
  etiqueta,
  guardar,
}: {
  valor: string
  etiqueta: string
  guardar: (nombre: string) => Promise<void>
}) {
  const [base, setBase] = useState(valor)
  const [texto, setTexto] = useState(valor)
  const [error, setError] = useState<string>()
  // Adopta el valor de la API cuando cambia (p. ej. tras guardar o refrescar).
  if (valor !== base) {
    setBase(valor)
    setTexto(valor)
  }
  const idError = useId()

  const salir = async () => {
    const limpio = texto.trim()
    if (limpio === valor) {
      setTexto(valor)
      return
    }
    if (!limpio) {
      setTexto(valor)
      setError('Escribe el nombre')
      return
    }
    try {
      setError(undefined)
      await guardar(limpio)
    } catch (e) {
      const r = separarError(e)
      setTexto(valor)
      setError(r.campos.nombre ?? r.general)
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <input
        type="text"
        aria-label={etiqueta}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        value={texto}
        maxLength={80}
        onChange={(e) => {
          setTexto(e.target.value)
          setError(undefined)
        }}
        onBlur={() => void salir()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setTexto(valor)
            setError(undefined)
          }
        }}
        className="min-h-9 w-full rounded-control border border-transparent bg-transparent px-2 text-[0.9375rem] font-semibold text-tinta transition-[border-color,box-shadow] duration-150 hover:border-linea focus:border-acento focus:bg-superficie focus:shadow-foco focus:outline-none"
      />
      {error && (
        <p id={idError} className="px-2 pt-1 text-sm font-medium text-alerta-texto">
          {error}
        </p>
      )}
    </div>
  )
}

/** Diálogo con la paleta fija como grupo de opciones. */
function DialogoColor({
  categoria,
  alCerrar,
  elegir,
}: {
  categoria: CategoriaAdmin | null
  alCerrar: () => void
  elegir: (color: string) => void
}) {
  const titulo = categoria ? `Color de ${categoria.nombre}` : ''
  return (
    <Dialogo abierto={categoria !== null} alCerrar={alCerrar} titulo={titulo}>
      <div role="radiogroup" aria-label={titulo} className="grid grid-cols-4 gap-3">
        {PALETA_CATEGORIAS.map((p, i) => (
          <label
            key={p.color}
            className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-control p-2 text-xs text-texto-2 has-[:checked]:text-tinta has-[:focus-visible]:shadow-foco"
          >
            <input
              type="radio"
              name="color-categoria"
              value={p.color}
              aria-label={NOMBRES_COLOR[i]}
              checked={categoria?.color === p.color}
              onChange={() => elegir(p.color)}
              className="sr-only"
            />
            <span
              aria-hidden
              className="flex h-9 w-full items-center justify-center rounded-full border-2 border-transparent group-has-[:checked]:border-tinta"
              style={{ backgroundColor: p.colorFondo }}
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
            </span>
            {NOMBRES_COLOR[i]}
          </label>
        ))}
      </div>
    </Dialogo>
  )
}

function BloqueCatalogo<T extends TipoCatalogo>({ tipo }: { tipo: T }) {
  const textos = TEXTOS[tipo]
  const idTitulo = useId()
  const lista = useCatalogoAdmin(tipo)
  const crear = useCrearCatalogo(tipo)
  const editar = useEditarCatalogo(tipo)
  const eliminar = useEliminarCatalogo(tipo)
  const [nuevo, setNuevo] = useState('')
  const [errorNuevo, setErrorNuevo] = useState<string>()
  const [error, setError] = useState<string>()
  const [color, setColor] = useState<CategoriaAdmin | null>(null)
  const [borrando, setBorrando] = useState<FilaCatalogo<T> | null>(null)

  const filas = lista.data ?? []

  const cambiar = async (id: string, cambios: CambiosCatalogo) => {
    setError(undefined)
    await editar.mutateAsync({ id, cambios })
  }
  const cambiarConAviso = (id: string, cambios: CambiosCatalogo) =>
    cambiar(id, cambios).catch((e: unknown) => setError(mensajeDe(e)))

  /** Intercambia el orden con la fila vecina (`paso` −1 sube, +1 baja). */
  const mover = (i: number, paso: -1 | 1) => {
    const a = filas[i]
    const b = filas[i + paso]
    if (!a || !b) return
    const ordenA = b.orden === a.orden ? a.orden + paso : b.orden
    void Promise.all([cambiar(a.id, { orden: ordenA }), cambiar(b.id, { orden: a.orden })]).catch(
      (e: unknown) => setError(mensajeDe(e)),
    )
  }

  const agregar = (e: FormEvent) => {
    e.preventDefault()
    const nombre = nuevo.trim()
    if (!nombre) {
      setErrorNuevo('Escribe el nombre')
      return
    }
    const usados = new Set(filas.filter(esCategoria).map((c) => c.color))
    const libre = PALETA_CATEGORIAS.find((p) => !usados.has(p.color)) ?? PALETA_CATEGORIAS[0]!
    crear.mutate(tipo === 'categorias' ? { nombre, color: libre.color } : { nombre }, {
      onSuccess: () => {
        setNuevo('')
        setErrorNuevo(undefined)
      },
      onError: (err) => {
        const r = separarError(err)
        setErrorNuevo(r.campos.nombre ?? r.general)
      },
    })
  }

  const acciones = (f: FilaCatalogo<T>): Accion[] => {
    if (esCategoria(f) && f.protegida) return []
    const lista: Accion[] = [
      f.activa
        ? { etiqueta: 'Desactivar', alElegir: () => void cambiarConAviso(f.id, { activa: false }) }
        : { etiqueta: 'Reactivar', alElegir: () => void cambiarConAviso(f.id, { activa: true }) },
    ]
    if (f.charters === 0)
      lista.push({
        etiqueta: 'Eliminar',
        peligro: true,
        alElegir: () => {
          eliminar.reset()
          setBorrando(f)
        },
      })
    return lista
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className="rounded-tarjeta border border-linea bg-superficie"
    >
      <h2 id={idTitulo} className="border-b border-linea px-5 py-3.5 text-lg font-semibold">
        {textos.titulo}
      </h2>
      {error && (
        <Aviso tono="alerta" className="mx-5 mt-4">
          {error}
        </Aviso>
      )}
      {lista.isPending ? (
        <Cargando pantalla={false} />
      ) : lista.isError ? (
        <Aviso tono="alerta" className="m-5">
          {mensajeDe(lista.error)}
        </Aviso>
      ) : filas.length === 0 ? (
        <p className="px-5 py-6 text-texto-2">{textos.vacio}</p>
      ) : (
        <ul>
          {filas.map((f, i) => (
            <li
              key={f.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-linea-2 px-3 py-2 last:border-0 sm:flex-nowrap sm:px-4 ${f.activa ? '' : 'bg-fondo/50'}`}
            >
              <div className="flex shrink-0">
                <button
                  type="button"
                  aria-label={`Subir ${f.nombre}`}
                  disabled={i === 0}
                  onClick={() => mover(i, -1)}
                  className={BOTON_ICONO}
                >
                  <Flecha arriba />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${f.nombre}`}
                  disabled={i === filas.length - 1}
                  onClick={() => mover(i, 1)}
                  className={BOTON_ICONO}
                >
                  <Flecha arriba={false} />
                </button>
              </div>
              {esCategoria(f) && (
                <button
                  type="button"
                  aria-label={`Color de ${f.nombre}`}
                  onClick={() => setColor(f)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full transition-shadow hover:shadow-[0_0_0_2px_var(--color-linea)] focus-visible:shadow-foco focus-visible:outline-none"
                  style={{ backgroundColor: f.colorFondo }}
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                </button>
              )}
              <NombreEditable
                valor={f.nombre}
                etiqueta={`Nombre de ${f.nombre}`}
                guardar={(nombre) => cambiar(f.id, { nombre })}
              />
              <div className="ml-auto flex shrink-0 items-center gap-3 max-sm:w-full max-sm:justify-end">
                {esCategoria(f) && f.protegida && (
                  <span className="text-xs text-texto-2">Por defecto</span>
                )}
                <span className="cifra text-sm whitespace-nowrap text-texto-2">
                  {f.charters} {f.charters === 1 ? 'charter' : 'charters'}
                </span>
                <Chip tono={f.activa ? 'al_dia' : 'neutro'}>
                  {f.activa ? 'Activa' : 'Inactiva'}
                </Chip>
                <div className="w-9">
                  <MenuAcciones etiqueta={`Acciones de ${f.nombre}`} acciones={acciones(f)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        noValidate
        onSubmit={agregar}
        className="flex items-start gap-2 border-t border-linea px-5 py-4"
      >
        <Campo
          etiqueta={textos.nueva}
          value={nuevo}
          maxLength={80}
          onChange={(e) => {
            setNuevo(e.target.value)
            setErrorNuevo(undefined)
          }}
          error={errorNuevo}
          className="flex-1"
        />
        <Boton
          type="submit"
          variante="secundario"
          cargando={crear.isPending}
          className="mt-[1.75rem]"
        >
          Agregar
        </Boton>
      </form>

      <DialogoColor
        categoria={color}
        alCerrar={() => setColor(null)}
        elegir={(nuevoColor) => {
          const id = color?.id
          setColor(null)
          if (id) void cambiarConAviso(id, { color: nuevoColor })
        }}
      />
      <Dialogo
        abierto={borrando !== null}
        alCerrar={() => setBorrando(null)}
        titulo={`Eliminar «${borrando?.nombre ?? ''}»`}
      >
        <p className="text-[0.9375rem] text-texto">Ningún charter la usa. No se puede deshacer.</p>
        {eliminar.error && (
          <Aviso tono="alerta" className="mt-4">
            {mensajeDe(eliminar.error)}
          </Aviso>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setBorrando(null)}>
            Volver
          </Boton>
          <Boton
            variante="peligro"
            cargando={eliminar.isPending}
            onClick={() => {
              if (borrando) eliminar.mutate(borrando.id, { onSuccess: () => setBorrando(null) })
            }}
          >
            Eliminar
          </Boton>
        </div>
      </Dialogo>
    </section>
  )
}

/** Admin › Catálogos: categorías (con color de la paleta) y áreas. */
export function Catalogos() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <BloqueCatalogo tipo="categorias" />
      <BloqueCatalogo tipo="areas" />
    </div>
  )
}
