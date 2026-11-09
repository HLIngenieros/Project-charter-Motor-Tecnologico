import type { CharterResumen, EstadoCharter } from '@charter/shared'

export interface FiltrosPortafolio {
  texto: string
  /** `'todas'`, `'ninguna'` (sin categoría) o el id de una categoría. */
  categoria: 'todas' | 'ninguna' | (string & {})
  area: 'todas' | (string & {})
  estado: 'todos' | EstadoCharter | 'sin_cortes'
}

export const FILTROS_VACIOS: FiltrosPortafolio = {
  texto: '',
  categoria: 'todas',
  area: 'todas',
  estado: 'todos',
}

/** Minúsculas y sin tildes, para comparar textos. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function hayFiltros(f: FiltrosPortafolio): boolean {
  return (
    f.texto.trim() !== '' || f.categoria !== 'todas' || f.area !== 'todas' || f.estado !== 'todos'
  )
}

export function filtrarCharters(lista: CharterResumen[], f: FiltrosPortafolio): CharterResumen[] {
  const q = normalizar(f.texto)
  return lista.filter((c) => {
    if (q && !normalizar(`${c.nombre} ${c.codigo ?? ''} ${c.responsable}`).includes(q)) return false
    if (
      f.categoria === 'ninguna'
        ? c.categoria !== null
        : f.categoria !== 'todas' && c.categoria?.id !== f.categoria
    )
      return false
    if (f.area !== 'todas' && c.area?.id !== f.area) return false
    if (f.estado === 'sin_cortes') return c.ultimoCorte === null
    if (f.estado !== 'todos' && c.estado !== f.estado) return false
    return true
  })
}
