import { nivelRiesgo, type CharterDetalle, type Riesgo } from '@charter/shared'
import { motion } from 'motion/react'
import { useId, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { v7 } from 'uuid'
import { useGuardarRiesgos } from '../../../api/charters'
import { Chip } from '../../../componentes/Chip'
import {
  AccionesFila,
  BotonAgregar,
  CampoTexto,
  manejadoresFila,
  SelectorCompacto,
  useEnfocarFila,
} from './controles'
import { MatrizRiesgos } from './MatrizRiesgos'
import {
  ESCALA,
  ETIQUETAS_IMPACTO,
  ETIQUETAS_PROBABILIDAD,
  NIVELES,
  resumenNiveles,
  textoNivel,
} from './nivel'
import { useColeccion, type Coleccion } from './useColeccion'

const MAXIMO = 50

const nuevo = (): Riesgo => ({
  id: v7(),
  riesgo: '',
  causa: '',
  mitigacion: '',
  probabilidad: null,
  impacto: null,
})

const vacio = (r: Riesgo) =>
  !r.riesgo.trim() &&
  !r.causa.trim() &&
  !r.mitigacion.trim() &&
  r.probabilidad === null &&
  r.impacto === null

function ChipNivel({ riesgo }: { riesgo: Riesgo }) {
  const c = nivelRiesgo(riesgo.probabilidad, riesgo.impacto)
  return <Chip tono={c ? NIVELES[c.nivel].chip : 'neutro'}>{textoNivel(riesgo)}</Chip>
}

const FILA =
  'grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-2 rounded-[8px] border-t border-linea-2 px-2 py-2.5 -mx-2 transition-colors duration-150 first:border-t-0 aria-[current=true]:bg-info-suave'

function Numero({ n }: { n: number }) {
  return (
    <span aria-hidden className="pt-px font-cifra text-[0.8125rem] font-semibold text-texto-2">
      {n}
    </span>
  )
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="mb-0.5 block text-xs font-semibold text-texto-2">{children}</span>
}

/** Causa y mitigación, a dos columnas desde `sm`. */
function Detalle({ causa, mitigacion }: { causa: ReactNode; mitigacion: ReactNode }) {
  return (
    <div className="mt-1.5 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
      <div className="min-w-0">
        <Etiqueta>Causa</Etiqueta>
        {causa}
      </div>
      <div className="min-w-0">
        <Etiqueta>Mitigación</Etiqueta>
        {mitigacion}
      </div>
    </div>
  )
}

function TextoLectura({ texto, tenue = false }: { texto: string; tenue?: boolean }) {
  return texto ? (
    <p
      className={`text-[0.9375rem] leading-relaxed whitespace-pre-line ${tenue ? 'text-texto-2' : 'text-texto'}`}
    >
      {texto}
    </p>
  ) : (
    <p className="text-[0.9375rem] leading-relaxed text-texto-3">—</p>
  )
}

interface Resalte {
  resaltado: string | null
  alResaltar(id: string | null): void
}

function propsResalte(id: string, { resaltado, alResaltar }: Resalte) {
  return {
    'aria-current': resaltado === id ? ('true' as const) : undefined,
    onMouseEnter: () => alResaltar(id),
    onMouseLeave: () => alResaltar(null),
    onFocusCapture: () => alResaltar(id),
    onBlurCapture: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) alResaltar(null)
    },
  }
}

function Lectura({
  riesgos,
  idTitulo,
  resalte,
}: {
  riesgos: Riesgo[]
  idTitulo: string
  resalte: Resalte
}) {
  return (
    <ol aria-labelledby={idTitulo} className="flex flex-col">
      {riesgos.map((r, i) => (
        <li key={r.id} className={FILA} {...propsResalte(r.id, resalte)}>
          <Numero n={i + 1} />
          <div className="min-w-0">
            <p
              className={`text-[0.9375rem] leading-relaxed font-semibold ${r.riesgo ? 'text-tinta' : 'text-texto-3'}`}
            >
              {r.riesgo || 'Sin descripción'}
            </p>
            <Detalle
              causa={<TextoLectura texto={r.causa} />}
              mitigacion={<TextoLectura texto={r.mitigacion} tenue />}
            />
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-2">
              <span>
                Probabilidad{' '}
                <b className="font-semibold text-tinta">
                  {r.probabilidad
                    ? `${r.probabilidad} · ${ETIQUETAS_PROBABILIDAD[r.probabilidad - 1]}`
                    : '—'}
                </b>
              </span>
              <span>
                Impacto{' '}
                <b className="font-semibold text-tinta">
                  {r.impacto ? `${r.impacto} · ${ETIQUETAS_IMPACTO[r.impacto - 1]}` : '—'}
                </b>
              </span>
              <ChipNivel riesgo={r} />
            </p>
          </div>
          <span />
        </li>
      ))}
    </ol>
  )
}

function SelectorEscala({
  etiqueta,
  valor,
  etiquetas,
  alCambiar,
}: {
  etiqueta: string
  valor: number | null
  etiquetas: string[]
  alCambiar(valor: number | null): void
}) {
  return (
    <SelectorCompacto
      etiqueta={etiqueta}
      valor={valor === null ? '' : String(valor)}
      alCambiar={(v) => alCambiar(v === '' ? null : Number(v))}
    >
      <option value="">—</option>
      {ESCALA.map((n) => (
        <option key={n} value={n}>
          {n} · {etiquetas[n - 1]}
        </option>
      ))}
    </SelectorCompacto>
  )
}

function Edicion({
  col,
  idTitulo,
  resalte,
}: {
  col: Coleccion<Riesgo>
  idTitulo: string
  resalte: Resalte
}) {
  const lista = useRef<HTMLOListElement>(null)
  useEnfocarFila(col.porEnfocar, lista)
  return (
    <>
      {col.filas.length === 0 && (
        <p className="mb-1 text-[0.9375rem] text-texto-2">Aún no hay riesgos.</p>
      )}
      <ol ref={lista} aria-labelledby={idTitulo} className="flex flex-col">
        {col.filas.map((r, i) => {
          const n = i + 1
          const editar = (cambios: Partial<Riesgo>, inmediato?: boolean) =>
            col.editar(r.id, cambios, inmediato)
          const fila = manejadoresFila(
            () => col.salir(r.id),
            (paso) => col.mover(r.id, paso),
          )
          return (
            <motion.li
              key={r.id}
              layout="position"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              data-fila={r.id}
              className={`group ${FILA}`}
              {...propsResalte(r.id, resalte)}
              onBlur={fila.onBlur}
              onKeyDown={fila.onKeyDown}
            >
              <Numero n={n} />
              <div className="min-w-0">
                <CampoTexto
                  primero
                  etiqueta={`Riesgo ${n}`}
                  valor={r.riesgo}
                  alCambiar={(riesgo) => editar({ riesgo })}
                  alSalir={col.enviar}
                  placeholder="Qué puede pasar"
                  maximo={300}
                  className="font-semibold text-tinta"
                />
                <Detalle
                  causa={
                    <CampoTexto
                      etiqueta={`Causa del riesgo ${n}`}
                      valor={r.causa}
                      alCambiar={(causa) => editar({ causa })}
                      alSalir={col.enviar}
                      placeholder="Por qué pasaría"
                      maximo={1000}
                    />
                  }
                  mitigacion={
                    <CampoTexto
                      etiqueta={`Mitigación del riesgo ${n}`}
                      valor={r.mitigacion}
                      alCambiar={(mitigacion) => editar({ mitigacion })}
                      alSalir={col.enviar}
                      placeholder="Qué se hará"
                      maximo={1000}
                      className="text-texto-2"
                    />
                  }
                />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-texto-2">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>Probabilidad</span>
                    <SelectorEscala
                      etiqueta={`Probabilidad del riesgo ${n}`}
                      valor={r.probabilidad}
                      etiquetas={ETIQUETAS_PROBABILIDAD}
                      alCambiar={(probabilidad) => editar({ probabilidad }, true)}
                    />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>Impacto</span>
                    <SelectorEscala
                      etiqueta={`Impacto del riesgo ${n}`}
                      valor={r.impacto}
                      etiquetas={ETIQUETAS_IMPACTO}
                      alCambiar={(impacto) => editar({ impacto }, true)}
                    />
                  </span>
                  <ChipNivel riesgo={r} />
                </div>
              </div>
              <AccionesFila
                nombre="riesgo"
                n={n}
                total={col.filas.length}
                mover={(paso) => col.mover(r.id, paso)}
                quitar={() => col.quitar(r.id)}
              />
            </motion.li>
          )
        })}
      </ol>
      {col.filas.length < MAXIMO && (
        <BotonAgregar texto="Agregar riesgo" alPulsar={() => col.agregar(nuevo())} />
      )}
    </>
  )
}

function Disposicion({
  idTitulo,
  riesgos,
  resalte,
  children,
}: {
  idTitulo: string
  riesgos: Riesgo[]
  resalte: Resalte
  children: ReactNode
}) {
  const resumen = resumenNiveles(riesgos)
  return (
    <section id="riesgos" aria-labelledby={idTitulo} className="scroll-mt-28">
      <h2 id={idTitulo} className="mb-3 text-lg font-semibold">
        Riesgos
      </h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-8">
        <div className="mx-auto w-full max-w-[20rem] lg:mx-0">
          <MatrizRiesgos
            riesgos={riesgos}
            resaltado={resalte.resaltado}
            alResaltar={resalte.alResaltar}
          />
          {resumen && <p className="mt-2 text-center text-sm text-texto-2">{resumen}</p>}
        </div>
        <div className="flex min-w-0 flex-col">{children}</div>
      </div>
    </section>
  )
}

function ConEdicion({ charter, idTitulo }: { charter: CharterDetalle; idTitulo: string }) {
  const { mutateAsync } = useGuardarRiesgos(charter.id)
  const col = useColeccion<Riesgo>({
    inicial: charter.riesgos,
    guardar: mutateAsync,
    vacia: vacio,
    maximo: MAXIMO,
  })
  const [resaltado, alResaltar] = useState<string | null>(null)
  const resalte = { resaltado, alResaltar }
  return (
    <Disposicion idTitulo={idTitulo} riesgos={col.filas} resalte={resalte}>
      <Edicion col={col} idTitulo={idTitulo} resalte={resalte} />
    </Disposicion>
  )
}

function ConLectura({ charter, idTitulo }: { charter: CharterDetalle; idTitulo: string }) {
  const [resaltado, alResaltar] = useState<string | null>(null)
  const resalte = { resaltado, alResaltar }
  return (
    <Disposicion idTitulo={idTitulo} riesgos={charter.riesgos} resalte={resalte}>
      {charter.riesgos.length === 0 ? (
        <p className="text-[0.9375rem] text-texto-2">Aún no hay riesgos.</p>
      ) : (
        <Lectura riesgos={charter.riesgos} idTitulo={idTitulo} resalte={resalte} />
      )}
    </Disposicion>
  )
}

/** Riesgos del charter: matriz de probabilidad × impacto y su lista, enlazadas punto ↔ fila. */
export function SeccionRiesgos({
  charter,
  soloLectura,
}: {
  charter: CharterDetalle
  soloLectura: boolean
}) {
  const idTitulo = useId()
  return soloLectura ? (
    <ConLectura charter={charter} idTitulo={idTitulo} />
  ) : (
    <ConEdicion charter={charter} idTitulo={idTitulo} />
  )
}
