import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CharterDetalle, Indicador } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const base: CharterDetalle = {
  id: 'c1',
  nombre: 'Radicación de facturas',
  codigo: 'RF1',
  categoriaId: null,
  areaId: null,
  responsable: '',
  patrocinador: '',
  revision: '',
  razonDeSer: '',
  objetivoGeneral: '',
  estado: 'activo',
  creadoEn: '2026-11-01T15:00:00.000Z',
  actualizadoEn: '2026-11-01T15:00:00.000Z',
  propietario: { id: 'u1', nombre: 'Ana Pérez' },
  listas: { objetivo: [], supuesto: [], criterio_exito: [] },
  permisos: { editar: true, reabrir: false },
  reglas: REGLAS_POR_DEFECTO,
  indicadores: [],
  riesgos: [],
  rubros: [],
}

const indicador = (n: number, cambios: Partial<Indicador> = {}): Indicador => ({
  id: `0190a000-0000-7000-8000-00000000000${n}`,
  nombre: `Indicador ${n}`,
  formula: '',
  metaOperador: '>=',
  metaValor: null,
  metaUnidad: '',
  observaciones: '',
  ...cambios,
})

function abrir(indicadores: Indicador[] = [], editar = true) {
  const detalle: CharterDetalle = { ...base, indicadores, permisos: { editar, reabrir: false } }
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias' || l.url === '/api/areas' || l.url === '/api/charters')
      return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1' && l.metodo === 'GET') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/charters/c1/indicadores' && l.metodo === 'PUT')
      return { estado: 200, cuerpo: (l.cuerpo as { items: Indicador[] }).items }
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={['/charters/c1']}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return llamadas
}

const puts = (llamadas: Llamada[]) =>
  llamadas.filter((l) => l.metodo === 'PUT' && l.url === '/api/charters/c1/indicadores')
const items = (l: Llamada) => (l.cuerpo as { items: Indicador[] }).items
const seccion = () => screen.findByRole('region', { name: 'Indicadores' })
const indice = () => screen.getByRole('navigation', { name: 'Secciones del charter' })

describe('indicadores', () => {
  it('vacío invita a agregar y el índice muestra la sección', async () => {
    abrir()
    const s = await seccion()
    expect(within(s).getByText('Aún no hay indicadores.')).toBeInTheDocument()
    expect(within(s).getByRole('button', { name: 'Agregar indicador' })).toBeInTheDocument()
    expect(within(indice()).getByRole('link', { name: /Indicadores/ })).toHaveTextContent('0')
  })

  it('agregar uno, escribir nombre y meta y salir lo guarda', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const s = await seccion()
    await usuario.click(within(s).getByRole('button', { name: 'Agregar indicador' }))
    const nombre = within(s).getByRole('textbox', { name: 'Indicador 1' })
    expect(nombre).toHaveFocus()
    await usuario.type(nombre, 'Facturas sin intervención manual')
    await usuario.selectOptions(
      within(s).getByRole('combobox', { name: 'Operador de la meta 1' }),
      '>=',
    )
    await usuario.type(within(s).getByRole('textbox', { name: 'Valor de la meta 1' }), '90')
    await usuario.type(within(s).getByRole('textbox', { name: 'Unidad de la meta 1' }), '%')
    await usuario.click(document.body)
    await waitFor(() => {
      const ultimo = puts(llamadas).at(-1)
      expect(ultimo && items(ultimo)).toEqual([
        expect.objectContaining({
          nombre: 'Facturas sin intervención manual',
          metaOperador: '>=',
          metaValor: 90,
          metaUnidad: '%',
        }),
      ])
    })
    await waitFor(() =>
      expect(within(indice()).getByRole('link', { name: /Indicadores/ })).toHaveTextContent('1'),
    )
  })

  it('el valor de la meta acepta coma decimal y vacío vuelve a «sin meta»', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir([indicador(1, { metaValor: 5 })])
    const s = await seccion()
    const valor = within(s).getByRole('textbox', { name: 'Valor de la meta 1' })
    await usuario.clear(valor)
    await usuario.type(valor, '2,5')
    await usuario.click(document.body)
    await waitFor(() => expect(items(puts(llamadas).at(-1)!)[0]!.metaValor).toBe(2.5))
    await usuario.clear(valor)
    await usuario.click(document.body)
    await waitFor(() => expect(items(puts(llamadas).at(-1)!)[0]!.metaValor).toBeNull())
  })

  it('una fila agregada y dejada vacía desaparece sin guardar', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir([indicador(1)])
    const s = await seccion()
    await usuario.click(within(s).getByRole('button', { name: 'Agregar indicador' }))
    expect(within(s).getByRole('textbox', { name: 'Indicador 2' })).toHaveFocus()
    await usuario.tab()
    await usuario.click(document.body)
    await waitFor(() =>
      expect(within(s).queryByRole('textbox', { name: 'Indicador 2' })).not.toBeInTheDocument(),
    )
    expect(puts(llamadas)).toHaveLength(0)
  })

  it('subir y quitar guardan el nuevo orden', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir([indicador(1), indicador(2)])
    const s = await seccion()
    await usuario.click(within(s).getByRole('button', { name: 'Subir indicador 2' }))
    await waitFor(() =>
      expect(items(puts(llamadas).at(-1)!).map((i) => i.nombre)).toEqual([
        'Indicador 2',
        'Indicador 1',
      ]),
    )
    await usuario.click(within(s).getByRole('button', { name: 'Quitar indicador 1' }))
    await waitFor(() =>
      expect(items(puts(llamadas).at(-1)!).map((i) => i.nombre)).toEqual(['Indicador 1']),
    )
  })

  it('en solo lectura muestra la meta junta y «Sin meta»', async () => {
    abrir(
      [
        indicador(1, { metaValor: 90, metaUnidad: '%', formula: 'Radicadas / recibidas' }),
        indicador(2, { metaOperador: '<=' }),
        indicador(3, { nombre: '', formula: 'Algo', metaOperador: '=', metaValor: 1 }),
      ],
      false,
    )
    const s = await seccion()
    expect(within(s).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(s).getByText('≥ 90 %')).toBeInTheDocument()
    expect(within(s).getByText('Sin meta')).toBeInTheDocument()
    expect(within(s).getByText('Radicadas / recibidas')).toBeInTheDocument()
    expect(within(s).getByText('Sin descripción')).toBeInTheDocument()
    expect(within(s).queryByRole('button', { name: 'Agregar indicador' })).not.toBeInTheDocument()
  })
})
