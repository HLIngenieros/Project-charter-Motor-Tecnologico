import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Cifra } from '../../componentes/Cifra'
import { porcentaje } from '../../formato'
import { useMovimientoReducido } from '../../movimiento'
import type { FiltroSemaforo } from './filtrar'
import {
  lecturaSegmento,
  SEGMENTOS,
  type EjeTablero,
  type GrupoTablero,
  type Segmento,
  type Tablero as DatosTablero,
} from './datosTablero'

/** Tonos del semáforo; el amarillo lleva borde para llegar a 3:1 sobre blanco. */
const TONO: Record<Segmento, string> = {
  verde: 'bg-ok',
  amarillo: 'bg-amarillo shadow-[inset_0_0_0_1px_var(--color-amarillo-texto)]',
  naranja: 'bg-naranja',
  rojo: 'bg-alerta',
  vencida: 'bg-vencida',
  neutro: 'bg-linea',
}

const LEYENDA: Record<Segmento, string> = {
  verde: 'Al día',
  amarillo: 'En atención',
  naranja: 'En riesgo',
  rojo: 'Atrasado',
  vencida: 'Vencido',
  neutro: 'Sin corte o sin iniciar',
}

const entero = (n: number) => Math.round(n).toLocaleString('es-CO')

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-tarjeta border border-linea bg-superficie px-4 py-3.5 md:px-5 md:py-4">
      <div className="text-[0.8125rem] text-texto-2">{titulo}</div>
      {children}
    </div>
  )
}

function Numero({ valor, tono = 'text-tinta' }: { valor: number; tono?: string }) {
  return (
    <Cifra
      valor={valor}
      formato={entero}
      className={`mt-1 block font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums ${tono}`}
    />
  )
}

function Barra({
  eje,
  grupo,
  activo,
  alPulsar,
}: {
  eje: EjeTablero
  grupo: GrupoTablero
  activo: FiltroSemaforo | null
  alPulsar: (s: FiltroSemaforo) => void
}) {
  const reducido = useMovimientoReducido()
  const delGrupo = activo?.eje === eje && activo.grupo === grupo.id
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.84375rem]">
        <span className="truncate text-tinta">{grupo.nombre}</span>
        <span className="font-titulo font-semibold text-tinta tabular-nums">{grupo.total}</span>
      </div>
      <motion.div
        className="flex h-4 origin-left gap-0.5"
        initial={reducido ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {SEGMENTOS.filter((s) => grupo.conteo[s] > 0).map((s) => {
          const n = grupo.conteo[s]
          const elegido = delGrupo && activo.segmento === s
          const etiqueta = `${grupo.nombre}: ${n} ${lecturaSegmento(s, n)}`
          return (
            <button
              key={s}
              type="button"
              aria-label={etiqueta}
              aria-pressed={elegido}
              title={etiqueta}
              onClick={() => alPulsar({ eje, grupo: grupo.id, segmento: s })}
              style={{ flexGrow: n }}
              className={[
                'min-w-2 basis-0 cursor-pointer rounded-[3px] transition-[opacity,box-shadow] duration-150',
                'hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento',
                TONO[s],
                elegido ? 'ring-2 ring-acento ring-offset-1' : '',
                delGrupo && !elegido ? 'opacity-45' : '',
              ].join(' ')}
            />
          )
        })}
      </motion.div>
    </li>
  )
}

function Semaforo({
  titulo,
  eje,
  grupos,
  activo,
  alPulsar,
}: {
  titulo: string
  eje: EjeTablero
  grupos: GrupoTablero[]
  activo: FiltroSemaforo | null
  alPulsar: (s: FiltroSemaforo) => void
}) {
  return (
    <div className="rounded-tarjeta border border-linea bg-superficie px-4 py-3.5 md:px-5 md:py-4">
      <h3 className="mb-3 text-[0.9375rem] font-semibold">{titulo}</h3>
      {grupos.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {grupos.map((g) => (
            <Barra key={g.id} eje={eje} grupo={g} activo={activo} alPulsar={alPulsar} />
          ))}
        </ul>
      ) : (
        <p className="text-[0.84375rem] text-texto-2">Ningún charter activo.</p>
      )}
    </div>
  )
}

/** Cifras y semáforo por área y categoría de los charters filtrados (solo activos). */
export function Tablero({
  datos,
  semaforo,
  alPulsar,
}: {
  datos: DatosTablero
  semaforo: FiltroSemaforo | null
  alPulsar: (s: FiltroSemaforo) => void
}) {
  return (
    <section aria-label="Tablero" className="mt-6 max-md:mt-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Tarjeta titulo="Activos">
          <Numero valor={datos.activos} />
        </Tarjeta>
        <Tarjeta titulo="En rojo o vencidos">
          <Numero valor={datos.enRojo} tono={datos.enRojo > 0 ? 'text-alerta-texto' : undefined} />
        </Tarjeta>
        <Tarjeta titulo="Avance">
          {datos.avance ? (
            <p className="mt-1 text-[0.8125rem] leading-snug text-texto-2">
              <Cifra
                valor={datos.avance.ev}
                formato={(n) => porcentaje(n)}
                className="font-titulo text-[1.75rem] leading-tight font-semibold text-tinta tabular-nums"
              />{' '}
              real de{' '}
              <Cifra
                valor={datos.avance.pv}
                formato={(n) => porcentaje(n)}
                className="tabular-nums"
              />{' '}
              planeado
            </p>
          ) : (
            <p className="mt-1 font-titulo text-[1.75rem] leading-tight font-semibold text-texto-3">
              —
            </p>
          )}
        </Tarjeta>
        <Tarjeta titulo="Sin corte reciente">
          <Numero
            valor={datos.sinCorteReciente}
            tono={datos.sinCorteReciente > 0 ? 'text-amarillo-texto' : undefined}
          />
        </Tarjeta>
      </div>

      <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-2 md:gap-4">
        <Semaforo
          titulo="Semáforo por área"
          eje="area"
          grupos={datos.porArea}
          activo={semaforo}
          alPulsar={alPulsar}
        />
        <Semaforo
          titulo="Semáforo por categoría"
          eje="categoria"
          grupos={datos.porCategoria}
          activo={semaforo}
          alPulsar={alPulsar}
        />
      </div>

      <ul
        aria-label="Leyenda del semáforo"
        className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.78125rem] text-texto-2"
      >
        {SEGMENTOS.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-[2px] ${TONO[s]}`} />
            {LEYENDA[s]}
          </li>
        ))}
      </ul>
    </section>
  )
}
