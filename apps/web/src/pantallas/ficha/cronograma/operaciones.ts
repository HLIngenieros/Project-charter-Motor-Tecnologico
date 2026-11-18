import {
  aDia,
  aISO,
  diasHabiles,
  MAX_NIVELES,
  sumarDias,
  sumarHabiles,
  type ActividadEntrada,
  type FechaISO,
} from '@charter/shared'

/**
 * Operaciones puras sobre la lista plana del cronograma. Todas devuelven una lista nueva en
 * preorden, con `orden` renumerado 0..n entre hermanas; si la operación no aplica, devuelven
 * la misma lista.
 */

type Hijas = Map<string | null, string[]>

function hijasDe(acts: ActividadEntrada[]): Hijas {
  const mapa: Hijas = new Map()
  for (const a of [...acts].sort((x, y) => x.orden - y.orden)) {
    const lista = mapa.get(a.padreId) ?? []
    lista.push(a.id)
    mapa.set(a.padreId, lista)
  }
  return mapa
}

/** Rearma la lista en preorden a partir del mapa de hijas y los datos por id. */
function rearmar(porId: Map<string, ActividadEntrada>, hijas: Hijas): ActividadEntrada[] {
  const salida: ActividadEntrada[] = []
  const visitar = (padreId: string | null) => {
    ;(hijas.get(padreId) ?? []).forEach((id, orden) => {
      const a = porId.get(id)
      if (!a) return
      salida.push({ ...a, padreId, orden })
      visitar(id)
    })
  }
  visitar(null)
  return salida
}

function nivelDe(porId: Map<string, ActividadEntrada>, id: string): number {
  let nivel = 1
  for (let p = porId.get(id)?.padreId ?? null; p; p = porId.get(p)?.padreId ?? null) nivel++
  return nivel
}

/** Niveles que ocupa el subárbol de `id` (1 si es hoja). */
function altura(hijas: Hijas, id: string): number {
  const h = hijas.get(id) ?? []
  return 1 + (h.length ? Math.max(...h.map((x) => altura(hijas, x))) : 0)
}

const porIdDe = (acts: ActividadEntrada[]) => new Map(acts.map((a) => [a.id, a]))

export function descendientes(acts: ActividadEntrada[], id: string): string[] {
  const hijas = hijasDe(acts)
  const salida: string[] = []
  const visitar = (p: string) =>
    (hijas.get(p) ?? []).forEach((h) => {
      salida.push(h)
      visitar(h)
    })
  visitar(id)
  return salida
}

/** Agrega una hermana vacía debajo de `despuesDe` (al final del primer nivel si es null). */
export function agregar(
  acts: ActividadEntrada[],
  despuesDe: string | null,
  id: string,
): ActividadEntrada[] {
  const porId = porIdDe(acts)
  const hijas = hijasDe(acts)
  const ref = despuesDe ? porId.get(despuesDe) : undefined
  const padreId = ref?.padreId ?? null
  const hermanas = [...(hijas.get(padreId) ?? [])]
  const pos = ref ? hermanas.indexOf(ref.id) + 1 : hermanas.length
  hermanas.splice(pos, 0, id)
  hijas.set(padreId, hermanas)
  porId.set(id, { id, padreId, orden: pos, nombre: '', responsables: [] })
  const salida = rearmar(porId, hijas)
  const i = salida.findIndex((a) => a.id === id)
  const predecesora = salida
    .slice(0, i)
    .filter((a) => a.fin && !salida.some((h) => h.padreId === a.id))
    .at(-1)
  if (!predecesora?.fin) return salida
  const inicio = habiles(predecesora.fin, 1)
  salida[i] = { ...salida[i]!, inicio, fin: habiles(inicio, DIAS_NUEVA - 1) }
  return salida
}

/** La vuelve la última hija de su hermana anterior. */
export function indentar(acts: ActividadEntrada[], id: string): ActividadEntrada[] {
  const porId = porIdDe(acts)
  const a = porId.get(id)
  if (!a) return acts
  const hijas = hijasDe(acts)
  const hermanas = hijas.get(a.padreId) ?? []
  const anterior = hermanas[hermanas.indexOf(id) - 1]
  if (!anterior) return acts
  if (nivelDe(porId, anterior) + altura(hijas, id) > MAX_NIVELES) return acts

  hijas.set(
    a.padreId,
    hermanas.filter((h) => h !== id),
  )
  hijas.set(anterior, [...(hijas.get(anterior) ?? []), id])
  return rearmar(porId, hijas)
}

/** La saca de nivel: queda como hermana siguiente de su padre. */
export function desindentar(acts: ActividadEntrada[], id: string): ActividadEntrada[] {
  const porId = porIdDe(acts)
  const a = porId.get(id)
  const padre = a?.padreId ? porId.get(a.padreId) : undefined
  if (!a || !padre) return acts
  const hijas = hijasDe(acts)
  hijas.set(
    padre.id,
    (hijas.get(padre.id) ?? []).filter((h) => h !== id),
  )
  const tias = [...(hijas.get(padre.padreId) ?? [])]
  tias.splice(tias.indexOf(padre.id) + 1, 0, id)
  hijas.set(padre.padreId, tias)
  return rearmar(porId, hijas)
}

export function mover(acts: ActividadEntrada[], id: string, delta: -1 | 1): ActividadEntrada[] {
  const a = acts.find((x) => x.id === id)
  if (!a) return acts
  const hijas = hijasDe(acts)
  const hermanas = [...(hijas.get(a.padreId) ?? [])]
  const i = hermanas.indexOf(id)
  const j = i + delta
  if (j < 0 || j >= hermanas.length) return acts
  ;[hermanas[i], hermanas[j]] = [hermanas[j]!, hermanas[i]!]
  hijas.set(a.padreId, hermanas)
  return rearmar(porIdDe(acts), hijas)
}

export function eliminar(acts: ActividadEntrada[], id: string): ActividadEntrada[] {
  const fuera = new Set([id, ...descendientes(acts, id)])
  const quedan = acts.filter((a) => !fuera.has(a.id))
  return rearmar(porIdDe(quedan), hijasDe(quedan))
}

export function editar(
  acts: ActividadEntrada[],
  id: string,
  cambios: Partial<Omit<ActividadEntrada, 'id' | 'padreId' | 'orden'>>,
): ActividadEntrada[] {
  return acts.map((a) => (a.id === id ? { ...a, ...cambios } : a))
}

/** Resultado de un cambio de fechas: cuántas hojas de abajo se corrieron y cuántos días hábiles. */
export interface CambioFechas {
  acts: ActividadEntrada[]
  corridas: number
  delta: number
}

/** Duración por defecto de una actividad nueva, en días hábiles. */
const DIAS_NUEVA = 5

const habiles = (f: FechaISO, n: number): FechaISO => aISO(sumarHabiles(aDia(f), n))

/** Días hábiles entre dos fechas, ambas incluidas; null sin fechas o con el fin antes del inicio. */
export function duracion(a: Pick<ActividadEntrada, 'inicio' | 'fin'>): number | null {
  if (!a.inicio || !a.fin || a.fin < a.inicio) return null
  return diasHabiles(aDia(a.inicio), aDia(a.fin))
}

/** Días hábiles con signo que hay que correr cuando el fin pasa de `de` a `a`. */
function deltaHabil(de: FechaISO, a: FechaISO): number {
  const x = aDia(de)
  const y = aDia(a)
  return y > x ? diasHabiles(x + 1, y) : -diasHabiles(y + 1, x)
}

/** Corre `delta` días hábiles cada hoja con fechas que esté después de `id` en preorden. */
export function correrDebajo(
  acts: ActividadEntrada[],
  id: string,
  delta: number,
): { acts: ActividadEntrada[]; corridas: number } {
  const i = acts.findIndex((a) => a.id === id)
  if (i < 0 || delta === 0) return { acts, corridas: 0 }
  const padres = new Set(acts.map((a) => a.padreId))
  let corridas = 0
  const salida = acts.map((a, j) => {
    if (j <= i || padres.has(a.id) || !a.inicio || !a.fin) return a
    corridas++
    return { ...a, inicio: habiles(a.inicio, delta), fin: habiles(a.fin, delta) }
  })
  return { acts: salida, corridas }
}

/** Aplica fechas nuevas; si el fin cambió, corre lo de abajo los mismos días hábiles. */
export function cambiarFechas(
  acts: ActividadEntrada[],
  id: string,
  cambios: { inicio?: FechaISO | null; fin?: FechaISO | null },
): CambioFechas {
  const a = acts.find((x) => x.id === id)
  if (!a) return { acts, corridas: 0, delta: 0 }
  const editadas = editar(acts, id, cambios)
  const nuevoFin = 'fin' in cambios ? cambios.fin : a.fin
  if (!a.fin || !nuevoFin || nuevoFin === a.fin) return { acts: editadas, corridas: 0, delta: 0 }
  const delta = deltaHabil(a.fin, nuevoFin)
  return { ...correrDebajo(editadas, id, delta), delta }
}

/** Fija la duración en días hábiles: recalcula el fin desde el inicio. */
export function fijarDias(acts: ActividadEntrada[], id: string, dias: number): CambioFechas {
  const a = acts.find((x) => x.id === id)
  if (!a?.inicio || !Number.isInteger(dias) || dias < 1) return { acts, corridas: 0, delta: 0 }
  return cambiarFechas(acts, id, { fin: habiles(a.inicio, dias - 1) })
}

/**
 * Desplaza la barra o uno de sus extremos (en días calendario, como el arrastre); el fin nunca
 * queda antes del inicio. Si el fin cambia, corre lo de abajo.
 */
export function moverFechas(
  acts: ActividadEntrada[],
  id: string,
  dias: number,
  extremo: 'ambos' | 'inicio' | 'fin',
): CambioFechas {
  const a = acts.find((x) => x.id === id)
  if (!a?.inicio || !a.fin || dias === 0) return { acts, corridas: 0, delta: 0 }
  let { inicio, fin } = a
  if (extremo !== 'fin') inicio = sumarDias(inicio, dias)
  if (extremo !== 'inicio') fin = sumarDias(fin, dias)
  if (extremo === 'inicio' && inicio > fin) inicio = fin
  if (extremo === 'fin' && fin < inicio) fin = inicio
  return cambiarFechas(acts, id, { inicio, fin })
}
