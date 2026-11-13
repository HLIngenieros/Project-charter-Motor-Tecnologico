import type { AreaPublica, CategoriaPublica, CharterDetalle, CharterEditar } from '@charter/shared'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FLECHA } from '../../componentes/Selector'
import { TextoEditable } from '../../componentes/TextoEditable'
import { fechaCorta } from '../../formato'

type Guardar = <K extends keyof CharterEditar>(campo: K) => (valor: CharterEditar[K]) => void

interface Opcion {
  id: string
  nombre: string
  activa: boolean
}

/** Activas más la actual; la actual se rotula «(inactiva)» si lo está. */
export function opcionesCatalogo<T extends Opcion>(catalogo: T[], actual: string | null): T[] {
  return catalogo.filter((o) => o.activa || o.id === actual)
}

/**
 * `select` que parece texto. Muestra al instante lo elegido y no lo pisa una respuesta vieja
 * mientras su propio envío va en camino.
 */
function SelectorEnLinea({
  etiqueta,
  valor,
  opciones,
  vacio,
  alGuardar,
  soloLectura,
  className = '',
}: {
  etiqueta: string
  valor: string | null
  opciones: Opcion[]
  vacio: string
  alGuardar: (v: string | null) => void
  soloLectura: boolean
  className?: string
}) {
  const [elegido, setElegido] = useState(valor ?? '')
  const enviado = useRef<string | null>(null)
  useEffect(() => {
    const v = valor ?? ''
    if (enviado.current !== null && v !== enviado.current) return
    enviado.current = null
    setElegido(v)
  }, [valor])

  const actual = opciones.find((o) => o.id === elegido)
  const rotulo = (o: Opcion) => (o.activa ? o.nombre : `${o.nombre} (inactiva)`)
  if (soloLectura) return <span className={className}>{actual ? rotulo(actual) : vacio}</span>

  return (
    <select
      aria-label={etiqueta}
      value={elegido}
      style={{ backgroundImage: FLECHA }}
      onChange={(e) => {
        const v = e.target.value
        setElegido(v)
        enviado.current = v
        alGuardar(v || null)
      }}
      className={[
        '-mx-1 max-w-full cursor-pointer appearance-none truncate rounded-[6px] bg-transparent px-1 py-px pr-5',
        'bg-[length:12px] bg-[position:right_2px_center] bg-no-repeat',
        'transition-[background-color,box-shadow] duration-150',
        'hover:bg-[#f4f7fa] hover:shadow-[inset_0_-1px_0_#c3cfdd]',
        'focus:bg-superficie focus:shadow-[0_0_0_2px_var(--color-acento)] focus:outline-none',
        className,
      ].join(' ')}
    >
      <option value="">{vacio}</option>
      {opciones.map((o) => (
        <option key={o.id} value={o.id}>
          {rotulo(o)}
        </option>
      ))}
    </select>
  )
}

function Celda({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-superficie px-3.5 py-2.5">
      <span aria-hidden className="block text-xs text-texto-2">
        {titulo}
      </span>
      <div className="text-sm font-semibold text-tinta">{children}</div>
    </div>
  )
}

export function SeccionEncabezado({
  charter: c,
  categorias,
  areas,
  guardar,
  soloLectura,
}: {
  charter: CharterDetalle
  categorias: CategoriaPublica[]
  areas: AreaPublica[]
  guardar: Guardar
  soloLectura: boolean
}) {
  const verArea = areas.length > 0 || c.areaId !== null

  return (
    <section id="encabezado" aria-label="Encabezado" className="scroll-mt-28">
      <h1 className="sr-only">{c.nombre}</h1>
      <TextoEditable
        etiqueta="Nombre del charter"
        valor={c.nombre}
        alGuardar={guardar('nombre')}
        requerido="Escribe el nombre del charter"
        maximo={200}
        multilinea
        como="titulo"
        soloLectura={soloLectura}
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-texto-2">
        <TextoEditable
          etiqueta="Código"
          valor={c.codigo ?? ''}
          alGuardar={guardar('codigo')}
          placeholder="Agregar código"
          maximo={20}
          soloLectura={soloLectura}
          className="font-cifra text-[0.8125rem] [&_input]:w-[16ch] [&_input]:text-[0.8125rem] [&_input]:text-texto-2"
        />
        {verArea && (
          <>
            <span aria-hidden>·</span>
            <SelectorEnLinea
              etiqueta="Área"
              valor={c.areaId}
              opciones={opcionesCatalogo(areas, c.areaId)}
              vacio="Sin área"
              alGuardar={guardar('areaId')}
              soloLectura={soloLectura}
            />
          </>
        )}
        <span aria-hidden>·</span>
        <span>creado el {fechaCorta(c.creadoEn)}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-linea bg-linea md:grid-cols-4">
        <Celda titulo="Responsable">
          <TextoEditable
            etiqueta="Responsable"
            valor={c.responsable}
            alGuardar={guardar('responsable')}
            placeholder="¿Quién lo lidera?"
            maximo={120}
            soloLectura={soloLectura}
            como="dato"
          />
        </Celda>
        <Celda titulo="Patrocinador">
          <TextoEditable
            etiqueta="Patrocinador"
            valor={c.patrocinador}
            alGuardar={guardar('patrocinador')}
            placeholder="¿Quién lo respalda?"
            maximo={120}
            soloLectura={soloLectura}
            como="dato"
          />
        </Celda>
        <Celda titulo="Categoría">
          <SelectorEnLinea
            etiqueta="Categoría"
            valor={c.categoriaId}
            opciones={opcionesCatalogo(categorias, c.categoriaId)}
            vacio="Sin categoría"
            alGuardar={guardar('categoriaId')}
            soloLectura={soloLectura}
          />
        </Celda>
        <Celda titulo="Revisión">
          <TextoEditable
            etiqueta="Revisión"
            valor={c.revision}
            alGuardar={guardar('revision')}
            placeholder="Ej.: B"
            maximo={120}
            soloLectura={soloLectura}
            como="dato"
          />
        </Celda>
      </div>
    </section>
  )
}
