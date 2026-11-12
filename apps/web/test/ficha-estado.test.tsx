import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { CharterDetalle, CharterResumen } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const base: CharterDetalle = {
  id: 'c1',
  nombre: 'Potenciación de herramientas',
  codigo: 'ID-01',
  categoriaId: null,
  areaId: null,
  responsable: 'Líder ID&TI',
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

const resumen = (d: CharterDetalle): CharterResumen => ({
  id: d.id,
  nombre: d.nombre,
  codigo: d.codigo,
  responsable: d.responsable,
  estado: d.estado,
  categoria: null,
  area: null,
  propietario: d.propietario,
  actualizadoEn: d.actualizadoEn,
  ultimoCorte: null,
  cortes: [],
})

/** Al cambiar el estado, los permisos siguen la regla de la API. */
function conEstado(d: CharterDetalle, estado: CharterDetalle['estado']): CharterDetalle {
  const abierto = estado === 'activo' || estado === 'pausado'
  return { ...d, estado, permisos: { editar: abierto, reabrir: !abierto } }
}

function abrir({
  detalle = base,
  patch,
}: {
  detalle?: CharterDetalle
  patch?: (l: Llamada) => Respuesta | undefined
} = {}) {
  let actual: CharterDetalle | null = detalle
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters') return { estado: 200, cuerpo: actual ? [resumen(actual)] : [] }
    if (l.url !== '/api/charters/c1') return undefined
    if (!actual)
      return { estado: 404, cuerpo: { error: { codigo: 'no_encontrado', mensaje: 'No existe' } } }
    if (l.metodo === 'GET') return { estado: 200, cuerpo: actual }
    if (l.metodo === 'DELETE') {
      actual = null
      return { estado: 204 }
    }
    if (l.metodo === 'PATCH') {
      const especial = patch?.(l)
      if (especial) {
        if (especial.estado === 409) actual = conEstado(actual, 'cerrado')
        return especial
      }
      const cambios = l.cuerpo as Partial<CharterDetalle>
      actual = { ...actual, ...cambios }
      if (cambios.estado) actual = conEstado(actual, cambios.estado)
      return { estado: 200, cuerpo: actual }
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

const patches = (llamadas: Llamada[]) => llamadas.filter((l) => l.metodo === 'PATCH')
const menuEstado = () => screen.findByRole('button', { name: /^Estado del charter/ })

describe('estado del charter', () => {
  it('cerrar pide confirmación, deja la ficha en solo lectura y se puede reabrir', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    await usuario.click(await menuEstado())
    await usuario.click(screen.getByRole('menuitemradio', { name: 'Cerrado' }))
    const dialogo = screen.getByRole('dialog', { name: '¿Cerrar el charter?' })
    expect(
      within(dialogo).getByText(
        'El charter quedará en solo lectura. Podrás reabrirlo cuando quieras.',
      ),
    ).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cerrar charter' }))
    await waitFor(() => expect(patches(llamadas)).toHaveLength(1))
    expect(patches(llamadas)[0]!.cuerpo).toEqual({ estado: 'cerrado' })
    expect(await screen.findByText('Este charter está cerrado.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Responsable')).not.toBeInTheDocument()
    expect(screen.getByText('Líder ID&TI')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Reabrir' }))
    await waitFor(() => expect(patches(llamadas)).toHaveLength(2))
    expect(patches(llamadas)[1]!.cuerpo).toEqual({ estado: 'activo' })
    expect(await screen.findByLabelText('Responsable')).toHaveValue('Líder ID&TI')
  })

  it('pausar no pide confirmación', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    await usuario.click(await menuEstado())
    await usuario.click(screen.getByRole('menuitemradio', { name: 'Pausado' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(patches(llamadas)).toHaveLength(1))
    expect(patches(llamadas)[0]!.cuerpo).toEqual({ estado: 'pausado' })
    expect(
      await screen.findByRole('button', { name: 'Estado del charter: Pausado' }),
    ).toBeInTheDocument()
  })

  it('el menú se maneja con flechas y Escape', async () => {
    const usuario = userEvent.setup()
    abrir()
    const boton = await menuEstado()
    await usuario.click(boton)
    expect(screen.getByRole('menuitemradio', { name: 'Activo' })).toHaveFocus()
    await usuario.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitemradio', { name: 'Pausado' })).toHaveFocus()
    await usuario.keyboard('{Escape}')
    expect(boton).toHaveFocus()
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('el charter de otro se ve en solo lectura y sin menú', async () => {
    abrir({
      detalle: {
        ...base,
        propietario: { id: 'u2', nombre: 'Beto Ruiz' },
        permisos: { editar: false, reabrir: false },
      },
    })
    expect(await screen.findByText('Charter de Beto Ruiz · solo lectura')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Estado del charter/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Responsable')).not.toBeInTheDocument()
  })

  it('eliminar pide confirmación y vuelve al portafolio', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    await usuario.click(await menuEstado())
    await usuario.click(screen.getByRole('menuitem', { name: 'Eliminar charter…' }))
    const dialogo = screen.getByRole('dialog', { name: 'Eliminar charter' })
    expect(within(dialogo).getByText(/Potenciación de herramientas/)).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Eliminar charter' }))
    await waitFor(() => expect(llamadas.some((l) => l.metodo === 'DELETE')).toBe(true))
    expect(await screen.findByRole('heading', { name: 'Mis charters' })).toBeInTheDocument()
    expect(screen.queryByText('Potenciación de herramientas')).not.toBeInTheDocument()
  })

  it('un 409 charter_cerrado deja la ficha en solo lectura con el mensaje', async () => {
    const usuario = userEvent.setup()
    abrir({
      patch: () => ({
        estado: 409,
        cuerpo: {
          error: {
            codigo: 'charter_cerrado',
            mensaje: 'El charter está cerrado. Reábrelo para editarlo.',
          },
        },
      }),
    })
    const campo = await screen.findByLabelText('Responsable')
    await usuario.clear(campo)
    await usuario.type(campo, 'Otro')
    await usuario.tab()
    expect(
      await screen.findByText('El charter está cerrado. Reábrelo para editarlo.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Responsable')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeInTheDocument()
  })

  it('un 401 al guardar manda a /entrar', async () => {
    const usuario = userEvent.setup()
    abrir({
      patch: () => ({
        estado: 401,
        cuerpo: { error: { codigo: 'sin_sesion', mensaje: 'Inicia sesión' } },
      }),
    })
    const campo = await screen.findByLabelText('Responsable')
    await usuario.type(campo, ' 2')
    await usuario.tab()
    expect(await screen.findByText('Entra a tus charters')).toBeInTheDocument()
  })
})
