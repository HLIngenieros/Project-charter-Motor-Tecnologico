import type { CuentaAdmin } from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, usuarioAna, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const yo = { ...usuarioAna, id: 'u1', esAdmin: true }

const cuenta = (p: Partial<CuentaAdmin> & { id: string; nombre: string }): CuentaAdmin => ({
  correo: `${p.id}@hlingenieros.com`,
  esAdmin: false,
  activo: true,
  debeCambiarClave: false,
  charters: 0,
  ultimoAcceso: '2026-11-10T15:00:00.000Z',
  creadoEn: '2026-11-01T10:00:00.000Z',
  ...p,
})

const CUENTAS: CuentaAdmin[] = [
  cuenta({
    id: 'u1',
    nombre: 'Ana Pérez',
    correo: 'ana@hlingenieros.com',
    esAdmin: true,
    charters: 3,
  }),
  cuenta({ id: 'u2', nombre: 'José Ruiz', correo: 'jose@hlingenieros.com', ultimoAcceso: null }),
  cuenta({ id: 'u3', nombre: 'Luisa Mora', correo: 'luisa@hlingenieros.com', activo: false }),
]

function Ruta() {
  return <span data-testid="ruta">{useLocation().pathname}</span>
}

function abrir(ruta = '/admin/cuentas', otra?: (l: Llamada) => Respuesta | undefined) {
  const llamadas = simularApi((l) => {
    if (l.url === '/api/auth/yo') return { estado: 200, cuerpo: yo }
    const r = otra?.(l)
    if (r) return r
    if (l.url === '/api/admin/cuentas') return { estado: 200, cuerpo: CUENTAS }
    if (l.metodo === 'PATCH' && l.url.startsWith('/api/admin/cuentas/')) {
      const id = l.url.split('/').at(-1)!
      const c = CUENTAS.find((k) => k.id === id)!
      return { estado: 200, cuerpo: { ...c, ...(l.cuerpo as object) } }
    }
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

const lista = async () => (await screen.findAllByRole('list')).at(-1)!

/** Fila de la lista de cuentas cuyo nombre empieza por `nombre`. */
const fila = async (nombre: string) => {
  await within(await lista()).findByText((t) => t.startsWith(nombre))
  return (await screen.findAllByRole('listitem')).find((li) =>
    li.textContent?.startsWith(nombre),
  ) as HTMLElement
}

async function accion(usuario: ReturnType<typeof userEvent.setup>, nombre: string, opcion: string) {
  await usuario.click(
    within(await fila(nombre)).getByRole('button', { name: `Acciones de ${nombre}` }),
  )
  await usuario.click(await screen.findByRole('menuitem', { name: opcion }))
}

describe('Admin › Cuentas', () => {
  it('/admin lleva a Cuentas y el enlace del menú apunta ahí', async () => {
    abrir('/admin')
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/admin/cuentas'))
    expect(await screen.findByRole('link', { name: 'Administración' })).toHaveAttribute(
      'href',
      '/admin',
    )
    const pestanas = screen.getByRole('navigation', { name: 'Secciones de administración' })
    expect(
      within(pestanas)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Cuentas', 'Catálogos', 'Parametrización'])
  })

  it('lista nombre, correo, rol, estado, charters y «nunca»', async () => {
    abrir()
    const ana = await fila('Ana Pérez')
    expect(within(ana).getByText('ana@hlingenieros.com')).toBeInTheDocument()
    expect(within(ana).getByText('Admin')).toBeInTheDocument()
    expect(within(ana).getByText('3')).toBeInTheDocument()
    expect(within(await fila('José Ruiz')).getByText('nunca')).toBeInTheDocument()
    // Por defecto, solo las activas.
    expect(screen.queryByText('Luisa Mora')).not.toBeInTheDocument()
  })

  it('busca sin tildes y filtra por estado', async () => {
    const { usuario } = abrir()
    await usuario.type(await screen.findByLabelText('Buscar'), 'jose')
    expect(within(await lista()).getByText('José Ruiz')).toBeInTheDocument()
    expect(within(await lista()).queryByText(/Ana Pérez/)).not.toBeInTheDocument()
    await usuario.clear(screen.getByLabelText('Buscar'))
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Desactivadas')
    expect(await screen.findByText('Luisa Mora')).toBeInTheDocument()
    expect(within(await fila('Luisa Mora')).getByText('Desactivada')).toBeInTheDocument()
    expect(screen.queryByText('José Ruiz')).not.toBeInTheDocument()
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Todas')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('restablece la clave: confirma, la muestra con «Copiar» y al cerrar desaparece', async () => {
    const escribir = vi.fn().mockResolvedValue(undefined)
    const { usuario, llamadas } = abrir('/admin/cuentas', (l) =>
      l.url === '/api/admin/cuentas/u2/restablecer-clave'
        ? { estado: 200, cuerpo: { claveTemporal: 'Kp7mXq2RtV9a' } }
        : undefined,
    )
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escribir },
      configurable: true,
    })
    await accion(usuario, 'José Ruiz', 'Restablecer clave')
    const confirmar = await screen.findByRole('dialog')
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)
    await usuario.click(within(confirmar).getByRole('button', { name: 'Restablecer clave' }))

    expect(await screen.findByText('Kp7mXq2RtV9a')).toBeInTheDocument()
    expect(
      screen.getByText('Pásasela a la persona; al entrar deberá cambiarla.'),
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(escribir).toHaveBeenCalledWith('Kp7mXq2RtV9a')
    await usuario.click(screen.getByRole('button', { name: 'Listo' }))
    await waitFor(() => expect(screen.queryByText('Kp7mXq2RtV9a')).not.toBeInTheDocument())
  })

  it('dar Admin y desactivar envían el PATCH esperado', async () => {
    const { usuario, llamadas } = abrir()
    await accion(usuario, 'José Ruiz', 'Dar Admin')
    await usuario.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Dar Admin' }),
    )
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')).toMatchObject({
        url: '/api/admin/cuentas/u2',
        cuerpo: { esAdmin: true },
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await accion(usuario, 'José Ruiz', 'Desactivar')
    await usuario.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Desactivar' }),
    )
    await waitFor(() =>
      expect(llamadas.filter((l) => l.metodo === 'PATCH').at(-1)).toMatchObject({
        url: '/api/admin/cuentas/u2',
        cuerpo: { activo: false },
      }),
    )
  })

  it('en la fila propia no están «Desactivar» ni «Quitar Admin»', async () => {
    const { usuario } = abrir()
    await usuario.click(
      within(await fila('Ana Pérez')).getByRole('button', { name: 'Acciones de Ana Pérez' }),
    )
    const opciones = (await screen.findAllByRole('menuitem')).map((o) => o.textContent)
    expect(opciones).toEqual(['Restablecer clave'])
  })

  it('el error ultimo_admin se muestra en un aviso', async () => {
    const { usuario } = abrir('/admin/cuentas', (l) =>
      l.metodo === 'PATCH'
        ? {
            estado: 409,
            cuerpo: {
              error: { codigo: 'ultimo_admin', mensaje: 'Debe quedar al menos un Admin activo.' },
            },
          }
        : undefined,
    )
    await accion(usuario, 'José Ruiz', 'Desactivar')
    await usuario.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Desactivar' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Debe quedar al menos un Admin activo.',
    )
  })
})
