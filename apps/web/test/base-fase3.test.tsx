import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../src/api/cliente'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { ChipCategoria } from '../src/componentes/Chip'
import { diasEntre, fechaCorta, porcentaje } from '../src/formato'

afterEach(() => vi.unstubAllGlobals())

function simularFetch(estado: number, cuerpo: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(cuerpo, { status: estado })),
  )
}

describe('formato', () => {
  it('fecha corta en es-CO', () => {
    expect(fechaCorta('2026-11-09')).toBe('9 nov 2026')
    expect(fechaCorta('2026-01-31')).toBe('31 ene 2026')
  })

  it('porcentaje con coma y espacio', () => {
    expect(porcentaje(0.1251)).toBe('12,5 %')
    expect(porcentaje(1, 0)).toBe('100 %')
  })

  it('días entre dos fechas', () => {
    expect(diasEntre('2026-10-19', '2026-11-09')).toBe(21)
  })
})

describe('chips', () => {
  it('sin categoría muestra «Sin categoría»', () => {
    render(<ChipCategoria categoria={null} />)
    expect(screen.getByText('Sin categoría')).toBeInTheDocument()
  })
})

describe('cliente', () => {
  it('una respuesta que no es JSON lanza respuesta_invalida', async () => {
    simularFetch(502, '<html>')
    await expect(api('/algo')).rejects.toMatchObject({ estado: 502, codigo: 'respuesta_invalida' })
  })
})

describe('ruta protegida', () => {
  it('con la API caída muestra «Reintentar» y no va a /entrar', async () => {
    simularFetch(500, JSON.stringify({ error: { codigo: 'error_interno', mensaje: 'Falló' } }))
    render(
      <Proveedores>
        <MemoryRouter initialEntries={['/']}>
          <Rutas />
        </MemoryRouter>
      </Proveedores>,
    )
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Entra a tus charters' })).not.toBeInTheDocument()
  })
})
