import { aDia } from './fechas'
import {
  pesosEfectivos,
  REGLAS_POR_DEFECTO,
  sumaCompleta,
  sumasDePesos,
  type Reglas,
} from './reglas'
import type { NodoArbol } from './tipos'

export interface Aviso {
  codigo:
    'pesos_no_suman_100' | 'pesos_grupo' | 'fin_antes_de_inicio' | 'sin_programar' | 'nombre_vacio'
  actividadId?: string
  mensaje: string
}

const porcentaje = (x: number) => (x * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })

/** Revisa el cronograma y devuelve avisos para el usuario (no bloquean el guardado). */
export function validarCronograma(
  raices: NodoArbol[],
  reglas: Reglas = REGLAS_POR_DEFECTO,
): Aviso[] {
  const avisos: Aviso[] = []
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
      if (!(peso > 0 && n.inicio && n.fin) && !fechasInvertidas) {
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

  const { raiz, grupos } = sumasDePesos(raices, reglas.sinPeso)
  const nodos = porId(raices)
  const cola =
    reglas.sumaPesos === 'obligatoria' ? ' Debes completarlos para registrar un corte.' : ''
  for (const [id, suma] of grupos) {
    if (sumaCompleta(suma)) continue
    avisos.push({
      codigo: 'pesos_grupo',
      actividadId: id,
      mensaje: `Las subactividades de ${nodos.get(id)?.item ?? ''} suman ${porcentaje(suma)} %; ${
        suma < 1 ? 'falta' : 'sobra'
      } ${porcentaje(Math.abs(1 - suma))} %.${cola}`,
    })
  }
  if (raiz > 0 && !sumaCompleta(raiz)) {
    avisos.unshift({
      codigo: 'pesos_no_suman_100',
      mensaje: `Las actividades del primer nivel suman ${porcentaje(raiz)} % y deberían sumar 100 %.${cola}`,
    })
  }
  return avisos
}

function porId(raices: NodoArbol[]): Map<string, NodoArbol> {
  const m = new Map<string, NodoArbol>()
  const visitar = (n: NodoArbol) => {
    m.set(n.id, n)
    n.hijos.forEach(visitar)
  }
  raices.forEach(visitar)
  return m
}

export interface ResumenPesos {
  /** Suma de los relativos del primer nivel que cuentan. */
  proyecto: number
  /** Solo las agrupadoras cuyas subactividades no suman 100 %, en preorden. */
  grupos: { id: string; item: string; nombre: string; suma: number }[]
}

export function resumenPesos(
  raices: NodoArbol[],
  reglas: Reglas = REGLAS_POR_DEFECTO,
): ResumenPesos {
  const { raiz, grupos } = sumasDePesos(raices, reglas.sinPeso)
  const nodos = porId(raices)
  return {
    proyecto: raiz,
    grupos: [...grupos]
      .filter(([, suma]) => !sumaCompleta(suma))
      .map(([id, suma]) => {
        const n = nodos.get(id)!
        return { id, item: n.item, nombre: n.nombre, suma }
      }),
  }
}
