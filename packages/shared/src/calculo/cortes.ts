import { construirArbol, recorrerHojas } from './arbol'
import { calcularCronograma, type AvancesPorHoja, type ResultadoNodo } from './cronograma'
import { aDia } from './fechas'
import { pesosEfectivos, REGLAS_POR_DEFECTO, type Reglas } from './reglas'
import type { FechaISO, NodoArbol } from './tipos'

const EPS = 1e-9

/** Fila de la foto de un corte: la hoja tal como estaba en la línea base al registrarlo. */
export interface FilaFoto {
  actividadId: string
  item: string
  nombre: string
  pct: number
  peso: number | null
  inicio: FechaISO | null
  fin: FechaISO | null
}

/**
 * Hojas con peso efectivo > 0 y fechas válidas: las únicas que entran en un corte. Cada una
 * lleva en `peso` su peso efectivo (el repartido, si la regla lo reparte).
 */
export function hojasProgramadas(
  raices: NodoArbol[],
  reglas: Reglas = REGLAS_POR_DEFECTO,
): NodoArbol[] {
  const pesos = pesosEfectivos(raices, reglas.sinPeso)
  return recorrerHojas(raices)
    .map((h) => ({ ...h, peso: pesos[h.id]?.peso ?? 0 }))
    .filter((h) => h.peso > 0 && !!h.inicio && !!h.fin && aDia(h.fin) >= aDia(h.inicio))
}

/** Fecha del primer corte en que cada hoja llegó al 100 %. */
export function terminacionesPorHoja(
  cortes: { fecha: FechaISO; avances: { actividadId: string; pct: number }[] }[],
): Record<string, FechaISO> {
  const fechas: Record<string, FechaISO> = {}
  for (const c of [...cortes].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const a of c.avances) {
      if (a.pct >= 1 - EPS && !(a.actividadId in fechas)) fechas[a.actividadId] = c.fecha
    }
  }
  return fechas
}

/** Cada fila de la foto como raíz suelta: el proyecto pondera sobre las hojas, así que basta. */
export function raicesDeFoto(foto: FilaFoto[]): NodoArbol[] {
  return construirArbol(
    foto.map((f, i) => ({
      id: f.actividadId,
      padreId: null,
      orden: i,
      nombre: f.nombre,
      peso: f.peso,
      inicio: f.inicio,
      fin: f.fin,
    })),
  )
}

/**
 * Totales del proyecto con la foto de un corte. Cada fila va como raíz suelta: el proyecto
 * pondera sobre las hojas, así que da lo mismo que el árbol completo.
 */
export function totalesDeFoto(
  foto: FilaFoto[],
  fecha: FechaISO,
  terminadas: Record<string, FechaISO> = {},
  reglas: Reglas = REGLAS_POR_DEFECTO,
): ResultadoNodo {
  const raices = raicesDeFoto(foto)
  const avances: AvancesPorHoja = Object.fromEntries(
    foto.map((f) => [
      f.actividadId,
      { pct: f.pct, terminadaEn: terminadas[f.actividadId] ?? null },
    ]),
  )
  return calcularCronograma(raices, avances, fecha, reglas).proyecto
}
