import { useEffect, useState } from 'react'
import { haceRato } from '../../formato'
import { useGuardado } from './colaGuardado'

export interface SeccionIndice {
  id: string
  titulo: string
  cuenta?: number
}

/** Marca la sección que se está leyendo: la última cuyo título pasó la banda fija. */
function useSeccionVisible(ids: string[]): string | undefined {
  const [visible, setVisible] = useState(ids[0])
  const clave = ids.join(',')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const elementos = clave
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e !== null)
    const enVista = new Set<string>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) enVista.add(e.target.id)
          else enVista.delete(e.target.id)
        }
        const primera = elementos.find((el) => enVista.has(el.id))
        if (primera) setVisible(primera.id)
      },
      { rootMargin: '-96px 0px -45% 0px' },
    )
    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [clave])
  return visible
}

/** Re-pinta cada 30 s para que «hace n min» avance. */
function useReloj(): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return ahora
}

/** En solo lectura no se habla de guardar, salvo un guardado en curso o fallido de antes. */
function EstadoGuardado({ soloLectura }: { soloLectura: boolean }) {
  const { estado, ultimoGuardado, error, reintentar } = useGuardado()
  const ahora = useReloj()
  if (soloLectura && estado !== 'error' && estado !== 'guardando') return null
  if (estado === 'error')
    return (
      <p role="alert" className="text-[0.78125rem] font-medium text-alerta-texto">
        No se pudo guardar
        {error?.message && <span className="block font-normal">{error.message}</span>}
        <button
          type="button"
          onClick={reintentar}
          className="mt-1 rounded-sm font-semibold text-institucional underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
        >
          Reintentar
        </button>
      </p>
    )
  return (
    <p className="flex items-center gap-1.5 text-[0.78125rem] text-texto-2">
      <span
        aria-hidden
        className={`size-[7px] rounded-full ${estado === 'guardando' ? 'animate-pulse bg-texto-3' : 'bg-ok'}`}
      />
      {estado === 'guardando'
        ? 'Guardando…'
        : ultimoGuardado
          ? `Guardado ${haceRato(ultimoGuardado, Math.max(ahora, Date.parse(ultimoGuardado)))}`
          : 'Los cambios se guardan solos'}
    </p>
  )
}

export function IndiceFicha({
  secciones,
  soloLectura,
}: {
  secciones: SeccionIndice[]
  soloLectura: boolean
}) {
  const visible = useSeccionVisible(secciones.map((s) => s.id))
  return (
    <nav
      aria-label="Secciones del charter"
      className={[
        'flex gap-0.5 self-start',
        'lg:sticky lg:top-24 lg:flex-col',
        'max-lg:sticky max-lg:top-0 max-lg:z-15 max-lg:-mx-4 max-lg:mb-4 max-lg:gap-1 max-lg:overflow-x-auto',
        'max-lg:border-b max-lg:border-linea max-lg:bg-fondo max-lg:px-4 max-lg:py-2 max-lg:[scrollbar-width:none]',
      ].join(' ')}
    >
      {secciones.map((s) => {
        const activa = s.id === visible
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={activa ? 'location' : undefined}
            className={[
              'flex items-center justify-between gap-3 rounded-control px-3 py-[7px] text-sm whitespace-nowrap',
              'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-acento',
              activa
                ? 'bg-superficie font-semibold text-institucional shadow-[0_1px_2px_rgb(11_31_51/0.06)]'
                : 'text-texto-2 hover:bg-white/70 hover:text-tinta',
            ].join(' ')}
          >
            {s.titulo}
            {s.cuenta !== undefined && (
              <small className="font-cifra text-xs font-medium text-texto-2 max-lg:hidden">
                {s.cuenta}
              </small>
            )}
          </a>
        )
      })}
      <div className="mt-4 px-3 empty:hidden max-lg:hidden">
        <EstadoGuardado soloLectura={soloLectura} />
      </div>
    </nav>
  )
}

/** Estado de guardado para pantallas angostas, donde el índice es una fila. */
export function EstadoGuardadoMovil({ soloLectura }: { soloLectura: boolean }) {
  return (
    <div className="mb-3 empty:hidden lg:hidden">
      <EstadoGuardado soloLectura={soloLectura} />
    </div>
  )
}
