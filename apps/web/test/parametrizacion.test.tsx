import { REGLAS_POR_DEFECTO, type ParametrosRespuesta } from '@charter/shared'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, usuarioAna, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const admin = { ...usuarioAna, esAdmin: true }

const parametros: ParametrosRespuesta = {
  reglas: { ...REGLAS_POR_DEFECTO, umbrales: { atencion: 8, riesgo: 20, atraso: 45 } },
  actualizadoPor: { id: 'u9', nombre: 'Luis Gómez' },
  actualizadoEn: '2026-11-10T15:00:00.000Z',
}

function Ruta() {
  return <span data-testid="ruta">{useLocation().pathname}</span>
}

function abrir(
  ruta: string,
  { esAdmin = true, alGuardar }: { esAdmin?: boolean; alGuardar?: (l: Llamada) => Respuesta } = {},
) {
  const llamadas = simularApi((l) => {
    if (l.url === '/api/auth/yo') return { estado: 200, cuerpo: esAdmin ? admin : usuarioAna }
    if (['/api/charters', '/api/categorias', '/api/areas'].includes(l.url))
      return { estado: 200, cuerpo: [] }
    if (l.url === '/api/admin/parametros' && l.metodo === 'GET')
      return { estado: 200, cuerpo: parametros }
    if (l.url === '/api/admin/parametros' && l.metodo === 'PUT')
      return (
        alGuardar?.(l) ?? {
          estado: 200,
          cuerpo: { ...parametros, reglas: l.cuerpo, actualizadoEn: '2026-11-11T15:00:00.000Z' },
        }
      )
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
        <Ruta />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario: userEvent.setup() }
}

describe('parametrización del Admin', () => {
  it('un usuario normal no entra ni ve el enlace', async () => {
    abrir('/admin/parametros', { esAdmin: false })
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/$/))
    await screen.findByText('Ana Pérez')
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument()
  })

  it('/admin lleva a la pestaña de cuentas', async () => {
    abrir('/admin')
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/admin/cuentas'))
    expect(await screen.findByRole('heading', { name: 'Administración' })).toBeInTheDocument()
  })

  it('el Admin ve el enlace, cambia el atraso y guarda', async () => {
    const { llamadas, usuario } = abrir('/admin/parametros')
    expect(await screen.findByRole('link', { name: 'Administración' })).toBeInTheDocument()
    expect(await screen.findByText(/Modificado por Luis Gómez/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Los cambios aplican a los charters que se creen desde ahora. Los charters existentes conservan sus reglas.',
      ),
    ).toBeInTheDocument()
    const guardar = screen.getByRole('button', { name: 'Guardar' })
    expect(guardar).toBeDisabled()

    const atraso = screen.getByLabelText('Atraso')
    expect(atraso).toHaveValue(45)
    await usuario.clear(atraso)
    await usuario.type(atraso, '40')
    await usuario.click(screen.getByLabelText('Días hábiles (lunes a viernes)'))
    await usuario.click(guardar)

    expect(await screen.findByText('Parámetros guardados.')).toBeInTheDocument()
    const put = llamadas.find((l) => l.metodo === 'PUT')!
    expect(put.cuerpo).toMatchObject({
      umbrales: { atencion: 8, riesgo: 20, atraso: 40 },
      reparto: 'habiles',
    })
  })

  it('«Restablecer valores de fábrica» vuelve a 10/25/50 sin llamar a la API', async () => {
    const { llamadas, usuario } = abrir('/admin/parametros')
    await screen.findByText(/Modificado por/)
    await usuario.click(screen.getByRole('button', { name: 'Restablecer valores de fábrica' }))
    expect(screen.getByLabelText('Atención')).toHaveValue(10)
    expect(screen.getByLabelText('Riesgo')).toHaveValue(25)
    expect(screen.getByLabelText('Atraso')).toHaveValue(50)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    expect(llamadas.some((l) => l.metodo === 'PUT')).toBe(false)
  })

  it('muestra como alerta el error de la API', async () => {
    const { usuario } = abrir('/admin/parametros', {
      alGuardar: () => ({
        estado: 400,
        cuerpo: {
          error: {
            codigo: 'validacion',
            mensaje: 'Los umbrales deben ir de menor a mayor: atención, riesgo, atraso.',
          },
        },
      }),
    })
    await screen.findByText(/Modificado por/)
    const atraso = screen.getByLabelText('Atraso')
    await usuario.clear(atraso)
    await usuario.type(atraso, '15')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(
      await screen.findByText('Los umbrales deben ir de menor a mayor: atención, riesgo, atraso.'),
    ).toBeInTheDocument()
  })
})
