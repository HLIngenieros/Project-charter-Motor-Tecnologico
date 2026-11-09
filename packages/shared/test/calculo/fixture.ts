import { readFileSync } from 'node:fs'
import type { ActividadEntrada } from '../../src/calculo/tipos'

export interface FilaFixture {
  fila: number
  item: string
  nombre: string
  entregable: string | null
  peso: number | null
  inicio: string | null
  fin: string | null
  responsables: string[]
  padreFila: number | null
  esperado: { K: number | null; L: number | null }
}

export interface Fixture {
  corte: string
  filas: FilaFixture[]
}

export const fixture: Fixture = JSON.parse(
  readFileSync(new URL('../fixtures/id-ti.json', import.meta.url), 'utf-8'),
)

export const idDe = (fila: number) => `f${fila}`

/** Convierte el fixture del Excel a la entrada del motor (id = 'f' + fila). */
export function actividadesFixture(): ActividadEntrada[] {
  return fixture.filas.map((f) => ({
    id: idDe(f.fila),
    padreId: f.padreFila === null ? null : idDe(f.padreFila),
    orden: f.fila,
    nombre: f.nombre,
    entregable: f.entregable,
    peso: f.peso,
    inicio: f.inicio,
    fin: f.fin,
    responsables: f.responsables,
  }))
}
