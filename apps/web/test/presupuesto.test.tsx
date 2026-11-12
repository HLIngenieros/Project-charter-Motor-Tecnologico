import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CharterDetalle, Rubro } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { leerPesos, pesos } from '../src/formato'
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

const rubro = (n: number, cambios: Partial<Rubro> = {}): Rubro => ({
  id: `0190a000-0000-7000-8000-00000000000${n}`,
  descripcion: `Rubro ${n}`,
  valor: 0,
  lineas: [],
  ...cambios,
})

function abrir(rubros: Rubro[] = [], editar = true) {
  const detalle: CharterDetalle = { ...base, rubros, permisos: { editar, reabrir: false } }
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias' || l.url === '/api/areas' || l.url === '/api/charters')
      return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1' && l.metodo === 'GET') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/charters/c1/presupuesto' && l.metodo === 'PUT')
      return { estado: 200, cuerpo: (l.cuerpo as { rubros: Rubro[] }).rubros }
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
  llamadas.filter((l) => l.metodo === 'PUT' && l.url === '/api/charters/c1/presupuesto')
const rubrosDe = (l: Llamada) => (l.cuerpo as { rubros: Rubro[] }).rubros
const seccion = () => screen.findByRole('region', { name: 'Presupuesto' })
const barras = (s: HTMLElement) => [...s.querySelectorAll<HTMLElement>('[data-barra]')]

describe('formato de pesos', () => {
  it('escribe y lee pesos', () => {
    expect(pesos(182000000)).toBe('182.000.000')
    expect(leerPesos('182.000.000')).toBe(182000000)
    expect(leerPesos('182000000')).toBe(182000000)
    expect(leerPesos('')).toBe(0)
    expect(leerPesos('abc')).toBeNull()
  })
})

describe('presupuesto', () => {
  it('vacío invita a agregar', async () => {
    abrir()
    const s = await seccion()
    expect(within(s).getByText('Aún no hay presupuesto.')).toBeInTheDocument()
    expect(within(s).getByRole('button', { name: 'Agregar rubro' })).toBeInTheDocument()
  })

  it('dos rubros dan el total y barras relativas al mayor', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const s = await seccion()
    for (const [texto, valor] of [
      ['Horas internas', '96.000.000'] as const,
      ['Licencias', '40000000'] as const,
    ]) {
      await usuario.click(within(s).getByRole('button', { name: 'Agregar rubro' }))
      const n = within(s).getAllByRole('textbox', { name: /^Rubro \d$/ }).length
      await usuario.type(within(s).getByRole('textbox', { name: `Rubro ${n}` }), texto)
      await usuario.type(within(s).getByRole('textbox', { name: `Valor del rubro ${n}` }), valor)
    }
    await usuario.click(document.body)
    expect(await within(s).findByText('COP 136.000.000')).toBeInTheDocument()
    const [mayor, menor] = barras(s)
    expect(mayor!.style.width).toBe('100%')
    expect(menor!.style.width).toBe('41.67%')
    await waitFor(() =>
      expect(rubrosDe(puts(llamadas).at(-1)!).map((r) => r.valor)).toEqual([96000000, 40000000]),
    )
  })

  it('el desglose calcula el valor y al quitarlo queda editable', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir([rubro(1)])
    const s = await seccion()
    const boton = within(s).getByRole('button', { name: 'Desglose del rubro 1' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    await usuario.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    await usuario.click(within(s).getByRole('button', { name: 'Agregar línea' }))
    const concepto = within(s).getByRole('textbox', { name: 'Concepto de la línea 1 del rubro 1' })
    expect(concepto).toHaveFocus()
    await usuario.type(concepto, 'Horas')
    await usuario.type(
      within(s).getByRole('textbox', { name: 'Cantidad de la línea 1 del rubro 1' }),
      '2,5',
    )
    await usuario.type(
      within(s).getByRole('textbox', { name: 'Valor unitario de la línea 1 del rubro 1' }),
      '3333',
    )
    expect(within(s).queryByRole('textbox', { name: 'Valor del rubro 1' })).toBeNull()
    expect(within(s).getByLabelText('Valor del rubro 1')).toHaveTextContent('8.333')
    await usuario.click(document.body)
    await waitFor(() => {
      const ultimo = rubrosDe(puts(llamadas).at(-1)!)[0]!
      expect(ultimo.lineas).toMatchObject([
        { concepto: 'Horas', cantidad: 2.5, valorUnitario: 3333 },
      ])
      expect(ultimo.valor).toBe(8333)
    })
    await usuario.click(within(s).getByRole('button', { name: 'Quitar línea 1 del rubro 1' }))
    expect(within(s).getByRole('textbox', { name: 'Valor del rubro 1' })).toHaveValue('8.333')
  })

  it('una línea vacía desaparece al salir del rubro', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir([rubro(1, { valor: 5000 })])
    const s = await seccion()
    await usuario.click(within(s).getByRole('button', { name: 'Desglose del rubro 1' }))
    await usuario.click(within(s).getByRole('button', { name: 'Agregar línea' }))
    await usuario.click(document.body)
    expect(within(s).queryByRole('textbox', { name: /Concepto de la línea/ })).toBeNull()
    expect(within(s).getByRole('textbox', { name: 'Valor del rubro 1' })).toHaveValue('5.000')
    expect(puts(llamadas)).toHaveLength(0)
  })

  it('solo lectura muestra barras y desglose sin campos', async () => {
    const usuario = userEvent.setup()
    abrir(
      [
        rubro(1, {
          valor: 8333,
          lineas: [{ id: 'l1', concepto: 'Horas', cantidad: 2.5, valorUnitario: 3333 }],
        }),
        rubro(2, { valor: 5000 }),
      ],
      false,
    )
    const s = await seccion()
    expect(within(s).queryAllByRole('textbox')).toHaveLength(0)
    expect(within(s).getByText('COP 13.333')).toBeInTheDocument()
    expect(barras(s)).toHaveLength(2)
    await usuario.click(within(s).getByRole('button', { name: 'Desglose del rubro 1' }))
    const desglose = within(s).getByRole('list', { name: 'Desglose del rubro 1' })
    expect(within(desglose).getByText('Horas')).toBeInTheDocument()
    expect(within(desglose).getByText('3.333')).toBeInTheDocument()
  })
})
