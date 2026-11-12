import type { CharterResumen, Estado } from '@charter/shared'
import { sumarDias } from '@charter/shared'
import { describe, expect, it } from 'vitest'
import { calcularTablero, segmentoDe } from '../src/pantallas/portafolio/datosTablero'

const HOY = '2026-11-12'

function charter(p: Partial<CharterResumen> & { id: string }): CharterResumen {
  return {
    nombre: p.id,
    codigo: null,
    responsable: 'Ana',
    estado: 'activo',
    categoria: null,
    area: null,
    propietario: { id: 'u1', nombre: 'Ana' },
    actualizadoEn: '2026-11-01T10:00:00.000Z',
    ultimoCorte: null,
    cortes: [],
    ...p,
  }
}

function conCorte(
  id: string,
  estado: Estado,
  extra: Partial<CharterResumen> = {},
  pv = 0.5,
  ev = 0.4,
) {
  return charter({ id, ultimoCorte: { fecha: HOY, pv, ev, estado, vencidas: 0 }, ...extra })
}

const financiera = { id: 'a-fin', nombre: 'Financiera', activa: true }
const obras = { id: 'a-obr', nombre: 'Obras', activa: true }

describe('segmentoDe', () => {
  it('mapea los 8 estados y el sin corte', () => {
    const esperado: Record<Estado, string> = {
      al_dia: 'verde',
      terminada: 'verde',
      en_atencion: 'amarillo',
      en_riesgo: 'naranja',
      atrasada: 'rojo',
      vencida: 'vencida',
      por_iniciar: 'neutro',
      sin_programar: 'neutro',
    }
    for (const [estado, segmento] of Object.entries(esperado))
      expect(segmentoDe(conCorte('x', estado as Estado))).toBe(segmento)
    expect(segmentoDe(charter({ id: 'y' }))).toBe('neutro')
  })
})

describe('calcularTablero', () => {
  it('solo cuenta los charters activos', () => {
    const t = calcularTablero(
      [
        conCorte('a', 'atrasada'),
        conCorte('b', 'atrasada', { estado: 'cerrado' }),
        conCorte('c', 'vencida', { estado: 'pausado' }),
        conCorte('d', 'vencida'),
      ],
      HOY,
    )
    expect(t.activos).toBe(2)
    expect(t.enRojo).toBe(2)
  })

  it('el avance es el promedio simple y null sin cortes', () => {
    const t = calcularTablero(
      [
        conCorte('a', 'al_dia', {}, 0.4, 0.2),
        conCorte('b', 'al_dia', {}, 0.8, 0.6),
        charter({ id: 'c' }),
      ],
      HOY,
    )
    expect(t.avance!.ev).toBeCloseTo(0.4)
    expect(t.avance!.pv).toBeCloseTo(0.6)
    expect(calcularTablero([charter({ id: 'c' })], HOY).avance).toBeNull()
  })

  it('sin corte reciente: sin corte o de hace más de 30 días', () => {
    const viejo = (id: string, dias: number) =>
      charter({
        id,
        ultimoCorte: { fecha: sumarDias(HOY, -dias), pv: 0, ev: 0, estado: 'al_dia', vencidas: 0 },
      })
    const t = calcularTablero([viejo('a', 31), viejo('b', 30), charter({ id: 'c' })], HOY)
    expect(t.sinCorteReciente).toBe(2)
  })

  it('agrupa por área con «Sin área» al final y los segmentos suman el total', () => {
    const t = calcularTablero(
      [
        conCorte('a', 'atrasada', { area: obras }),
        conCorte('b', 'al_dia', { area: financiera }),
        conCorte('c', 'atrasada', { area: financiera }),
        charter({ id: 'd' }),
        conCorte('e', 'atrasada', { area: obras, estado: 'cancelado' }),
      ],
      HOY,
    )
    expect(t.porArea.map((g) => g.nombre)).toEqual(['Financiera', 'Obras', 'Sin área'])
    expect(t.porArea[2]!.id).toBe('ninguna')
    expect(t.porArea[0]!.conteo.rojo).toBe(1)
    expect(t.porArea[0]!.conteo.verde).toBe(1)
    for (const g of [...t.porArea, ...t.porCategoria])
      expect(Object.values(g.conteo).reduce((s, n) => s + n, 0)).toBe(g.total)
    expect(t.porCategoria.map((g) => g.nombre)).toEqual(['Sin categoría'])
    expect(t.porCategoria[0]!.total).toBe(4)
  })
})
