import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CategoriaPublica, CharterDetalle } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const vieja: CategoriaPublica = {
  id: 'cat-v',
  nombre: 'Gestión documental',
  color: '#0A9C9B',
  colorFondo: '#E1F4F3',
  activa: false,
}
const activa: CategoriaPublica = {
  id: 'cat-a',
  nombre: 'Automatización',
  color: '#D98A00',
  colorFondo: '#FBF1DF',
  activa: true,
}

const base: CharterDetalle = {
  id: 'c1',
  nombre: 'Potenciación de herramientas',
  codigo: 'ID-01',
  categoriaId: null,
  areaId: null,
  responsable: 'Líder ID&TI',
  patrocinador: 'Gerencia General',
  revision: 'B',
  razonDeSer: 'Las áreas usan el ERP por debajo de su capacidad.',
  objetivoGeneral: 'Aumentar el uso efectivo del ERP.',
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

/** Simula la API de un charter: GET devuelve el detalle y PATCH lo actualiza. */
function abrir({
  detalle = base,
  categorias = [activa],
  patch,
}: {
  detalle?: CharterDetalle
  categorias?: CategoriaPublica[]
  patch?: (l: Llamada, n: number) => Respuesta | undefined
} = {}) {
  let actual = detalle
  let n = 0
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias') return { estado: 200, cuerpo: categorias }
    if (l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters') return { estado: 200, cuerpo: [] }
    if (l.url !== `/api/charters/${detalle.id}`) return undefined
    if (l.metodo === 'GET') return { estado: 200, cuerpo: actual }
    if (l.metodo === 'PATCH') {
      n++
      const especial = patch?.(l, n)
      if (especial && especial.estado >= 400) return especial
      actual = { ...actual, ...(l.cuerpo as Partial<CharterDetalle>) }
      return { estado: 200, cuerpo: actual, demora: especial?.demora }
    }
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[`/charters/${detalle.id}`]}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return llamadas
}

const patches = (llamadas: Llamada[]) => llamadas.filter((l) => l.metodo === 'PATCH')
const indice = () => screen.getByRole('navigation', { name: 'Secciones del charter' })

describe('ficha', () => {
  it('muestra el encabezado, la razón de ser y el índice', async () => {
    abrir()
    expect(await screen.findByLabelText('Nombre del charter')).toHaveValue(base.nombre)
    expect(screen.getByLabelText('Responsable')).toHaveValue('Líder ID&TI')
    expect(screen.getByLabelText('Razón de ser')).toHaveValue(base.razonDeSer)
    expect(within(indice()).getByRole('link', { name: 'Encabezado' })).toBeInTheDocument()
    expect(within(indice()).getByRole('link', { name: 'Razón de ser' })).toBeInTheDocument()
  })

  it('cambiar el responsable guarda solo ese campo', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const campo = await screen.findByLabelText('Responsable')
    await usuario.clear(campo)
    await usuario.type(campo, 'Juan David Urbina')
    await usuario.tab()
    await waitFor(() => expect(patches(llamadas)).toHaveLength(1))
    expect(patches(llamadas)[0]!.cuerpo).toEqual({ responsable: 'Juan David Urbina' })
    expect(await within(indice()).findByText('Guardado hace un momento')).toBeInTheDocument()
  })

  it('dos ediciones seguidas salen en orden y gana la última', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ patch: (_, n) => ({ estado: 200, demora: n === 1 ? 120 : 10 }) })
    const campo = await screen.findByLabelText('Objetivo general')
    await usuario.clear(campo)
    await usuario.type(campo, 'Primero')
    await usuario.tab()
    await usuario.click(campo)
    await usuario.clear(campo)
    await usuario.type(campo, 'Segundo')
    await usuario.tab()
    await waitFor(() => expect(patches(llamadas)).toHaveLength(2))
    expect(patches(llamadas).map((l) => l.cuerpo)).toEqual([
      { objetivoGeneral: 'Primero' },
      { objetivoGeneral: 'Segundo' },
    ])
    await within(indice()).findByText('Guardado hace un momento')
    expect(campo).toHaveValue('Segundo')
  })

  it('el nombre vacío no se envía y vuelve al anterior', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const campo = await screen.findByLabelText('Nombre del charter')
    await usuario.clear(campo)
    await usuario.tab()
    expect(await screen.findByText('Escribe el nombre del charter')).toBeInTheDocument()
    expect(campo).toHaveValue(base.nombre)
    expect(patches(llamadas)).toHaveLength(0)
  })

  it('si el guardado falla se puede reintentar', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({
      patch: (_, n) =>
        n === 1
          ? { estado: 500, cuerpo: { error: { codigo: 'error_interno', mensaje: 'Falló' } } }
          : undefined,
    })
    const campo = await screen.findByLabelText('Patrocinador')
    await usuario.type(campo, ' y Comité')
    await usuario.tab()
    expect(await within(indice()).findByText(/No se pudo guardar/)).toBeInTheDocument()
    await usuario.click(within(indice()).getByRole('button', { name: 'Reintentar' }))
    expect(await within(indice()).findByText('Guardado hace un momento')).toBeInTheDocument()
    expect(patches(llamadas)).toHaveLength(2)
    expect(patches(llamadas)[1]!.cuerpo).toEqual({ patrocinador: 'Gerencia General y Comité' })
  })

  it('muestra la categoría inactiva que el charter ya usa', async () => {
    abrir({ detalle: { ...base, categoriaId: 'cat-v' }, categorias: [activa, vieja] })
    const selector = await screen.findByLabelText('Categoría')
    await waitFor(() => expect(selector).toHaveValue('cat-v'))
    const opciones = within(selector)
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(opciones).toContain('Gestión documental (inactiva)')
    expect(opciones).toContain('Automatización')
  })

  it('cambiar la categoría la guarda', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    const selector = await screen.findByLabelText('Categoría')
    await screen.findByRole('option', { name: 'Automatización' })
    await usuario.selectOptions(selector, 'cat-a')
    await waitFor(() => expect(patches(llamadas)).toHaveLength(1))
    expect(patches(llamadas)[0]!.cuerpo).toEqual({ categoriaId: 'cat-a' })
  })

  it('un charter que no existe avisa y enlaza al portafolio', async () => {
    simularApi(() => undefined)
    render(
      <Proveedores>
        <MemoryRouter initialEntries={['/charters/otro']}>
          <Rutas />
        </MemoryRouter>
      </Proveedores>,
    )
    expect(await screen.findByText('No encontramos ese charter')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver a mis charters/ })).toHaveAttribute('href', '/')
  })
})
