import { nivelRiesgo, type NivelRiesgo, type Riesgo } from '@charter/shared'
import type { TonoChip } from '../../../componentes/Chip'

/** Texto, tono del chip y colores de la matriz por nivel (tokens de DESIGN.md). */
export const NIVELES: Record<
  NivelRiesgo,
  { texto: string; plural: string; chip: TonoChip; casilla: string; punto: string }
> = {
  bajo: {
    texto: 'Bajo',
    plural: 'bajos',
    chip: 'al_dia',
    casilla: 'fill-ok-suave',
    punto: 'fill-ok',
  },
  medio: {
    texto: 'Medio',
    plural: 'medios',
    chip: 'en_atencion',
    casilla: 'fill-amarillo-suave',
    punto: 'fill-amarillo',
  },
  alto: {
    texto: 'Alto',
    plural: 'altos',
    chip: 'en_riesgo',
    casilla: 'fill-naranja-suave',
    punto: 'fill-naranja',
  },
  critico: {
    texto: 'Crítico',
    plural: 'críticos',
    chip: 'atrasada',
    casilla: 'fill-alerta-suave',
    punto: 'fill-alerta',
  },
}

/** Del más grave al más leve, para el resumen. */
const ORDEN: NivelRiesgo[] = ['critico', 'alto', 'medio', 'bajo']

export const ESCALA = [1, 2, 3, 4, 5] as const
export const ETIQUETAS_PROBABILIDAD = ['Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta']
export const ETIQUETAS_IMPACTO = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto']

/** «Alto · 12», o «Sin calificar» si falta probabilidad o impacto. */
export function textoNivel(r: Pick<Riesgo, 'probabilidad' | 'impacto'>): string {
  const c = nivelRiesgo(r.probabilidad, r.impacto)
  return c ? `${NIVELES[c.nivel].texto} · ${c.puntaje}` : 'Sin calificar'
}

/** «1 crítico · 2 altos · 1 sin calificar». */
export function resumenNiveles(riesgos: Pick<Riesgo, 'probabilidad' | 'impacto'>[]): string {
  const cuenta = new Map<NivelRiesgo | 'sin', number>()
  for (const r of riesgos) {
    const nivel = nivelRiesgo(r.probabilidad, r.impacto)?.nivel ?? 'sin'
    cuenta.set(nivel, (cuenta.get(nivel) ?? 0) + 1)
  }
  const partes = ORDEN.filter((n) => cuenta.has(n)).map((n) => {
    const c = cuenta.get(n)!
    return `${c} ${c === 1 ? NIVELES[n].texto.toLowerCase() : NIVELES[n].plural}`
  })
  if (cuenta.has('sin')) partes.push(`${cuenta.get('sin')} sin calificar`)
  return partes.join(' · ')
}

/** «1, 2 y 3». */
export function enumerar(numeros: number[]): string {
  if (numeros.length <= 1) return numeros.join('')
  return `${numeros.slice(0, -1).join(', ')} y ${numeros.at(-1)}`
}
