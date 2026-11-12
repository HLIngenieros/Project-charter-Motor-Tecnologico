import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, usuarioAna, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

function abrir(ruta: string) {
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
}

/** Sesión con o sin clave restablecida; las listas del portafolio vienen vacías. */
function conSesion(debeCambiarClave: boolean, otra?: (l: Llamada) => Respuesta | undefined) {
  let sesion = { ...usuarioAna, debeCambiarClave }
  return simularApi((l) => {
    if (l.url === '/api/auth/yo') return { estado: 200, cuerpo: sesion }
    if (l.url === '/api/auth/cambiar-clave') {
      const r = otra?.(l)
      if (r) return r
      sesion = { ...sesion, debeCambiarClave: false }
      return { estado: 204 }
    }
    if (l.metodo === 'GET' && ['/api/charters', '/api/categorias', '/api/areas'].includes(l.url))
      return { estado: 200, cuerpo: [] }
    return otra?.(l)
  })
}

async function llenar(actual: string, nueva: string, confirmar: string) {
  const u = userEvent.setup()
  await u.type(await screen.findByLabelText('Clave actual'), actual)
  await u.type(screen.getByLabelText('Clave nueva'), nueva)
  await u.type(screen.getByLabelText('Confirmar clave'), confirmar)
  await u.click(screen.getByRole('button', { name: 'Cambiar clave' }))
}

describe('olvido de clave', () => {
  it('Entrar dice a quién acudir', async () => {
    simularApi((l) =>
      l.url === '/api/auth/yo'
        ? { estado: 401, cuerpo: { error: { codigo: 'no_autenticado', mensaje: 'x' } } }
        : undefined,
    )
    abrir('/entrar')
    expect(
      await screen.findByText('¿Olvidaste tu clave? Contacta al administrador del sistema.'),
    ).toBeInTheDocument()
  })
})

describe('cambiar clave', () => {
  it('con la clave restablecida, un enlace profundo termina en /cuenta/clave', async () => {
    conSesion(true)
    abrir('/charters/x')
    expect(
      await screen.findByText('Tu clave fue restablecida. Elige una nueva para seguir.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cambiar clave' })).toBeInTheDocument()
  })

  it('sin la marca, muestra el formulario sin el texto y el menú tiene el enlace', async () => {
    conSesion(false)
    abrir('/cuenta/clave')
    expect(await screen.findByLabelText('Clave actual')).toBeInTheDocument()
    expect(screen.queryByText(/fue restablecida/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cambiar clave' })).toHaveAttribute(
      'href',
      '/cuenta/clave',
    )
  })

  it('claves nuevas distintas: error en «Confirmar clave» sin enviar', async () => {
    const llamadas = conSesion(false)
    abrir('/cuenta/clave')
    await llenar('vieja-clave-1', 'nueva-clave-1', 'otra-clave-2')
    expect(await screen.findByText('Las claves no coinciden')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar clave')).toHaveAttribute('aria-invalid', 'true')
    expect(llamadas.filter((l) => l.metodo === 'POST')).toHaveLength(0)
  })

  it('clave nueva corta: error sin enviar', async () => {
    const llamadas = conSesion(false)
    abrir('/cuenta/clave')
    await llenar('vieja-clave-1', 'corta', 'corta')
    expect(screen.getByLabelText('Clave nueva')).toHaveAttribute('aria-invalid', 'true')
    expect(llamadas.filter((l) => l.metodo === 'POST')).toHaveLength(0)
  })

  it('400 clave_incorrecta va al campo «Clave actual»', async () => {
    conSesion(false, () => ({
      estado: 400,
      cuerpo: {
        error: {
          codigo: 'clave_incorrecta',
          mensaje: 'La clave actual no es correcta',
          campos: { claveActual: 'La clave actual no es correcta' },
        },
      },
    }))
    abrir('/cuenta/clave')
    await llenar('mala-clave-1', 'nueva-clave-1', 'nueva-clave-1')
    expect(await screen.findByText('La clave actual no es correcta')).toBeInTheDocument()
    expect(screen.getByLabelText('Clave actual')).toHaveAttribute('aria-invalid', 'true')
  })

  it('al cambiarla va al portafolio con el aviso «Clave cambiada»', async () => {
    const llamadas = conSesion(true)
    abrir('/cuenta/clave')
    await llenar('TEMPORAL2345', 'nueva-clave-1', 'nueva-clave-1')
    expect(await screen.findByText('Clave cambiada')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mis charters' })).toBeInTheDocument()
    expect(llamadas.find((l) => l.url === '/api/auth/cambiar-clave')?.cuerpo).toEqual({
      claveActual: 'TEMPORAL2345',
      claveNueva: 'nueva-clave-1',
    })
    // La sesión se volvió a pedir: ya no hay marca y no vuelve a /cuenta/clave.
    await waitFor(() =>
      expect(llamadas.filter((l) => l.url === '/api/auth/yo').length).toBeGreaterThan(1),
    )
    expect(screen.queryByText(/fue restablecida/)).not.toBeInTheDocument()
  })
})
