import type { NodoArbol } from '@charter/shared'
import { Chip } from '../../componentes/Chip'
import { fechaCorta, porcentaje } from '../../formato'
import { rangoProyecto } from '../ficha/cronograma/escala'
import { chipDe } from '../ficha/cronograma/estados'
import { PistaGantt } from '../ficha/cronograma/PistaGantt'
import type { VistaCronograma } from '../ficha/useVistaCronograma'

const NADA = () => {}

/** Todas las filas del árbol, desplegadas, en orden. */
function aplanar(raices: NodoArbol[]): NodoArbol[] {
  return raices.flatMap((n) => [n, ...aplanar(n.hijos)])
}

const corta = (f: string | null | undefined) => (f ? fechaCorta(f).replace(/ \d{4}$/, '') : '—')

/** Cronograma completo para imprimir: tabla con la pista del Gantt a la escala del proyecto. */
export function CronogramaImpresion({ vista }: { vista: VistaCronograma }) {
  const { arbol, calculo, fechaCalculo, historica } = vista
  const filas = aplanar(arbol)
  if (filas.length === 0) return <p className="text-sm text-texto-2">Sin registrar</p>

  const rango = rangoProyecto(calculo.proyecto)
  const marcas = historica ? [{ fecha: historica.fecha }] : []
  const fechaCorte = historica?.fecha ?? fechaCalculo

  return (
    <table aria-label="Cronograma" className="tabla-impresion w-full border-collapse text-[8.5pt]">
      <thead>
        <tr className="border-b border-linea text-left text-texto-2">
          <th className="w-[7%] py-1.5 pr-1.5 font-semibold">Ítem</th>
          <th className="py-1.5 pr-1.5 font-semibold">Actividad</th>
          <th className="w-[8%] py-1.5 pr-3 text-right font-semibold">Peso</th>
          <th className="w-[9%] py-1.5 pr-1.5 font-semibold">Inicio</th>
          <th className="w-[9%] py-1.5 pr-1.5 font-semibold">Fin</th>
          <th className="w-[13%] py-1.5 pr-1.5 font-semibold">Estado</th>
          <th className="w-[8%] py-1.5 pr-3 text-right font-semibold">Real</th>
          <th className="w-[24%] py-1.5 font-semibold">
            <span className="sr-only">Barra del cronograma</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {filas.map((n) => {
          const r = calculo.nodos[n.id]
          const chip = r ? chipDe(r, n.esHoja) : null
          const peso = n.esHoja && !r?.pesoAuto ? n.peso : r?.peso
          return (
            <tr
              key={n.id}
              className={`fila-impresion border-b border-linea-2 align-middle ${n.esHoja ? 'text-texto' : 'font-semibold text-tinta'}`}
            >
              <td className="py-1 pr-1.5 font-cifra text-[8pt] text-texto-2">{n.item}</td>
              <td className="py-1 pr-1.5" style={{ paddingLeft: (n.nivel - 1) * 10 }}>
                {n.nombre || 'Sin nombre'}
              </td>
              <td className="py-1 pr-3 text-right font-cifra whitespace-nowrap">
                {peso ? porcentaje(peso) : '—'}
                {n.esHoja && r?.pesoAuto && <span className="text-texto-3"> auto</span>}
              </td>
              <td className="py-1 pr-1.5 whitespace-nowrap">{corta(r?.inicio ?? n.inicio)}</td>
              <td className="py-1 pr-1.5 whitespace-nowrap">{corta(r?.fin ?? n.fin)}</td>
              <td className="py-1 pr-1.5">{chip && <Chip tono={chip.tono}>{chip.texto}</Chip>}</td>
              <td className="py-1 pr-3 text-right font-cifra whitespace-nowrap">
                {r ? porcentaje(r.ev) : '—'}
              </td>
              <td className="h-7 p-0">
                <div className="relative h-7">
                  <PistaGantt
                    nodo={n}
                    resultado={r}
                    rango={rango}
                    fechaCorte={fechaCorte}
                    marcas={marcas}
                    soloLectura
                    alMover={NADA}
                  />
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
