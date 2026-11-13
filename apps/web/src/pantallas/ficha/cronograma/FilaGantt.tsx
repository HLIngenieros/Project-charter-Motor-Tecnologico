import type { Aviso, FechaISO, NodoArbol, ResultadoNodo } from '@charter/shared'
import { memo, type KeyboardEvent } from 'react'
import { Chip } from '../../../componentes/Chip'
import { porcentaje } from '../../../formato'
import type { Rango } from './escala'
import { chipDe } from './estados'
import { PistaGantt, type Extremo } from './PistaGantt'

/** Rejilla compartida por la cabecera y las filas. */
export const COLUMNAS =
  'grid grid-cols-[minmax(0,1fr)_minmax(140px,1.2fr)] md:grid-cols-[60px_minmax(200px,1fr)_64px_132px_minmax(300px,1.35fr)]'

const FONDO_FILA: Partial<Record<string, string>> = {
  vencida: 'bg-vencida-suave/50',
  en_atencion: 'bg-amarillo-suave/50',
  en_riesgo: 'bg-naranja-suave/50',
  atrasada: 'bg-alerta-suave/50',
}

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/** Peso efectivo de una hoja sin peso propio, repartido por la regla del charter. */
export function PesoAuto({ peso }: { peso: number }) {
  return (
    <span title="Peso repartido automáticamente" className="text-texto-2">
      {porcentaje(peso)}{' '}
      <span className="font-sans text-[0.6875rem] font-semibold tracking-wide text-texto-3 uppercase">
        auto
      </span>
    </span>
  )
}

interface PropsFila {
  nodo: NodoArbol
  resultado: ResultadoNodo | undefined
  avisos: Aviso[]
  abierta: boolean
  plegada: boolean
  destello: boolean
  /** Vista histórica: la hoja se creó después del corte. */
  noExistia?: boolean
  rango: Rango
  fechaCorte: FechaISO
  marcas: { fecha: FechaISO }[]
  soloLectura: boolean
  /** Callbacks estables: reciben el id para que `memo` no re-renderice las demás filas. */
  alAbrir(id: string): void
  alPlegar(id: string): void
  alTecla(id: string, e: KeyboardEvent<HTMLButtonElement>): void
  alMover(id: string, dias: number, extremo: Extremo): void
}

/** Igualdad superficial; los arreglos se comparan por contenido y los hijos del nodo no cuentan. */
function mismos(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const x = a as Record<string, unknown>
  const y = b as Record<string, unknown>
  const claves = Object.keys(x)
  if (claves.length !== Object.keys(y).length) return false
  return claves.every((k) => {
    if (k === 'hijos') return true
    const u = x[k]
    const v = y[k]
    if (Array.isArray(u) && Array.isArray(v)) return u.join('\u0000') === v.join('\u0000')
    return u === v
  })
}

function filaIgual(a: PropsFila, b: PropsFila): boolean {
  return (Object.keys(a) as (keyof PropsFila)[]).every((k) => {
    if (k === 'nodo' || k === 'resultado') return mismos(a[k], b[k])
    if (k === 'avisos')
      return a.avisos.map((x) => x.mensaje).join() === b.avisos.map((x) => x.mensaje).join()
    return a[k] === b[k]
  })
}

/** Una fila del Gantt. Con `memo`: al arrastrar una barra solo cambian esa fila y sus agrupadoras. */
export const FilaGantt = memo(function FilaGantt({
  nodo,
  resultado,
  avisos,
  abierta,
  plegada,
  destello,
  noExistia = false,
  rango,
  fechaCorte,
  marcas,
  soloLectura,
  alAbrir,
  alPlegar,
  alTecla,
  alMover,
}: PropsFila) {
  const chip = resultado ? chipDe(resultado, nodo.esHoja) : null
  const tonoFila = nodo.esHoja ? resultado?.estado : resultado?.vencidas ? 'vencida' : undefined
  const auto = nodo.esHoja && !!resultado?.pesoAuto
  const peso = nodo.esHoja && !auto ? nodo.peso : resultado?.peso
  const aviso = avisos.map((a) => a.mensaje).join(' ')

  return (
    <div
      data-fila={nodo.id}
      className={[
        COLUMNAS,
        'min-h-9 items-center border-t border-linea-2 text-[0.8125rem] transition-colors duration-200',
        nodo.esHoja ? 'text-texto' : 'font-semibold text-tinta',
        (tonoFila && FONDO_FILA[tonoFila]) || '',
        abierta ? 'shadow-[inset_0_0_0_2px_var(--color-acento)]' : '',
        destello ? 'animate-destello' : '',
        noExistia ? 'opacity-55' : '',
      ].join(' ')}
    >
      <div className="px-2.5 font-mono text-xs text-texto-2 max-md:hidden">
        <span className={nodo.esHoja ? '' : 'font-semibold text-tinta'}>{nodo.item}</span>
      </div>
      <div
        className="flex min-w-0 items-center gap-1.5 pr-2.5"
        style={{ paddingLeft: 10 + (nodo.nivel - 1) * 16 }}
      >
        {nodo.esHoja ? (
          <span className="w-[22px] flex-none" />
        ) : (
          <button
            type="button"
            aria-expanded={!plegada}
            aria-label={`${plegada ? 'Desplegar' : 'Plegar'} ${nodo.nombre || nodo.item}`}
            onClick={() => alPlegar(nodo.id)}
            className={`grid size-[22px] flex-none place-items-center rounded-[5px] text-texto-2 transition-transform hover:bg-fondo hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento ${plegada ? '-rotate-90' : ''}`}
          >
            <Chevron />
          </button>
        )}
        <button
          type="button"
          aria-expanded={abierta}
          onClick={() => alAbrir(nodo.id)}
          onKeyDown={(e) => alTecla(nodo.id, e)}
          title={nodo.nombre}
          className="line-clamp-2 min-w-0 rounded-sm py-1 text-left leading-snug break-words focus-visible:outline-2 focus-visible:outline-acento"
        >
          {nodo.nombre || <span className="font-normal text-texto-3 italic">Sin nombre</span>}
        </button>
        {noExistia && (
          <span className="flex-none text-xs font-normal text-texto-2 italic">
            no existía en este corte
          </span>
        )}
        {aviso && (
          <span
            role="img"
            aria-label={aviso}
            title={aviso}
            className="size-1.5 flex-none rounded-full bg-amarillo"
          />
        )}
      </div>
      <div className="px-2.5 text-right font-mono text-xs whitespace-nowrap max-md:hidden">
        {auto ? <PesoAuto peso={peso ?? 0} /> : peso ? porcentaje(peso) : '—'}
      </div>
      <div className="min-w-0 px-2.5 max-md:hidden">
        {chip && <Chip tono={chip.tono}>{chip.texto}</Chip>}
      </div>
      <div className="min-w-0 self-stretch">
        <PistaGantt
          nodo={nodo}
          resultado={resultado}
          rango={rango}
          fechaCorte={fechaCorte}
          marcas={marcas}
          soloLectura={soloLectura}
          alMover={(dias, extremo) => alMover(nodo.id, dias, extremo)}
        />
      </div>
    </div>
  )
}, filaIgual)
