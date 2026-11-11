import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import { calcularCronograma, type AvancesPorHoja } from '../../src/calculo/cronograma'
import {
  pesosCompletos,
  pesosEfectivos,
  REGLAS_POR_DEFECTO,
  type Reglas,
} from '../../src/calculo/reglas'
import type { ActividadEntrada } from '../../src/calculo/tipos'
import { validarCronograma } from '../../src/calculo/validacion'
import { reglasEntrada } from '../../src/esquemas/reglas'
import { actividadesFixture, fixture, idDe } from './fixture'

const hoja = (id: string, extra: Partial<ActividadEntrada> = {}): ActividadEntrada => ({
  id,
  padreId: 'g',
  orden: 0,
  nombre: id,
  inicio: '2026-03-01',
  fin: '2026-03-10',
  ...extra,
})
const grupo: ActividadEntrada = { id: 'g', padreId: null, orden: 0, nombre: 'Grupo' }
const reglas = (r: Partial<Reglas>): Reglas => ({ ...REGLAS_POR_DEFECTO, ...r })

describe('reglas del motor', () => {
  it('con las reglas por defecto el Excel da 12,51 % / 12,47 %', () => {
    const raices = construirArbol(actividadesFixture())
    const avances: AvancesPorHoja = Object.fromEntries(
      fixture.filas.map((f) => [idDe(f.fila), { pct: f.esperado.L ?? 0 }]),
    )
    const r = calcularCronograma(raices, avances, fixture.corte, REGLAS_POR_DEFECTO)
    expect(r.proyecto.pv).toBeCloseTo(0.1251, 4)
    expect(r.proyecto.ev).toBeCloseTo(0.1247, 4)
    expect(REGLAS_POR_DEFECTO).toEqual({
      sumaPesos: 'aviso',
      sinPeso: 'fuera',
      umbrales: { atencion: 10, riesgo: 25, atraso: 50 },
      reparto: 'calendario',
      proyeccion: 'desviacion',
      diasGracia: 0,
    })
  })

  it('repartir: las hojas con peso vacío se reparten lo que falta; el 0 escrito no', () => {
    const raices = construirArbol([
      grupo,
      hoja('a', { peso: 0.3 }),
      hoja('b', { orden: 1, peso: 0.3 }),
      hoja('c', { orden: 2, peso: null }),
      hoja('d', { orden: 3 }),
      hoja('e', { orden: 4, peso: 0 }),
      hoja('f', { orden: 5, inicio: null, fin: null }),
    ])
    const p = pesosEfectivos(raices, 'repartir')
    expect(p.c!.peso).toBeCloseTo(0.2, 9)
    expect(p.c!.auto).toBe(true)
    expect(p.d!.peso).toBeCloseTo(0.2, 9)
    expect(p.d!.auto).toBe(true)
    expect(p.e).toEqual({ peso: 0, auto: false })
    expect(p.f?.peso ?? 0).toBe(0)
    expect(pesosEfectivos(raices, 'fuera').c).toEqual({ peso: 0, auto: false })
  })

  it('repartir con pesos que ya suman más de 100 % deja las vacías en 0', () => {
    const raices = construirArbol([
      grupo,
      hoja('a', { peso: 0.6 }),
      hoja('b', { orden: 1, peso: 0.5 }),
      hoja('c', { orden: 2 }),
    ])
    expect(pesosEfectivos(raices, 'repartir').c!.peso).toBe(0)
    const r = calcularCronograma(
      raices,
      { a: { pct: 1 } },
      '2026-03-05',
      reglas({ sinPeso: 'repartir' }),
    )
    expect(r.nodos.c!.estado).toBe('sin_programar')
    expect(r.proyecto.ev).toBeCloseTo(0.6 / 1.1, 9)
  })

  it('calcularCronograma marca el peso repartido', () => {
    const raices = construirArbol([grupo, hoja('a', { peso: 0.5 }), hoja('b', { orden: 1 })])
    const r = calcularCronograma(raices, {}, '2026-03-05', reglas({ sinPeso: 'repartir' }))
    expect(r.nodos.b).toMatchObject({ peso: 0.5, pesoAuto: true })
    expect(r.nodos.a!.pesoAuto).toBe(false)
  })

  it('días de gracia: vencida solo después de fin + gracia', () => {
    const raices = construirArbol([grupo, hoja('a', { peso: 1 })])
    const r = (fecha: string) =>
      calcularCronograma(raices, { a: { pct: 0.5 } }, fecha, reglas({ diasGracia: 3 }))
    expect(r('2026-03-12').nodos.a!.estado).not.toBe('vencida')
    expect(r('2026-03-12').nodos.g!.vencidas).toBe(0)
    expect(r('2026-03-14').nodos.a!.estado).toBe('vencida')
    expect(r('2026-03-14').nodos.g!.vencidas).toBe(1)
  })

  it('pesosCompletos cuenta los pesos efectivos', () => {
    const arbol = (b: number | null) =>
      construirArbol([grupo, hoja('a', { peso: 0.5 }), hoja('b', { orden: 1, peso: b })])
    expect(pesosCompletos(arbol(0.5), REGLAS_POR_DEFECTO)).toBe(true)
    expect(pesosCompletos(arbol(0.4), REGLAS_POR_DEFECTO)).toBe(false)
    const tres = construirArbol([
      grupo,
      hoja('a', { peso: 0.5 }),
      hoja('b', { orden: 1, peso: 0.4 }),
      hoja('c', { orden: 2 }),
    ])
    expect(pesosCompletos(tres, REGLAS_POR_DEFECTO)).toBe(false)
    expect(pesosCompletos(tres, reglas({ sinPeso: 'repartir' }))).toBe(true)
  })

  it('validarCronograma con suma obligatoria lo dice en el aviso', () => {
    const raices = construirArbol([
      grupo,
      hoja('a', { peso: 0.5 }),
      hoja('b', { orden: 1, peso: 0.4 }),
    ])
    const aviso = validarCronograma(raices, reglas({ sumaPesos: 'obligatoria' })).find(
      (a) => a.codigo === 'pesos_no_suman_100',
    )!
    expect(aviso.mensaje.endsWith('Debes completarlos para registrar un corte.')).toBe(true)
    const repartido = construirArbol([grupo, hoja('a', { peso: 0.5 }), hoja('b', { orden: 1 })])
    expect(
      validarCronograma(repartido, reglas({ sinPeso: 'repartir' })).some(
        (a) => a.codigo === 'pesos_no_suman_100' || a.codigo === 'sin_programar',
      ),
    ).toBe(false)
  })

  it('reglasEntrada valida el orden de los umbrales y los días de gracia', () => {
    const malo = reglasEntrada.safeParse(
      reglas({ umbrales: { atencion: 25, riesgo: 10, atraso: 50 } }),
    )
    expect(malo.success).toBe(false)
    expect(malo.error?.issues[0]?.message).toBe(
      'Los umbrales deben ir de menor a mayor: atención, riesgo, atraso.',
    )
    expect(reglasEntrada.safeParse(reglas({ diasGracia: 1.5 })).success).toBe(false)
    expect(reglasEntrada.safeParse(REGLAS_POR_DEFECTO).success).toBe(true)
  })
})
