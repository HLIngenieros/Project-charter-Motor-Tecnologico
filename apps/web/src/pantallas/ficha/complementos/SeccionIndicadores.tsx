import {
  OPERADORES_META,
  type CharterDetalle,
  type Indicador,
  type OperadorMeta,
} from '@charter/shared'
import { motion } from 'motion/react'
import { useId, useRef } from 'react'
import { v7 } from 'uuid'
import { useGuardarIndicadores } from '../../../api/charters'
import {
  AccionesFila,
  BotonAgregar,
  CLASE_CAMPO,
  CampoNumero,
  CampoTexto,
  EtiquetaMovil,
  manejadoresFila,
  SelectorCompacto,
  useEnfocarFila,
} from './controles'
import { SIMBOLO_OPERADOR, textoMeta } from './textos'
import { useColeccion } from './useColeccion'

const MAXIMO = 50

const nuevo = (): Indicador => ({
  id: v7(),
  nombre: '',
  formula: '',
  metaOperador: '>=',
  metaValor: null,
  metaUnidad: '',
  observaciones: '',
})

const vacio = (i: Indicador) =>
  !i.nombre.trim() &&
  !i.formula.trim() &&
  i.metaValor === null &&
  !i.metaUnidad.trim() &&
  !i.observaciones.trim()

/** Número · Indicador · Fórmula · Meta · Observaciones · acciones. En celular se apila. */
const COLUMNAS =
  'grid grid-cols-[28px_minmax(0,1fr)_auto] gap-x-2 gap-y-2 md:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(10.5rem,auto)_minmax(0,1fr)_auto] md:gap-x-4'
const FILA = `${COLUMNAS} items-start border-t border-linea-2 py-[9px] first:border-t-0`
/** En celular los campos van en la segunda columna; desde `md` cada uno es su columna. */
const CUERPO = 'col-start-2 row-start-1 flex min-w-0 flex-col gap-2 md:contents'

function Numero({ n }: { n: number }) {
  return (
    <span aria-hidden className="pt-px font-cifra text-[0.8125rem] font-semibold text-texto-2">
      {n}
    </span>
  )
}

function Cabecera({ conAcciones }: { conAcciones: boolean }) {
  return (
    <div
      aria-hidden
      className={`${COLUMNAS} border-b border-linea pb-1.5 text-xs font-semibold text-texto-2 max-md:hidden`}
    >
      <span>#</span>
      <span>Indicador</span>
      <span>Fórmula</span>
      <span>Meta</span>
      <span>Observaciones</span>
      {conAcciones ? <span className="w-[84px]" /> : <span />}
    </div>
  )
}

function Lectura({ indicadores, idTitulo }: { indicadores: Indicador[]; idTitulo: string }) {
  return (
    <ol aria-labelledby={idTitulo} className="flex flex-col">
      {indicadores.map((ind, i) => (
        <li key={ind.id} className={FILA}>
          <Numero n={i + 1} />
          <div className={CUERPO}>
            <p
              className={`text-[0.9375rem] leading-relaxed font-semibold ${ind.nombre ? 'text-tinta' : 'text-texto-3'}`}
            >
              {ind.nombre || 'Sin descripción'}
            </p>
            {ind.formula ? (
              <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-texto">
                <EtiquetaMovil>Fórmula</EtiquetaMovil>
                {ind.formula}
              </p>
            ) : (
              <span className="max-md:hidden" />
            )}
            <p className="text-[0.9375rem] leading-relaxed">
              <EtiquetaMovil>Meta</EtiquetaMovil>
              <span
                className={`font-cifra tabular-nums ${ind.metaValor === null ? 'text-texto-3' : 'font-semibold text-tinta'}`}
              >
                {textoMeta(ind.metaOperador, ind.metaValor, ind.metaUnidad)}
              </span>
            </p>
            {ind.observaciones ? (
              <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-texto-2">
                <EtiquetaMovil>Observaciones</EtiquetaMovil>
                {ind.observaciones}
              </p>
            ) : (
              <span className="max-md:hidden" />
            )}
          </div>
          <span />
        </li>
      ))}
    </ol>
  )
}

function Edicion({ charter, idTitulo }: { charter: CharterDetalle; idTitulo: string }) {
  const { mutateAsync } = useGuardarIndicadores(charter.id)
  const col = useColeccion<Indicador>({
    inicial: charter.indicadores,
    guardar: mutateAsync,
    vacia: vacio,
    maximo: MAXIMO,
  })
  const lista = useRef<HTMLOListElement>(null)
  useEnfocarFila(col.porEnfocar, lista)

  return (
    <>
      {col.filas.length === 0 ? (
        <p className="mb-1 text-[0.9375rem] text-texto-2">Aún no hay indicadores.</p>
      ) : (
        <Cabecera conAcciones />
      )}
      <ol ref={lista} aria-labelledby={idTitulo} className="flex flex-col">
        {col.filas.map((ind, i) => {
          const n = i + 1
          const editar = (cambios: Partial<Indicador>, inmediato?: boolean) =>
            col.editar(ind.id, cambios, inmediato)
          return (
            <motion.li
              key={ind.id}
              layout="position"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              data-fila={ind.id}
              className={`group ${FILA}`}
              {...manejadoresFila(
                () => col.salir(ind.id),
                (paso) => col.mover(ind.id, paso),
              )}
            >
              <Numero n={n} />
              <div className={CUERPO}>
                <CampoTexto
                  primero
                  etiqueta={`Indicador ${n}`}
                  valor={ind.nombre}
                  alCambiar={(nombre) => editar({ nombre })}
                  alSalir={col.enviar}
                  placeholder="Nombre del indicador"
                  maximo={300}
                  className="font-semibold text-tinta"
                />
                <label className="block">
                  <EtiquetaMovil>Fórmula</EtiquetaMovil>
                  <CampoTexto
                    etiqueta={`Fórmula del indicador ${n}`}
                    valor={ind.formula}
                    alCambiar={(formula) => editar({ formula })}
                    alSalir={col.enviar}
                    placeholder="Cómo se calcula"
                    maximo={1000}
                  />
                </label>
                <div>
                  <EtiquetaMovil>Meta</EtiquetaMovil>
                  <div className="flex items-center gap-1.5">
                    <SelectorCompacto
                      etiqueta={`Operador de la meta ${n}`}
                      valor={ind.metaOperador}
                      alCambiar={(op) => editar({ metaOperador: op as OperadorMeta }, true)}
                    >
                      {OPERADORES_META.map((op) => (
                        <option key={op} value={op}>
                          {SIMBOLO_OPERADOR[op]}
                        </option>
                      ))}
                    </SelectorCompacto>
                    <CampoNumero
                      etiqueta={`Valor de la meta ${n}`}
                      valor={ind.metaValor}
                      alCambiar={(metaValor) => editar({ metaValor })}
                      alSalir={col.enviar}
                      placeholder="Valor"
                      className="!mx-0 w-[4.5rem] text-right"
                    />
                    <input
                      type="text"
                      aria-label={`Unidad de la meta ${n}`}
                      value={ind.metaUnidad}
                      maxLength={40}
                      placeholder="unidad"
                      onChange={(e) => editar({ metaUnidad: e.target.value })}
                      onBlur={col.enviar}
                      className={`${CLASE_CAMPO} !mx-0 w-[4.5rem]`}
                    />
                  </div>
                </div>
                <label className="block">
                  <EtiquetaMovil>Observaciones</EtiquetaMovil>
                  <CampoTexto
                    etiqueta={`Observaciones del indicador ${n}`}
                    valor={ind.observaciones}
                    alCambiar={(observaciones) => editar({ observaciones })}
                    alSalir={col.enviar}
                    placeholder="Fuente, frecuencia…"
                    maximo={1000}
                    className="text-texto-2"
                  />
                </label>
              </div>
              <AccionesFila
                nombre="indicador"
                n={n}
                total={col.filas.length}
                mover={(paso) => col.mover(ind.id, paso)}
                quitar={() => col.quitar(ind.id)}
              />
            </motion.li>
          )
        })}
      </ol>
      {col.filas.length < MAXIMO && (
        <BotonAgregar texto="Agregar indicador" alPulsar={() => col.agregar(nuevo())} />
      )}
    </>
  )
}

/** Indicadores del charter: solo su definición (nombre, fórmula, meta y observaciones). */
export function SeccionIndicadores({
  charter,
  soloLectura,
}: {
  charter: CharterDetalle
  soloLectura: boolean
}) {
  const idTitulo = useId()
  const vacia = charter.indicadores.length === 0
  return (
    <section id="indicadores" aria-labelledby={idTitulo} className="flex scroll-mt-28 flex-col">
      <h2 id={idTitulo} className="mb-2 text-lg font-semibold">
        Indicadores
      </h2>
      {soloLectura ? (
        vacia ? (
          <p className="text-[0.9375rem] text-texto-2">Aún no hay indicadores.</p>
        ) : (
          <>
            <Cabecera conAcciones={false} />
            <Lectura indicadores={charter.indicadores} idTitulo={idTitulo} />
          </>
        )
      ) : (
        <Edicion charter={charter} idTitulo={idTitulo} />
      )}
    </section>
  )
}
