import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import type { ActividadEntrada } from '../../src/calculo/tipos'
import { resumenPesos, validarCronograma } from '../../src/calculo/validacion'
import { actividadesFixture } from './fixture'

const hoja = (id: string, extra: Partial<ActividadEntrada> = {}): ActividadEntrada => ({
  id,
  padreId: null,
  orden: 1,
  nombre: id,
  peso: 0.5,
  inicio: '2025-03-01',
  fin: '2025-03-10',
  ...extra,
})

const codigos = (actividades: ActividadEntrada[]) =>
  validarCronograma(construirArbol(actividades)).map((a) => a.codigo)

describe('validarCronograma', () => {
  it('avisa si los pesos no suman 100 %', () => {
    const avisos = validarCronograma(
      construirArbol([hoja('a'), hoja('b', { orden: 2, peso: 0.4 })]),
    )
    expect(avisos.map((a) => a.codigo)).toEqual(['pesos_no_suman_100'])
    expect(avisos[0]!.mensaje).toContain('90')
  })

  it('no avisa si los pesos suman 100 % con error de redondeo', () => {
    expect(
      codigos([
        hoja('a', { peso: 0.1 }),
        hoja('b', { orden: 2, peso: 0.2 }),
        hoja('c', { orden: 3, peso: 0.7 }),
      ]),
    ).toEqual([])
  })

  it('avisa si el fin es anterior al inicio', () => {
    const avisos = validarCronograma(
      construirArbol([hoja('a', { peso: 1 }), hoja('b', { orden: 2, peso: 0, fin: '2025-02-01' })]),
    )
    expect(avisos).toContainEqual(
      expect.objectContaining({ codigo: 'fin_antes_de_inicio', actividadId: 'b' }),
    )
  })

  it('avisa los nombres vacíos', () => {
    expect(codigos([hoja('a', { peso: 1, nombre: '  ' })])).toEqual(['nombre_vacio'])
  })

  it('el fixture del Excel solo da los 6 avisos de hojas sin programar', () => {
    const avisos = validarCronograma(construirArbol(actividadesFixture()))
    expect(avisos).toHaveLength(6)
    expect(avisos.every((a) => a.codigo === 'sin_programar' && a.actividadId)).toBe(true)
  })
})

describe('pesos por grupo', () => {
  const grupo = (id: string, peso: number | null, orden = 1): ActividadEntrada => ({
    id,
    padreId: null,
    orden,
    nombre: id,
    peso,
  })
  const arbol = (pesoB: number) =>
    construirArbol([
      grupo('G', 1),
      hoja('a', { padreId: 'G', peso: 0.5 }),
      hoja('b', { padreId: 'G', orden: 2, peso: pesoB }),
    ])

  it('avisa cuando a las subactividades de un grupo les falta peso', () => {
    const avisos = validarCronograma(arbol(0.4))
    const g = avisos.find((a) => a.codigo === 'pesos_grupo')
    expect(g?.actividadId).toBe('G')
    expect(g?.mensaje).toBe('Las subactividades de 1 suman 90 %; falta 10 %.')
    expect(avisos.some((a) => a.codigo === 'pesos_no_suman_100')).toBe(false)
  })

  it('avisa cuando sobra', () => {
    const g = validarCronograma(arbol(0.55)).find((a) => a.codigo === 'pesos_grupo')
    expect(g?.mensaje).toBe('Las subactividades de 1 suman 105 %; sobra 5 %.')
  })

  it('un árbol completo no da avisos de pesos', () => {
    expect(validarCronograma(arbol(0.5)).filter((a) => a.codigo.startsWith('pesos'))).toEqual([])
  })

  it('el aviso del primer nivel habla de las actividades del primer nivel', () => {
    const a = validarCronograma(construirArbol([hoja('a'), hoja('b', { orden: 2, peso: 0.4 })]))
    expect(a[0]!.mensaje).toBe(
      'Las actividades del primer nivel suman 90 % y deberían sumar 100 %.',
    )
  })

  it('resumenPesos lista solo los grupos incompletos', () => {
    expect(resumenPesos(arbol(0.5))).toEqual({ proyecto: 1, grupos: [] })
    const r = resumenPesos(arbol(0.4))
    expect(r.proyecto).toBeCloseTo(1, 9)
    expect(r.grupos).toHaveLength(1)
    expect(r.grupos[0]).toMatchObject({ id: 'G', item: '1', nombre: 'G' })
    expect(r.grupos[0]!.suma).toBeCloseTo(0.9, 9)
  })
})
