import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CharterDetalle, Riesgo } from '@charter/shared'
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

const riesgo = (n: number, cambios: Partial<Riesgo> = {}): Riesgo => ({
  id: `0190a000-0000-7000-8000-0000000000${String(n).padStart(2, '0')}`,
  riesgo: `Riesgo ${n}`,
  causa: '',
  mitigacion: '',
  probabilidad: null,
  impacto: null,
  ...cambios,
})

function abrir(riesgos: Riesgo[] = [], editar = true) {
  const detalle: CharterDetalle = { ...base, riesgos, permisos: { editar, reabrir: false } }
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias' || l.url === '/api/areas' || l.url === '/api/charters')
      return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1' && l.metodo === 'GET') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/charters/c1/riesgos' && l.metodo === 'PUT')
      return { estado: 200, cuerpo: (l.cuerpo as { items: Riesgo[] }).items }
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
  llamadas.filter((l) => l.metodo === 'PUT' && l.url === '/api/charters/c1/riesgos')
const items = (l: Llamada) => (l.cuerpo as { items: Riesgo[] }).items
const seccion = () => screen.findByRole('region', { name: 'Riesgos' })
const matriz = (s: HTMLElement) =>
  within(s).getByRole('group', { name: /Matriz de probabilidad e impacto/ })
const puntos = (s: HTMLElement) => within(s).queryAllByRole('img', { name: /^Riesgo \d+:/ })

describe('riesgos', () => {
  it('calificar un riesgo lo guarda, muestra el nivel y lo pone en la matriz', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const s = await seccion()
    await usuario.click(within(s).getByRole('button', { name: 'Agregar riesgo' }))
    const texto = within(s).getByRole('textbox', { name: 'Riesgo 1' })
    expect(texto).toHaveFocus()
    await usuario.type(texto, 'Facturas sin orden de compra')
    await usuario.selectOptions(
      within(s).getByRole('combobox', { name: 'Probabilidad del riesgo 1' }),
      '4',
    )
    await usuario.selectOptions(
      within(s).getByRole('combobox', { name: 'Impacto del riesgo 1' }),
      '3',
    )
    await waitFor(() =>
      expect(items(puts(llamadas).at(-1)!)).toEqual([
        expect.objectContaining({
          riesgo: 'Facturas sin orden de compra',
          probabilidad: 4,
          impacto: 3,
        }),
      ]),
    )
    expect(within(s).getByText('Alto · 12')).toBeInTheDocument()
    expect(
      within(matriz(s)).getByRole('img', {
        name: 'Riesgo 1: Facturas sin orden de compra, probabilidad 4, impacto 3, nivel alto',
      }),
    ).toBeInTheDocument()
    expect(within(s).getByText('1 alto')).toBeInTheDocument()
  })

  it('un riesgo sin impacto queda «Sin calificar» y fuera de la matriz', async () => {
    abrir([riesgo(1, { probabilidad: 4, impacto: 3 }), riesgo(2, { probabilidad: 2 })])
    const s = await seccion()
    expect(within(s).getAllByText('Sin calificar').length).toBeGreaterThan(0)
    expect(puntos(s)).toHaveLength(1)
    expect(within(s).getByText('1 alto · 1 sin calificar')).toBeInTheDocument()
  })

  it('enfocar un punto resalta su fila y pasar sobre la fila resalta el punto', async () => {
    const usuario = userEvent.setup()
    abrir([
      riesgo(1, { probabilidad: 1, impacto: 1 }),
      riesgo(2, { probabilidad: 5, impacto: 5 }),
    ])
    const s = await seccion()
    const filas = within(s).getAllByRole('listitem')
    const punto2 = within(s).getByRole('img', { name: /^Riesgo 2:/ })
    punto2.focus()
    await waitFor(() => expect(filas[1]).toHaveAttribute('aria-current', 'true'))
    expect(filas[0]).not.toHaveAttribute('aria-current')
    punto2.blur()
    await usuario.hover(filas[0]!)
    await waitFor(() =>
      expect(within(s).getByRole('img', { name: /^Riesgo 1:/ })).toHaveAttribute(
        'data-resaltado',
        'true',
      ),
    )
    expect(punto2).not.toHaveAttribute('data-resaltado')
  })

  it('seis riesgos en la misma casilla muestran 3 puntos y «+3»', async () => {
    abrir(
      Array.from({ length: 6 }, (_, i) => riesgo(i + 1, { probabilidad: 3, impacto: 4 })),
      false,
    )
    const s = await seccion()
    expect(puntos(s)).toHaveLength(3)
    expect(within(matriz(s)).getByText('+3')).toBeInTheDocument()
    expect(
      within(matriz(s)).getByRole('group', {
        name: 'Probabilidad 3, impacto 4: riesgos 1, 2, 3, 4, 5 y 6',
      }),
    ).toBeInTheDocument()
    // Los seis siguen en la lista.
    expect(within(s).getAllByRole('listitem')).toHaveLength(6)
  })

  it('vacío invita a agregar y atenúa la matriz', async () => {
    abrir()
    const s = await seccion()
    expect(within(s).getByText('Aún no hay riesgos.')).toBeInTheDocument()
    expect(matriz(s)).toHaveAttribute('data-vacia', 'true')
  })

  it('en solo lectura no hay campos y una fila sin texto dice «Sin descripción»', async () => {
    abrir([riesgo(1, { riesgo: '', probabilidad: 2, impacto: 2, causa: 'Causa' })], false)
    const s = await seccion()
    expect(within(s).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(s).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(s).getByText('Sin descripción')).toBeInTheDocument()
    expect(within(s).getByText('Bajo · 4')).toBeInTheDocument()
    expect(within(s).queryByRole('button', { name: 'Agregar riesgo' })).not.toBeInTheDocument()
  })
})
