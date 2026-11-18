import type { ActividadEntrada } from './tipos'

/**
 * Convierte pesos globales (escritos en las hojas, sobre el total del proyecto) a relativos:
 * cada agrupadora pesa la suma de sus hojas y cada actividad, su global ÷ el de su padre.
 * El global de cada hoja se conserva. Una hoja vacía queda vacía; una agrupadora sin hojas con
 * peso, también; bajo un padre en 0 nada cambia.
 */
export function aPesosRelativos(acts: ActividadEntrada[]): ActividadEntrada[] {
  const hijas = new Map<string | null, ActividadEntrada[]>()
  for (const a of acts) hijas.set(a.padreId, [...(hijas.get(a.padreId) ?? []), a])

  // Global de cada actividad: el de la hoja, o la suma de sus descendientes (null si no hay).
  const global = new Map<string, number | null>()
  const calcular = (a: ActividadEntrada): number | null => {
    const h = hijas.get(a.id) ?? []
    let g: number | null
    if (h.length === 0) g = a.peso ?? null
    else {
      const valores = h.map(calcular).filter((x): x is number => x !== null)
      g = valores.length ? valores.reduce((s, x) => s + x, 0) : null
    }
    global.set(a.id, g)
    return g
  }
  ;(hijas.get(null) ?? []).forEach(calcular)

  return acts.map((a) => {
    const g = global.get(a.id) ?? null
    if (g === null) return { ...a, peso: null }
    const padre = a.padreId === null ? 1 : (global.get(a.padreId) ?? null)
    if (!padre) return a
    return { ...a, peso: g / padre }
  })
}
