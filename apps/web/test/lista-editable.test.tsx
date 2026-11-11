import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CharterDetalle, ItemLista, TipoLista } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const items = (...textos: string[]): ItemLista[] =>
  textos.map((texto, i) => ({ id: `i${i}`, texto }))

const base: CharterDetalle = {
  id: 'c1',
  nombre: 'Potenciación de herramientas',
  codigo: 'ID-01',
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
}

function abrir(listas: Partial<Record<TipoLista, ItemLista[]>> = {}, editar = true) {
  const detalle: CharterDetalle = {
    ...base,
    listas: { ...base.listas, ...listas },
    permisos: { editar, reabrir: false },
  }
  let n = 0
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias' || l.url === '/api/areas' || l.url === '/api/charters')
      return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1' && l.metodo === 'GET') return { estado: 200, cuerpo: detalle }
    if (l.url.startsWith('/api/charters/c1/listas/') && l.metodo === 'PUT') {
      const cuerpo = l.cuerpo as { items: { texto: string }[] }
      return {
        estado: 200,
        cuerpo: cuerpo.items.map((it) => ({ id: `s${++n}`, texto: it.texto })),
      }
    }
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

const puts = (llamadas: Llamada[], tipo: TipoLista = 'objetivo') =>
  llamadas.filter((l) => l.metodo === 'PUT' && l.url === `/api/charters/c1/listas/${tipo}`)
const textos = (l: Llamada) =>
  (l.cuerpo as { items: { texto: string }[] }).items.map((i) => i.texto)
const objetivos = () => screen.findByRole('list', { name: 'Objetivos específicos' })

describe('listas editables', () => {
  it('agregar un objetivo y salir envía la lista', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    expect(await screen.findByText('Aún no hay objetivos específicos.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Agregar objetivo' }))
    const campo = within(await objetivos()).getByRole('textbox', { name: 'Objetivo 1' })
    expect(campo).toHaveFocus()
    await usuario.type(campo, 'Capacitar usuarios')
    await usuario.tab()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(puts(llamadas)[0]!.cuerpo).toEqual({ items: [{ texto: 'Capacitar usuarios' }] })
  })

  it('Alt + ↓ mueve el ítem y conserva el foco', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ objetivo: items('Uno', 'Dos', 'Tres') })
    const lista = await objetivos()
    await usuario.click(within(lista).getByRole('textbox', { name: 'Objetivo 1' }))
    await usuario.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(textos(puts(llamadas)[0]!)).toEqual(['Dos', 'Uno', 'Tres'])
    const movido = within(lista).getByRole('textbox', { name: 'Objetivo 2' })
    expect(movido).toHaveValue('Uno')
    await waitFor(() => expect(movido).toHaveFocus())
  })

  it('«Quitar» envía los demás', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ objetivo: items('Uno', 'Dos', 'Tres') })
    const lista = await objetivos()
    await usuario.click(within(lista).getByRole('button', { name: 'Quitar objetivo 2' }))
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(textos(puts(llamadas)[0]!)).toEqual(['Uno', 'Tres'])
    expect(within(lista).getAllByRole('textbox')).toHaveLength(2)
  })

  it('un ítem agregado y dejado vacío no se envía', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ supuesto: items('Hay equipo') })
    await screen.findByRole('list', { name: 'Supuestos' })
    await usuario.click(screen.getByRole('button', { name: 'Agregar supuesto' }))
    await usuario.tab()
    await usuario.tab()
    expect(puts(llamadas, 'supuesto')).toHaveLength(0)
  })

  it('Enter al final crea uno debajo y Retroceso en vacío lo quita', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ objetivo: items('Uno', 'Dos') })
    const lista = await objetivos()
    await usuario.click(within(lista).getByRole('textbox', { name: 'Objetivo 1' }))
    await usuario.keyboard('{End}{Enter}')
    const nuevo = within(lista).getByRole('textbox', { name: 'Objetivo 2' })
    expect(nuevo).toHaveValue('')
    expect(nuevo).toHaveFocus()
    expect(within(lista).getAllByRole('textbox')).toHaveLength(3)
    await usuario.keyboard('{Backspace}')
    expect(within(lista).getAllByRole('textbox')).toHaveLength(2)
    expect(within(lista).getByRole('textbox', { name: 'Objetivo 1' })).toHaveFocus()
    expect(puts(llamadas)).toHaveLength(0)
  })

  it('el índice muestra los contadores', async () => {
    abrir({ objetivo: items('Uno', 'Dos'), supuesto: items('A'), criterio_exito: items('B', 'C') })
    const indice = await screen.findByRole('navigation', { name: 'Secciones del charter' })
    expect(within(indice).getByRole('link', { name: 'Objetivos 2' })).toBeInTheDocument()
    expect(within(indice).getByRole('link', { name: 'Supuestos y éxito 3' })).toBeInTheDocument()
  })

  it('en solo lectura no hay campos ni botones', async () => {
    abrir({ objetivo: items('Uno'), supuesto: items('A') }, false)
    const lista = await objetivos()
    expect(within(lista).getByText('Uno')).toBeInTheDocument()
    expect(within(lista).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(lista).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agregar objetivo' })).not.toBeInTheDocument()
  })
})
