import type { CharterResumen, Estado, FechaISO } from '@charter/shared'
import { diasEntre } from '../../formato'

export type Segmento = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'vencida' | 'neutro'

export const SEGMENTOS: Segmento[] = ['verde', 'amarillo', 'naranja', 'rojo', 'vencida', 'neutro']

/** Cómo se lee cada segmento tras el conteo: «Financiera: 2 en rojo». */
export const LECTURA_SEGMENTO: Record<Segmento, string> = {
  verde: 'al día',
  amarillo: 'en atención',
  naranja: 'en riesgo',
  rojo: 'en rojo',
  vencida: 'vencidos',
  neutro: 'sin corte o sin iniciar',
}

/** Nombre corto del segmento para el chip del filtro: «Financiera · rojo». */
export const NOMBRE_SEGMENTO: Record<Segmento, string> = {
  verde: 'verde',
  amarillo: 'amarillo',
  naranja: 'naranja',
  rojo: 'rojo',
  vencida: 'vencidos',
  neutro: 'sin corte',
}

const POR_ESTADO: Record<Estado, Segmento> = {
  al_dia: 'verde',
  terminada: 'verde',
  en_atencion: 'amarillo',
  en_riesgo: 'naranja',
  atrasada: 'rojo',
  vencida: 'vencida',
  por_iniciar: 'neutro',
  sin_programar: 'neutro',
}

/** Días sin corte a partir de los cuales un charter activo cuenta como «sin corte reciente». */
const DIAS_SIN_CORTE = 30

export type EjeTablero = 'area' | 'categoria'

export interface GrupoTablero {
  id: string | 'ninguna'
  nombre: string
  conteo: Record<Segmento, number>
  total: number
}

export interface Tablero {
  activos: number
  enRojo: number
  avance: { pv: number; ev: number } | null
  sinCorteReciente: number
  porArea: GrupoTablero[]
  porCategoria: GrupoTablero[]
}

/** Segmento del semáforo por el estado global del último corte. */
export function segmentoDe(c: CharterResumen): Segmento {
  return c.ultimoCorte ? POR_ESTADO[c.ultimoCorte.estado] : 'neutro'
}

export const SIN_GRUPO: Record<EjeTablero, string> = {
  area: 'Sin área',
  categoria: 'Sin categoría',
}

export function grupoDe(c: CharterResumen, eje: EjeTablero): { id: string; nombre: string } {
  const g = eje === 'area' ? c.area : c.categoria
  return g ? { id: g.id, nombre: g.nombre } : { id: 'ninguna', nombre: SIN_GRUPO[eje] }
}

function agrupar(activos: CharterResumen[], eje: EjeTablero): GrupoTablero[] {
  const grupos = new Map<string, GrupoTablero>()
  for (const c of activos) {
    const { id, nombre } = grupoDe(c, eje)
    let g = grupos.get(id)
    if (!g) {
      g = {
        id,
        nombre,
        conteo: { verde: 0, amarillo: 0, naranja: 0, rojo: 0, vencida: 0, neutro: 0 },
        total: 0,
      }
      grupos.set(id, g)
    }
    g.conteo[segmentoDe(c)]++
    g.total++
  }
  return [...grupos.values()].sort((a, b) =>
    a.id === 'ninguna' ? 1 : b.id === 'ninguna' ? -1 : a.nombre.localeCompare(b.nombre, 'es'),
  )
}

/** Cifras y semáforos del conjunto; solo cuentan los charters activos. */
export function calcularTablero(lista: CharterResumen[], hoy: FechaISO): Tablero {
  const activos = lista.filter((c) => c.estado === 'activo')
  const conCorte = activos.flatMap((c) => (c.ultimoCorte ? [c.ultimoCorte] : []))
  const promedio = (f: (x: (typeof conCorte)[number]) => number) =>
    conCorte.reduce((s, x) => s + f(x), 0) / conCorte.length
  return {
    activos: activos.length,
    enRojo: activos.filter((c) => {
      const s = segmentoDe(c)
      return s === 'rojo' || s === 'vencida'
    }).length,
    avance: conCorte.length ? { pv: promedio((x) => x.pv), ev: promedio((x) => x.ev) } : null,
    sinCorteReciente: activos.filter(
      (c) => !c.ultimoCorte || diasEntre(c.ultimoCorte.fecha, hoy) > DIAS_SIN_CORTE,
    ).length,
    porArea: agrupar(activos, 'area'),
    porCategoria: agrupar(activos, 'categoria'),
  }
}
