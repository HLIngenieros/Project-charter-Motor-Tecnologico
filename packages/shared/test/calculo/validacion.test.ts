import { describe, expect, it } from 'vitest'
import { construirArbol } from '../../src/calculo/arbol'
import type { ActividadEntrada } from '../../src/calculo/tipos'
import { validarCronograma } from '../../src/calculo/validacion'
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
