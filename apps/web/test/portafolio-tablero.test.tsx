import type { CharterResumen } from '@charter/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { RutaProtegida } from '../src/app/RutaProtegida'
import { hoyISO } from '../src/formato'
import { Portafolio } from '../src/pantallas/portafolio/Portafolio'
import { simularApi, usuarioAna, type Llamada } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const financiera = { id: 'a-fin', nombre: 'Financiera', activa: true }
const obras = { id: 'a-obr', nombre: 'Obras', activa: true }

function charter(p: Partial<CharterResumen> & { id: string; nombre: string }): CharterResumen {
  return {
    codigo: null,
    responsable: 'Ana Pérez',
    estado: 'activo',
    categoria: null,
    area: null,
    propietario: { id: 'u1', nombre: 'Ana Pérez' },
    actualizadoEn: '2026-11-01T10:00:00.000Z',
    ultimoCorte: null,
    cortes: [],
    ...p,
  }
}

const corte = (estado: 'atrasada' | 'al_dia', pv: number, ev: number) => ({
  fecha: hoyISO(),
  pv,
  ev,
  estado,
  vencidas: 0,
})

const mios = [
  charter({
    id: 'c1',
    nombre: 'Conciliación',
    area: financiera,
    ultimoCorte: corte('atrasada', 0.4, 0.2),
  }),
  charter({
    id: 'c2',
    nombre: 'Facturación',
    area: financiera,
    ultimoCorte: corte('atrasada', 0.6, 0.3),
  }),
  charter({
    id: 'c3',
    nombre: 'Bitácora de obra',
    area: obras,
    ultimoCorte: corte('al_dia', 0.5, 0.5),
  }),
  charter({ id: 'c4', nombre: 'Archivo pausado', area: obras, estado: 'pausado' }),
]

const ajeno = charter({
  id: 'c9',
  nombre: 'Charter de Luis',
  area: obras,
  propietario: { id: 'u2', nombre: 'Luis Gómez' },
})

function abrir({ admin = false, ruta = '/' } = {}) {
  const llamadas = simularApi((l: Llamada) => {
    if (l.url === '/api/auth/yo') return { estado: 200, cuerpo: { ...usuarioAna, esAdmin: admin } }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters') return { estado: 200, cuerpo: mios }
    if (l.url === '/api/charters?ver=todos') return { estado: 200, cuerpo: [...mios, ajeno] }
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Portafolio />
              </RutaProtegida>
            }
          />
        </Routes>
      </MemoryRouter>
    </Proveedores>,
  )
  return llamadas
}

const pedidos = (llamadas: Llamada[]) =>
  llamadas.filter((l) => l.url.startsWith('/api/charters')).map((l) => l.url)

describe('tablero del portafolio', () => {
  it('el usuario ve las 4 cifras y las barras, sin selector', async () => {
    abrir()
    const tablero = await screen.findByRole('region', { name: 'Tablero' })
    expect(within(tablero).getByText('Activos').parentElement).toHaveTextContent('3')
    expect(within(tablero).getByText('En rojo o vencidos').parentElement).toHaveTextContent('2')
    expect(within(tablero).getByText('Sin corte reciente').parentElement).toHaveTextContent('0')
    expect(tablero).toHaveTextContent(/33,3\s% real de 50,0\s% planeado/)
    expect(within(tablero).getByRole('button', { name: 'Financiera: 2 en rojo' })).toBeVisible()
    expect(within(tablero).getByRole('button', { name: 'Obras: 1 al día' })).toBeVisible()
    expect(screen.queryByRole('radio', { name: 'Todos' })).not.toBeInTheDocument()
  })

  it('un usuario con ?ver=todos en la URL pide solo lo suyo', async () => {
    const llamadas = abrir({ ruta: '/?ver=todos' })
    expect(await screen.findByRole('heading', { name: 'Mis charters' })).toBeInTheDocument()
    await screen.findByRole('region', { name: 'Tablero' })
    expect(pedidos(llamadas)).toEqual(['/api/charters'])
  })

  it('el Admin cambia a «Todos los charters» con columna y filtro Dueño', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir({ admin: true })
    await screen.findByRole('region', { name: 'Tablero' })
    expect(screen.queryByLabelText('Dueño')).not.toBeInTheDocument()
    await usuario.click(screen.getByRole('radio', { name: 'Todos' }))
    expect(await screen.findByRole('heading', { name: 'Todos los charters' })).toBeVisible()
    expect(pedidos(llamadas)).toContain('/api/charters?ver=todos')
    const fila = await screen.findByRole('link', { name: /Charter de Luis/ })
    expect(within(fila).getByText('Luis Gómez')).toBeInTheDocument()
    await usuario.selectOptions(screen.getByLabelText('Dueño'), 'u2')
    expect(await screen.findByText('1 de 5 charters')).toBeInTheDocument()
  })

  it('un segmento filtra la tabla, muestra un chip y la barra no cambia con el filtro de estado', async () => {
    const usuario = userEvent.setup()
    abrir()
    await usuario.selectOptions(await screen.findByLabelText('Estado'), 'pausado')
    const tablero = screen.getByRole('region', { name: 'Tablero' })
    const rojo = within(tablero).getByRole('button', { name: 'Financiera: 2 en rojo' })
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'todos')
    await usuario.click(rojo)
    expect(await screen.findByText('2 de 4 charters')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Bitácora/ })).not.toBeInTheDocument()
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'pausado')
    expect(within(tablero).getByRole('button', { name: 'Financiera: 2 en rojo' })).toBeVisible()
    expect(await screen.findByText('0 de 4 charters')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Quitar filtro Financiera · rojo' }))
    expect(await screen.findByText('1 de 4 charters')).toBeInTheDocument()
  })

  it('sin charters no hay tablero', async () => {
    simularApi((l) => {
      if (l.url === '/api/charters') return { estado: 200, cuerpo: [] }
      if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
      return undefined
    })
    render(
      <Proveedores>
        <MemoryRouter>
          <RutaProtegida>
            <Portafolio />
          </RutaProtegida>
        </MemoryRouter>
      </Proveedores>,
    )
    expect(
      await screen.findByRole('heading', { name: 'Aún no tienes charters' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tablero' })).not.toBeInTheDocument()
  })
})
