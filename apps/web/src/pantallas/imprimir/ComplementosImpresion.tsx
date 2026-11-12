import {
  nivelRiesgo,
  totalPresupuesto,
  type Indicador,
  type Riesgo,
  type Rubro,
} from '@charter/shared'
import { Chip } from '../../componentes/Chip'
import { pesos } from '../../formato'
import { MatrizRiesgos } from '../ficha/complementos/MatrizRiesgos'
import { NIVELES, resumenNiveles, textoNivel } from '../ficha/complementos/nivel'
import { textoMeta } from '../ficha/complementos/textos'

const VACIO = 'text-texto-2'
const TABLA = 'tabla-impresion w-full border-collapse text-[8.5pt]'
const TH = 'py-1.5 pr-2 font-semibold'
const TD = 'py-1.5 pr-2 align-top'
const SIN = <span className="text-texto-3">—</span>

export function IndicadoresImpresion({ indicadores }: { indicadores: Indicador[] }) {
  if (indicadores.length === 0) return <p className={VACIO}>Aún no hay indicadores.</p>
  return (
    <table aria-label="Indicadores" className={TABLA}>
      <thead>
        <tr className="border-b border-linea text-left text-texto-2">
          <th className={`${TH} w-6`}>#</th>
          <th className={`${TH} w-[26%]`}>Indicador</th>
          <th className={TH}>Fórmula</th>
          <th className={`${TH} w-[14%]`}>Meta</th>
          <th className={`${TH} w-[24%] pr-0`}>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        {indicadores.map((ind, i) => (
          <tr key={ind.id} className="fila-impresion border-b border-linea-2">
            <td className={`${TD} font-cifra text-texto-2`}>{i + 1}</td>
            <td className={`${TD} font-semibold text-tinta`}>{ind.nombre || 'Sin descripción'}</td>
            <td className={`${TD} whitespace-pre-line text-texto`}>{ind.formula || SIN}</td>
            <td
              className={`${TD} font-cifra whitespace-nowrap ${ind.metaValor === null ? 'text-texto-3' : 'font-semibold text-tinta'}`}
            >
              {textoMeta(ind.metaOperador, ind.metaValor, ind.metaUnidad)}
            </td>
            <td className={`${TD} pr-0 whitespace-pre-line text-texto-2`}>
              {ind.observaciones || SIN}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function RiesgosImpresion({ riesgos }: { riesgos: Riesgo[] }) {
  if (riesgos.length === 0) return <p className={VACIO}>Aún no hay riesgos.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="curva-impresion flex items-start gap-6">
        <div className="w-[300px] shrink-0">
          <MatrizRiesgos riesgos={riesgos} estatica />
        </div>
        <div className="flex flex-col gap-1 pt-2">
          <span className="text-xs text-texto-2">Resumen</span>
          <b className="font-titulo text-[0.9375rem] font-semibold text-tinta">
            {resumenNiveles(riesgos)}
          </b>
          <span className="mt-1 text-xs text-texto-2">
            Nivel = probabilidad × impacto (1 a 5 cada uno).
          </span>
        </div>
      </div>
      <table aria-label="Riesgos" className={TABLA}>
        <thead>
          <tr className="border-b border-linea text-left text-texto-2">
            <th className={`${TH} w-6`}>#</th>
            <th className={`${TH} w-[24%]`}>Riesgo</th>
            <th className={TH}>Causa</th>
            <th className={TH}>Mitigación</th>
            <th className={`${TH} w-[11%] pr-0`}>Nivel</th>
          </tr>
        </thead>
        <tbody>
          {riesgos.map((r, i) => {
            const c = nivelRiesgo(r.probabilidad, r.impacto)
            return (
              <tr key={r.id} className="fila-impresion border-b border-linea-2">
                <td className={`${TD} font-cifra text-texto-2`}>{i + 1}</td>
                <td className={`${TD} font-semibold text-tinta`}>
                  {r.riesgo || 'Sin descripción'}
                </td>
                <td className={`${TD} whitespace-pre-line text-texto`}>{r.causa || SIN}</td>
                <td className={`${TD} whitespace-pre-line text-texto`}>{r.mitigacion || SIN}</td>
                <td className={`${TD} pr-0 whitespace-nowrap`}>
                  <Chip tono={c ? NIVELES[c.nivel].chip : 'neutro'}>{textoNivel(r)}</Chip>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PresupuestoImpresion({ rubros }: { rubros: Rubro[] }) {
  if (rubros.length === 0) return <p className={VACIO}>Aún no hay presupuesto.</p>
  const mayor = Math.max(0, ...rubros.map((r) => r.valor))
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between rounded-control bg-fondo px-3 py-2">
        <span className="text-xs font-semibold text-texto-2">Presupuesto total</span>
        <b className="font-titulo text-xl font-semibold text-tinta tabular-nums">
          COP {pesos(totalPresupuesto(rubros))}
        </b>
      </div>
      <ol aria-label="Rubros" className="flex flex-col text-[8.5pt]">
        {rubros.map((r, i) => (
          <li key={r.id} className="fila-impresion border-b border-linea-2 py-1.5">
            <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,0.9fr)_7rem] items-center gap-x-3">
              <span className="font-cifra text-texto-2">{i + 1}</span>
              <span className="text-tinta">{r.descripcion || 'Sin descripción'}</span>
              <span className="h-2 overflow-hidden rounded-full bg-fondo">
                <span
                  className="block h-full rounded-full bg-institucional"
                  style={{ width: `${mayor > 0 ? ((r.valor / mayor) * 100).toFixed(2) : 0}%` }}
                />
              </span>
              <span className="text-right font-cifra font-semibold text-tinta tabular-nums">
                {pesos(r.valor)}
              </span>
            </div>
            {r.lineas.length > 0 && (
              <table className="mt-1 ml-[2rem] w-[calc(100%-2rem)] border-collapse text-[8pt]">
                <tbody>
                  {r.lineas.map((l) => (
                    <tr key={l.id} className="text-texto-2">
                      <td className="py-0.5 pr-2">{l.concepto || 'Sin descripción'}</td>
                      <td className="w-[5rem] py-0.5 pr-2 text-right font-cifra whitespace-nowrap">
                        {l.cantidad.toLocaleString('es-CO')} ×
                      </td>
                      <td className="w-[6rem] py-0.5 pr-2 text-right font-cifra whitespace-nowrap">
                        {pesos(l.valorUnitario)}
                      </td>
                      <td className="w-[7rem] py-0.5 text-right font-cifra whitespace-nowrap">
                        {pesos(Math.round(l.cantidad * l.valorUnitario))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
