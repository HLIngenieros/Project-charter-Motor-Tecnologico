import { aDia, aISO, type FechaISO } from '@charter/shared'

export type Escala = 'trimestre' | 'semestre' | 'anio'

export interface Rango {
  desde: FechaISO
  /** Exclusivo: el día siguiente al último visible. */
  hasta: FechaISO
}

const DIAS: Record<Escala, number> = { trimestre: 92, semestre: 183, anio: 366 }
const MARGEN = 7
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * Ventana visible de la escala. Si el proyecto cabe con margen, se muestra entero; si no, la
 * ventana se ubica alrededor de la fecha de corte sin salirse del proyecto.
 */
export function rangoVisible(
  proyecto: { inicio: FechaISO | null; fin: FechaISO | null } | null,
  escala: Escala,
  corte: FechaISO,
): Rango {
  const largo = DIAS[escala]
  const t = aDia(corte)
  let desde: number
  if (!proyecto?.inicio || !proyecto.fin) {
    desde = t - Math.round(largo * 0.3)
  } else {
    const ini = aDia(proyecto.inicio) - MARGEN
    const fin = aDia(proyecto.fin) + MARGEN + 1
    desde =
      fin - ini <= largo ? ini : Math.min(Math.max(t - Math.round(largo * 0.3), ini), fin - largo)
  }
  return { desde: aISO(desde), hasta: aISO(desde + largo) }
}

/** Posición de una fecha en la ventana, de 0 (desde) a 100 (hasta). */
export function aPorcentaje(fecha: FechaISO, r: Rango): number {
  return ((aDia(fecha) - aDia(r.desde)) / (aDia(r.hasta) - aDia(r.desde))) * 100
}

export function diasPorPixel(r: Rango, anchoPx: number): number {
  return anchoPx > 0 ? (aDia(r.hasta) - aDia(r.desde)) / anchoPx : 0
}

/** Distancia mínima, en píxeles, entre la etiqueta de un mes y la del corte. */
const SEPARACION_CORTE = 36

/**
 * Inicio de cada mes visible (o de cada trimestre en la escala año). Si hay corte, la etiqueta
 * del mes que quedaría pegada a la suya se deja vacía (la línea del mes se conserva). `anchoPx`
 * es el ancho de la pista; por defecto el mínimo de la columna.
 */
export function marcas(
  r: Rango,
  escala: Escala,
  fechaCorte?: FechaISO,
  anchoPx = 300,
): { fecha: FechaISO; etiqueta: string }[] {
  const pxPorDia = anchoPx / (aDia(r.hasta) - aDia(r.desde))
  const cerca = (fecha: FechaISO) =>
    !!fechaCorte && Math.abs(aDia(fecha) - aDia(fechaCorte)) * pxPorDia < SEPARACION_CORTE
  const salida: { fecha: FechaISO; etiqueta: string }[] = []
  let [a, m] = r.desde.split('-').map(Number) as [number, number]
  for (;;) {
    const fecha = `${a}-${String(m).padStart(2, '0')}-01`
    if (fecha > r.hasta) break
    if (fecha >= r.desde && (escala !== 'anio' || (m - 1) % 3 === 0)) {
      salida.push({ fecha, etiqueta: cerca(fecha) ? '' : MESES[m - 1]! })
    }
    m++
    if (m > 12) {
      m = 1
      a++
    }
  }
  return salida
}
