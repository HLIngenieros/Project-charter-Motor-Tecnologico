import { aDia } from './fechas'
import { pesosEfectivos, REGLAS_POR_DEFECTO, type Reglas } from './reglas'
import type { NodoArbol } from './tipos'

export interface Aviso {
  codigo: 'pesos_no_suman_100' | 'fin_antes_de_inicio' | 'sin_programar' | 'nombre_vacio'
  actividadId?: string
  mensaje: string
}

const TOLERANCIA = 1e-6

const porcentaje = (x: number) => (x * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })

/** Revisa el cronograma y devuelve avisos para el usuario (no bloquean el guardado). */
export function validarCronograma(
  raices: NodoArbol[],
  reglas: Reglas = REGLAS_POR_DEFECTO,
): Aviso[] {
  const avisos: Aviso[] = []
  let sumaPesos = 0
  const pesos = pesosEfectivos(raices, reglas.sinPeso)

  const visitar = (n: NodoArbol) => {
    if (!n.nombre.trim()) {
      avisos.push({
        codigo: 'nombre_vacio',
        actividadId: n.id,
        mensaje: `La actividad ${n.item} no tiene nombre.`,
      })
    }

    const fechasInvertidas = !!n.inicio && !!n.fin && aDia(n.fin) < aDia(n.inicio)
    if (fechasInvertidas) {
      avisos.push({
        codigo: 'fin_antes_de_inicio',
        actividadId: n.id,
        mensaje: `La actividad ${n.item} termina antes de empezar.`,
      })
    }

    if (n.esHoja) {
      const peso = pesos[n.id]?.peso ?? 0
      if (peso > 0 && n.inicio && n.fin && !fechasInvertidas) {
        sumaPesos += peso
      } else if (!fechasInvertidas) {
        avisos.push({
          codigo: 'sin_programar',
          actividadId: n.id,
          mensaje: `La actividad ${n.item} no tiene peso o fechas; no cuenta en el avance.`,
        })
      }
    }
    n.hijos.forEach(visitar)
  }
  raices.forEach(visitar)

  if (sumaPesos > 0 && Math.abs(sumaPesos - 1) > TOLERANCIA) {
    avisos.unshift({
      codigo: 'pesos_no_suman_100',
      mensaje: `Los pesos de las actividades suman ${porcentaje(sumaPesos)} % y deberían sumar 100 %.${
        reglas.sumaPesos === 'obligatoria' ? ' Debes completarlos para registrar un corte.' : ''
      }`,
    })
  }
  return avisos
}
