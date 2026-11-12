import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'

interface Llamada {
  url: string
  metodo: string
  cuerpo: unknown
  cabeceras: Record<string, string>
}

type Respuesta = { estado: number; cuerpo?: unknown }

let llamadas: Llamada[] = []
let responder: (l: Llamada) => Respuesta

const usuarioAna = {
  id: '1',
  correo: 'ana@hlingenieros.com',
  nombre: 'Ana Pérez',
  esAdmin: false,
  debeCambiarClave: false,
}

const noAutenticado: Respuesta = {
  estado: 401,
  cuerpo: { error: { codigo: 'no_autenticado', mensaje: 'Tu sesión terminó.' } },
}

beforeEach(() => {
  llamadas = []
  responder = () => noAutenticado
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const l: Llamada = {
        url,
        metodo: init.method ?? 'GET',
        cuerpo: init.body ? JSON.parse(String(init.body)) : undefined,
        cabeceras: Object.fromEntries(new Headers(init.headers).entries()),
      }
      llamadas.push(l)
      // El portafolio pide sus listas; aquí solo importa la sesión.
      const r =
        l.metodo === 'GET' && ['/api/charters', '/api/categorias', '/api/areas'].includes(url)
          ? { estado: 200, cuerpo: [] }
          : responder(l)
      return new Response(r.cuerpo === undefined ? null : JSON.stringify(r.cuerpo), {
        status: r.estado,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
})

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

const mutaciones = () => llamadas.filter((l) => l.metodo !== 'GET')

describe('registro', () => {
  it('con un correo de otro dominio avisa sin llamar a la API', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    await usuario.type(await screen.findByLabelText('Nombre'), 'Ana Pérez')
    await usuario.type(screen.getByLabelText('Correo'), 'x@gmail.com')
    await usuario.type(screen.getByLabelText('Clave'), 'clave-segura-1')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Usa tu correo @hlingenieros.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    expect(mutaciones()).toHaveLength(0)
  })

  it('muestra como aviso el 409 de la API', async () => {
    const usuario = userEvent.setup()
    responder = (l) =>
      l.url === '/api/auth/registro'
        ? {
            estado: 409,
            cuerpo: {
              error: {
                codigo: 'registro_rechazado',
                mensaje: 'No fue posible crear la cuenta con ese correo',
              },
            },
          }
        : noAutenticado
    abrir('/registro')
    await usuario.type(await screen.findByLabelText('Nombre'), 'Ana Pérez')
    await usuario.type(screen.getByLabelText('Correo'), 'ana@hlingenieros.com')
    await usuario.type(screen.getByLabelText('Clave'), 'clave-segura-1')
    await usuario.type(screen.getByLabelText('Confirmar clave'), 'clave-segura-1')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible crear la cuenta con ese correo',
    )
    const [registro] = mutaciones()
    expect(registro).toMatchObject({
      url: '/api/auth/registro',
      metodo: 'POST',
      cuerpo: { correo: 'ana@hlingenieros.com', nombre: 'Ana Pérez', clave: 'clave-segura-1' },
    })
    expect(registro!.cabeceras['x-requested-with']).toBe('charter')
  })

  it('pone en el campo los errores de la API que traen campos', async () => {
    const usuario = userEvent.setup()
    responder = (l) =>
      l.url === '/api/auth/registro'
        ? {
            estado: 400,
            cuerpo: {
              error: {
                codigo: 'datos_invalidos',
                mensaje: 'Revisa los datos',
                campos: { nombre: 'El nombre no es válido' },
              },
            },
          }
        : noAutenticado
    abrir('/registro')
    await usuario.type(await screen.findByLabelText('Nombre'), 'Ana Pérez')
    await usuario.type(screen.getByLabelText('Correo'), 'ana@hlingenieros.com')
    await usuario.type(screen.getByLabelText('Clave'), 'clave-segura-1')
    await usuario.type(screen.getByLabelText('Confirmar clave'), 'clave-segura-1')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('El nombre no es válido')).toBeInTheDocument()
  })

  it('si la confirmación no coincide avisa sin llamar a la API', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    await usuario.type(await screen.findByLabelText('Nombre'), 'Ana Pérez')
    await usuario.type(screen.getByLabelText('Correo'), 'ana@hlingenieros.com')
    await usuario.type(screen.getByLabelText('Clave'), 'clave-segura-1')
    await usuario.type(screen.getByLabelText('Confirmar clave'), 'clave-segura-2')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Las claves no coinciden')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar clave')).toHaveAttribute('aria-invalid', 'true')
    expect(mutaciones()).toHaveLength(0)
  })

  it('el botón del ojo muestra y oculta la clave', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    const clave = await screen.findByLabelText('Clave')
    const ojo = screen.getByRole('button', { name: 'Mostrar clave' })
    expect(clave).toHaveAttribute('type', 'password')

    await usuario.click(ojo)
    expect(clave).toHaveAttribute('type', 'text')
    expect(ojo).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Confirmar clave')).toHaveAttribute('type', 'password')

    await usuario.click(ojo)
    expect(clave).toHaveAttribute('type', 'password')
  })
})

describe('rutas', () => {
  it('sin sesión, la ruta protegida redirige a /entrar', async () => {
    abrir('/')
    expect(await screen.findByRole('heading', { name: 'Entra a tus charters' })).toBeInTheDocument()
  })

  it('con sesión, /entrar redirige al inicio', async () => {
    responder = () => ({ estado: 200, cuerpo: usuarioAna })
    abrir('/entrar')
    expect(await screen.findByRole('heading', { name: 'Mis charters' })).toBeInTheDocument()
  })

  it('un login exitoso navega al inicio', async () => {
    const usuario = userEvent.setup()
    responder = (l) =>
      l.url === '/api/auth/login' ? { estado: 200, cuerpo: usuarioAna } : noAutenticado
    abrir('/entrar')
    await usuario.type(await screen.findByLabelText('Correo'), 'ana@hlingenieros.com')
    await usuario.type(screen.getByLabelText('Clave'), 'clave-segura-1')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Mis charters' })).toBeInTheDocument()
  })

  it('salir vuelve a /entrar', async () => {
    const usuario = userEvent.setup()
    let conSesion = true
    responder = (l) => {
      if (l.url === '/api/auth/logout') {
        conSesion = false
        return { estado: 204 }
      }
      return conSesion ? { estado: 200, cuerpo: usuarioAna } : noAutenticado
    }
    abrir('/')
    await usuario.click(await screen.findByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Entra a tus charters' })).toBeInTheDocument()
  })

  it('con debeCambiarClave muestra el aviso en el inicio', async () => {
    responder = () => ({ estado: 200, cuerpo: { ...usuarioAna, debeCambiarClave: true } })
    abrir('/')
    expect(await screen.findByText(/Debes cambiar tu clave/)).toBeInTheDocument()
  })
})
