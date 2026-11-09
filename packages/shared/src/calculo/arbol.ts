import type { ActividadEntrada, NodoArbol } from './tipos'

/**
 * Arma el árbol de actividades. Devuelve las raíces ordenadas por `orden`
 * y numera cada nodo por su posición ('1', '1.2', '1.2.3').
 */
export function construirArbol(actividades: ActividadEntrada[]): NodoArbol[] {
  const nodos = new Map<string, NodoArbol>()
  for (const a of actividades) {
    nodos.set(a.id, { ...a, item: '', nivel: 0, esHoja: true, hijos: [] })
  }

  const raices: NodoArbol[] = []
  for (const nodo of nodos.values()) {
    if (nodo.padreId === null) {
      raices.push(nodo)
      continue
    }
    const padre = nodos.get(nodo.padreId)
    if (!padre) throw new Error('padre_inexistente')
    padre.hijos.push(nodo)
  }

  let visitados = 0
  const numerar = (hermanos: NodoArbol[], prefijo: string, nivel: number) => {
    hermanos.sort((x, y) => x.orden - y.orden)
    hermanos.forEach((n, i) => {
      visitados++
      n.item = prefijo ? `${prefijo}.${i + 1}` : String(i + 1)
      n.nivel = nivel
      n.esHoja = n.hijos.length === 0
      numerar(n.hijos, n.item, nivel + 1)
    })
  }
  numerar(raices, '', 1)

  // Los nodos de un ciclo no son alcanzables desde ninguna raíz.
  if (visitados !== nodos.size) throw new Error('ciclo')
  return raices
}

/** Hojas en orden de recorrido (preorden). */
export function recorrerHojas(raices: NodoArbol[]): NodoArbol[] {
  return raices.flatMap((n) => (n.esHoja ? [n] : recorrerHojas(n.hijos)))
}
