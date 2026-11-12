import { PALETA_CATEGORIAS, type CatalogoAdmin, type CategoriaAdmin } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, usuarioAna, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const admin = { ...usuarioAna, esAdmin: true }
const [NEUTRO, AMBAR, VIOLETA, , VERDE] = PALETA_CATEGORIAS

const categoria = (
  p: Partial<CategoriaAdmin> & { id: string; nombre: string; orden: number },
): CategoriaAdmin => ({
  color: AMBAR!.color,
  colorFondo: AMBAR!.colorFondo,
  activa: true,
  charters: 0,
  protegida: false,
  ...p,
})

const CATEGORIAS: CategoriaAdmin[] = [
  categoria({ id: 'def', nombre: 'Default', orden: 0, protegida: true, ...NEUTRO!, charters: 4 }),
  categoria({ id: 'aut', nombre: 'Automatización', orden: 1, charters: 2 }),
  categoria({ id: 'dat', nombre: 'Análisis de Data', orden: 2, ...VIOLETA! }),
]

const AREAS: CatalogoAdmin[] = [
  { id: 'fin', nombre: 'Financiera', activa: true, orden: 0, charters: 1 },
  { id: 'ope', nombre: 'Operaciones', activa: false, orden: 1, charters: 0 },
]

function abrir(otra?: (l: Llamada) => Respuesta | undefined) {
  const llamadas = simularApi((l) => {
    if (l.url === '/api/auth/yo') return { estado: 200, cuerpo: admin }
    const r = otra?.(l)
    if (r) return r
    if (l.url === '/api/admin/catalogos/categorias' && l.metodo === 'GET')
      return { estado: 200, cuerpo: CATEGORIAS }
    if (l.url === '/api/admin/catalogos/areas' && l.metodo === 'GET')
      return { estado: 200, cuerpo: AREAS }
    if (l.metodo === 'PATCH') {
      const id = l.url.split('/').at(-1)!
      const previo = [...CATEGORIAS, ...AREAS].find((c) => c.id === id)!
      return { estado: 200, cuerpo: { ...previo, ...(l.cuerpo as object) } }
    }
    if (l.metodo === 'POST')
      return {
        estado: 201,
        cuerpo: { id: 'nueva', activa: true, orden: 9, charters: 0, ...(l.cuerpo as object) },
      }
    if (l.metodo === 'DELETE') return { estado: 204 }
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={['/admin/catalogos']}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario: userEvent.setup() }
}

const bloque = async (titulo: 'Categorías' | 'Áreas') =>
  screen.findByRole('region', { name: titulo })
const filaDe = async (titulo: 'Categorías' | 'Áreas', nombre: string) => {
  const campo = await within(await bloque(titulo)).findByDisplayValue(nombre)
  return campo.closest('li') as HTMLElement
}

describe('Admin › Catálogos', () => {
  it('muestra los dos bloques con sus filas, conteos y estado', async () => {
    abrir()
    const cats = await bloque('Categorías')
    expect(await within(cats).findAllByRole('listitem')).toHaveLength(3)
    expect(
      within(await filaDe('Categorías', 'Default')).getByText('4 charters'),
    ).toBeInTheDocument()
    const ope = await filaDe('Áreas', 'Operaciones')
    expect(within(ope).getByText('Inactiva')).toBeInTheDocument()
  })

  it('renombrar guarda al salir del campo', async () => {
    const { usuario, llamadas } = abrir()
    const campo = within(await filaDe('Categorías', 'Automatización')).getByRole('textbox')
    await usuario.clear(campo)
    await usuario.type(campo, 'Automatización IA')
    expect(llamadas.some((l) => l.metodo === 'PATCH')).toBe(false)
    await usuario.tab()
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')).toMatchObject({
        url: '/api/admin/catalogos/categorias/aut',
        cuerpo: { nombre: 'Automatización IA' },
      }),
    )
  })

  it('un nombre repetido vuelve al anterior y muestra el mensaje', async () => {
    const { usuario } = abrir((l) =>
      l.metodo === 'PATCH'
        ? {
            estado: 409,
            cuerpo: {
              error: {
                codigo: 'nombre_repetido',
                mensaje: 'Ya existe una con ese nombre.',
                campos: { nombre: 'Ya existe una con ese nombre' },
              },
            },
          }
        : undefined,
    )
    const campo = within(await filaDe('Categorías', 'Análisis de Data')).getByRole('textbox')
    await usuario.clear(campo)
    await usuario.type(campo, 'automatizacion')
    await usuario.tab()
    expect(await screen.findByText('Ya existe una con ese nombre')).toBeInTheDocument()
    expect(campo).toHaveValue('Análisis de Data')
  })

  it('subir y bajar envían dos PATCH con el orden intercambiado', async () => {
    const { usuario, llamadas } = abrir()
    await usuario.click(
      within(await filaDe('Categorías', 'Análisis de Data')).getByRole('button', {
        name: 'Subir Análisis de Data',
      }),
    )
    await waitFor(() => expect(llamadas.filter((l) => l.metodo === 'PATCH')).toHaveLength(2))
    const parches = llamadas.filter((l) => l.metodo === 'PATCH')
    expect(parches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: '/api/admin/catalogos/categorias/dat',
          cuerpo: { orden: 1 },
        }),
        expect.objectContaining({
          url: '/api/admin/catalogos/categorias/aut',
          cuerpo: { orden: 2 },
        }),
      ]),
    )
    expect(
      within(await filaDe('Categorías', 'Default')).getByRole('button', { name: 'Subir Default' }),
    ).toBeDisabled()
  })

  it('«Eliminar» solo aparece sin charters y Default no tiene menú', async () => {
    const { usuario, llamadas } = abrir()
    expect(
      within(await filaDe('Categorías', 'Default')).queryByRole('button', {
        name: 'Acciones de Default',
      }),
    ).not.toBeInTheDocument()

    await usuario.click(
      within(await filaDe('Categorías', 'Automatización')).getByRole('button', {
        name: 'Acciones de Automatización',
      }),
    )
    expect((await screen.findAllByRole('menuitem')).map((m) => m.textContent)).toEqual([
      'Desactivar',
    ])
    await usuario.keyboard('{Escape}')

    await usuario.click(
      within(await filaDe('Categorías', 'Análisis de Data')).getByRole('button', {
        name: 'Acciones de Análisis de Data',
      }),
    )
    await usuario.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))
    await usuario.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }),
    )
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'DELETE')?.url).toBe(
        '/api/admin/catalogos/categorias/dat',
      ),
    )
  })

  it('reactivar un área inactiva envía activa: true', async () => {
    const { usuario, llamadas } = abrir()
    await usuario.click(
      within(await filaDe('Áreas', 'Operaciones')).getByRole('button', {
        name: 'Acciones de Operaciones',
      }),
    )
    await usuario.click(await screen.findByRole('menuitem', { name: 'Reactivar' }))
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')).toMatchObject({
        url: '/api/admin/catalogos/areas/ope',
        cuerpo: { activa: true },
      }),
    )
  })

  it('el color se elige en un radiogroup de 8 pares', async () => {
    const { usuario, llamadas } = abrir()
    await usuario.click(
      within(await filaDe('Categorías', 'Automatización')).getByRole('button', {
        name: 'Color de Automatización',
      }),
    )
    const grupo = await screen.findByRole('radiogroup', { name: 'Color de Automatización' })
    const radios = within(grupo).getAllByRole('radio')
    expect(radios).toHaveLength(8)
    expect(radios[1]).toBeChecked()
    await usuario.click(radios[4]!)
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')).toMatchObject({
        url: '/api/admin/catalogos/categorias/aut',
        cuerpo: { color: VERDE!.color },
      }),
    )
  })

  it('agrega un área', async () => {
    const { usuario, llamadas } = abrir()
    const areas = await bloque('Áreas')
    await usuario.type(within(areas).getByLabelText('Nueva área'), 'Comercial')
    await usuario.click(within(areas).getByRole('button', { name: 'Agregar' }))
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'POST')).toMatchObject({
        url: '/api/admin/catalogos/areas',
        cuerpo: { nombre: 'Comercial' },
      }),
    )
    await waitFor(() => expect(within(areas).getByLabelText('Nueva área')).toHaveValue(''))
  })
})

describe('Nuevo charter', () => {
  it('abre con la categoría Default seleccionada', async () => {
    simularApi((l) => {
      if (l.url === '/api/charters') return { estado: 200, cuerpo: [] }
      if (l.url === '/api/categorias')
        return {
          estado: 200,
          cuerpo: CATEGORIAS.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            color: c.color,
            colorFondo: c.colorFondo,
            activa: c.activa,
            protegida: c.protegida,
          })),
        }
      if (l.url === '/api/areas') return { estado: 200, cuerpo: [] }
      return undefined
    })
    render(
      <Proveedores>
        <MemoryRouter initialEntries={['/']}>
          <Rutas />
        </MemoryRouter>
      </Proveedores>,
    )
    const usuario = userEvent.setup()
    await usuario.click(
      await screen.findByRole('button', { name: /Crear mi primer charter|Nuevo charter/ }),
    )
    const dialogo = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(within(dialogo).getByLabelText('Categoría')).toHaveDisplayValue('Default'),
    )
  })
})
