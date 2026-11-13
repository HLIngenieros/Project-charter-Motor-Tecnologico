import {
  aDia,
  type Estado,
  type FechaISO,
  type PuntoPlan,
  type PuntoReal,
  type Umbrales,
} from '@charter/shared'

export type Zoom = 'proyecto' | 'cortes'

/** Eje X en días (número de día) y techo del eje Y (fracción 0–1). */
export interface Dominio {
  desde: number
  hasta: number
  techo: number
}

const MARGEN_CORTES = 14
const ANCHO_MIN_CORTES = 42
const EPS = 1e-9

/** Valor de una serie ordenada en un día: interpolado entre puntos y fijo fuera de ella. */
export function valorEn(serie: PuntoPlan[], dia: number): number {
  if (serie.length === 0) return 0
  if (dia <= aDia(serie[0]!.fecha)) return serie[0]!.pv
  for (let i = 1; i < serie.length; i++) {
    const a = serie[i - 1]!
    const b = serie[i]!
    const da = aDia(a.fecha)
    const db = aDia(b.fecha)
    if (dia <= db) return db === da ? b.pv : a.pv + ((b.pv - a.pv) * (dia - da)) / (db - da)
  }
  return serie.at(-1)!.pv
}

export function dominio(
  planeada: PuntoPlan[],
  reales: PuntoReal[],
  proyeccion: PuntoPlan[],
  zoom: Zoom,
): Dominio {
  if (zoom === 'cortes' && reales.length > 0) {
    let desde = aDia(reales[0]!.fecha) - MARGEN_CORTES
    let hasta = aDia(reales.at(-1)!.fecha) + MARGEN_CORTES
    const falta = ANCHO_MIN_CORTES - (hasta - desde)
    if (falta > 0) {
      desde -= Math.ceil(falta / 2)
      hasta += Math.ceil(falta / 2)
    }
    const visibles = [
      ...planeada.filter((p) => aDia(p.fecha) >= desde && aDia(p.fecha) <= hasta).map((p) => p.pv),
      valorEn(planeada, hasta),
      ...reales.flatMap((r) => [r.pv, r.ev]),
    ]
    const techo = Math.min(1, Math.ceil((Math.max(...visibles) + 0.1) * 20 - EPS) / 20)
    return { desde, hasta, techo }
  }
  const dias = [...planeada, ...reales, ...proyeccion].map((p) => aDia(p.fecha))
  if (dias.length === 0) return { desde: 0, hasta: 1, techo: 1 }
  const desde = Math.min(...dias) - 4
  const hasta = Math.max(desde + ANCHO_MIN_CORTES, Math.max(...dias) + 8)
  return { desde, hasta, techo: 1 }
}

export function escalaX(d: Dominio, ancho: number): (fecha: FechaISO | number) => number {
  const largo = Math.max(1, d.hasta - d.desde)
  return (f) => (((typeof f === 'number' ? f : aDia(f)) - d.desde) / largo) * ancho
}

export function escalaY(d: Dominio, alto: number): (v: number) => number {
  return (v) => alto * (1 - v / d.techo)
}

const num = (n: number) => String(+n.toFixed(1))

export function trazo(puntos: { x: number; y: number }[]): string {
  return puntos.map((p, i) => `${i ? 'L' : 'M'}${num(p.x)} ${num(p.y)}`).join(' ')
}

/** Tramo i: entre el corte i − 1 (o el inicio de la planeada) y el corte i, con el color del corte i. */
export function tramosBrecha(
  planeada: PuntoPlan[],
  reales: PuntoReal[],
): { desde: FechaISO; hasta: FechaISO; estado: Estado }[] {
  return reales.map((r, i) => ({
    desde: i === 0 ? (planeada[0]?.fecha ?? r.fecha) : reales[i - 1]!.fecha,
    hasta: r.fecha,
    estado: r.estado,
  }))
}

/** Estado de una lectura que no es un corte (interpolada o proyectada). */
export function estadoPorBrecha(pv: number, ev: number, u: Umbrales): Estado {
  if (ev >= 1 - EPS) return 'terminada'
  if (pv <= EPS && ev <= EPS) return 'por_iniciar'
  const brecha = (pv - ev) * 100 + EPS
  if (brecha < u.atencion) return 'al_dia'
  if (brecha < u.riesgo) return 'en_atencion'
  if (brecha < u.atraso) return 'en_riesgo'
  return 'atrasada'
}

/** Ancho aproximado de una etiqueta de la curva (text-xs seminegrita). */
const anchoTexto = (texto: string) => texto.length * 6.2

/**
 * Texto de la etiqueta de fin (anclada a la derecha en `xFin`) que no choca con la del corte
 * (anclada a la izquierda en `corte.x`): el largo, el corto o ninguno.
 */
export function textoFin(
  corte: { x: number; texto: string } | null,
  xFin: number,
  largo: string,
  corto: string,
): string | null {
  if (!corte) return largo
  const libreDesde = corte.x + anchoTexto(corte.texto) + 6
  if (xFin - anchoTexto(largo) >= libreDesde) return largo
  if (xFin - anchoTexto(corto) >= libreDesde) return corto
  return null
}
