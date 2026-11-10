import type { FechaISO, ResultadoNodo } from '@charter/shared'
import { Chip } from '../../componentes/Chip'
import { fechaCorta, porcentaje } from '../../formato'
import { chipDe } from '../ficha/cronograma/estados'
import { COLOR_AVANCE } from '../ficha/cronograma/PistaGantt'

/** Hoja que entra en el corte, con lo que traía antes y el valor con que abre el formulario. */
export interface FilaCorte {
  id: string
  item: string
  nombre: string
  responsables: string[]
  peso: number | null
  inicio: FechaISO | null
  fin: FechaISO | null
  /** Ya no existe en el cronograma vigente (solo al editar un corte). */
  eliminada: boolean
  /** % del corte anterior; null si no hay corte anterior. */
  antes: number | null
  /** % con que abre el formulario. */
  inicial: number
}

/** `'12,5'` → `0.125`; null si no es un número entre 0 y 100. */
export function leerPorcentaje(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return 0
  if (!/^\d{1,3}(\.\d+)?$/.test(limpio)) return null
  const n = Number(limpio)
  return n > 100 ? null : n / 100
}

/** `0.125` → `'12,5'` (sin el signo, para el campo). */
export function textoPorcentaje(fraccion: number): string {
  return (Math.round(fraccion * 1000) / 10).toLocaleString('es-CO', {
    maximumFractionDigits: 1,
    useGrouping: false,
  })
}

const pctCorto = (f: number) => porcentaje(f, f * 100 === Math.round(f * 100) ? 0 : 1)

const Check = () => (
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export function FilaAvance({
  fila,
  texto,
  resultado,
  alCambiar,
}: {
  fila: FilaCorte
  texto: string
  resultado: ResultadoNodo | undefined
  alCambiar: (texto: string) => void
}) {
  const pct = leerPorcentaje(texto)
  const cambio = pct !== null && Math.abs(pct - fila.inicial) > 1e-9
  const baja = pct !== null && fila.antes !== null && pct < fila.antes - 1e-9
  const chip = resultado ? chipDe(resultado, true) : null
  const idAviso = `aviso-${fila.id}`
  const detalle = [
    fila.responsables.join(', '),
    fila.fin ? `fin ${fechaCorta(fila.fin)}` : null,
  ].filter(Boolean)

  return (
    <div
      className={[
        'grid items-center gap-x-3.5 gap-y-2 border-t border-linea-2 px-4.5 py-3 transition-colors duration-200',
        'grid-cols-[minmax(0,1fr)_80px_200px_116px] max-md:grid-cols-[minmax(0,1fr)_132px] max-md:px-3.5',
        cambio ? 'bg-[#f5fbfe]' : '',
      ].join(' ')}
    >
      <div className="min-w-0">
        <b className="block leading-snug font-semibold text-tinta">{fila.nombre}</b>
        <span className="text-[0.78125rem] text-texto-2">
          <span className="font-mono text-xs font-medium">{fila.item}</span>
          {fila.eliminada && (
            <>
              {' · '}
              <span className="font-medium text-alerta-texto">actividad eliminada</span>
            </>
          )}
          {detalle.map((d) => (
            <span key={d}> · {d}</span>
          ))}
        </span>
      </div>

      <div className="text-right text-[0.78125rem] text-texto-2 max-md:col-start-1 max-md:row-start-3 max-md:text-left">
        {fila.antes !== null && (
          <span className="whitespace-nowrap">Antes {pctCorto(fila.antes)}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 max-md:col-start-2 max-md:row-span-3 max-md:row-start-1 max-md:flex-col max-md:items-stretch">
        <span className="relative max-md:block">
          <input
            type="text"
            inputMode="decimal"
            value={texto}
            onChange={(e) => alCambiar(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label={`Real de ${fila.nombre}, en porcentaje`}
            aria-invalid={pct === null || undefined}
            aria-describedby={baja || pct === null ? idAviso : undefined}
            className={[
              'min-h-10 w-[84px] rounded-control border bg-superficie pr-7 pl-3 text-right font-mono text-[0.9375rem] text-tinta max-md:w-full',
              'transition-[border-color,box-shadow] duration-150 focus:shadow-foco focus:outline-none',
              pct === null
                ? 'border-alerta focus:border-alerta'
                : 'border-linea hover:border-texto-3 focus:border-acento',
            ].join(' ')}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.8125rem] text-texto-2"
          >
            %
          </span>
        </span>
        <button
          type="button"
          onClick={() => alCambiar('100')}
          aria-label={`Completar ${fila.nombre}`}
          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-control px-2 text-[0.78125rem] font-semibold text-ok-texto hover:bg-ok-suave focus-visible:outline-2 focus-visible:outline-acento"
        >
          <Check />
          100 %
        </button>
      </div>

      <div className="max-md:col-start-1 max-md:row-start-2">
        {chip && <Chip tono={chip.tono}>{chip.texto}</Chip>}
      </div>

      <div
        aria-hidden
        className="relative col-span-full -mt-1 h-1.5 rounded-full bg-fondo max-md:row-start-4"
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ${COLOR_AVANCE[resultado?.estado ?? ''] ?? 'bg-texto-3'}`}
          style={{ width: `${(pct ?? fila.inicial) * 100}%` }}
        />
        {resultado && (
          <span
            className="absolute -inset-y-0.5 w-0.5 rounded-full bg-institucional"
            style={{ left: `calc(${resultado.pv * 100}% - 1px)` }}
          />
        )}
      </div>

      {(baja || pct === null) && (
        <p
          id={idAviso}
          className={`col-span-full -mt-1 text-[0.78125rem] font-medium ${pct === null ? 'text-alerta-texto' : 'text-amarillo-texto'}`}
        >
          {pct === null
            ? 'Escribe un número de 0 a 100.'
            : `Baja frente al corte anterior (${pctCorto(fila.antes!)})`}
        </p>
      )}
    </div>
  )
}
