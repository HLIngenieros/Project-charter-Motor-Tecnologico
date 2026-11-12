import type { CategoriaPublica, CharterResumen } from '@charter/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { RutaProtegida } from '../src/app/RutaProtegida'
import { hoyISO } from '../src/formato'
import { filtrarCharters, FILTROS_VACIOS } from '../src/pantallas/portafolio/filtrar'
import { Portafolio } from '../src/pantallas/portafolio/Portafolio'
import { sumarDias } from '@charter/shared'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const automatizacion: CategoriaPublica = {
  id: 'cat-a',
  nombre: 'Automatización',
  color: '#D98A00',
  colorFondo: '#FBF1DF',
  activa: true,
  protegida: false,
}

function charter(p: Partial<CharterResumen> & { id: string; nombre: string }): CharterResumen {
  return {
    codigo: null,
    responsable: 'Ana Pérez',
    estado: 'activo',
    categoria: null,
    area: null,
    propietario: { id: 'u-ana', nombre: 'Ana Pérez' },
    actualizadoEn: '2026-11-01T10:00:00.000Z',
    ultimoCorte: null,
    cortes: [],
    ...p,
  }
}

const tres = [
  charter({ id: 'c1', nombre: 'Potenciación del área de TI', categoria: automatizacion }),
  charter({
    id: 'c2',
    nombre: 'Plataforma de control de obra',
    responsable: 'Luis Gómez',
    ultimoCorte: {
      fecha: sumarDias(hoyISO(), -30),
      pv: 0.4,
      ev: 0.2,
      estado: 'en_riesgo',
      vencidas: 0,
    },
  }),
  charter({ id: 'c3', nombre: 'Consulta de especificaciones', codigo: 'C1' }),
  charter({
    id: 'c4',
    nombre: 'Mesa de ayuda',
    ultimoCorte: { fecha: hoyISO(), pv: 0.382, ev: 0.269, estado: 'en_atencion', vencidas: 2 },
    cortes: [
      { fecha: sumarDias(hoyISO(), -14), pv: 0.1, ev: 0.08 },
      { fecha: sumarDias(hoyISO(), -7), pv: 0.25, ev: 0.18 },
      { fecha: hoyISO(), pv: 0.382, ev: 0.269 },
    ],
  }),
]

function abrir(responder: (l: Llamada) => Respuesta | undefined) {
  const llamadas = simularApi((l) => {
    if (l.url === '/api/categorias') return { estado: 200, cuerpo: [automatizacion] }
    if (l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    return responder(l)
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Portafolio />
              </RutaProtegida>
            }
          />
          <Route path="/charters/:id" element={<p>Ficha abierta</p>} />
        </Routes>
      </MemoryRouter>
    </Proveedores>,
  )
  return llamadas
}

const conLista = (lista: CharterResumen[]) => (l: Llamada) =>
  l.url === '/api/charters' && l.metodo === 'GET' ? { estado: 200, cuerpo: lista } : undefined

describe('filtrarCharters', () => {
  it('busca sin tildes ni mayúsculas', () => {
    const r = filtrarCharters(tres, { ...FILTROS_VACIOS, texto: 'POTENCIACION' })
    expect(r.map((c) => c.id)).toEqual(['c1'])
  })

  it('busca también en código y responsable', () => {
    expect(filtrarCharters(tres, { ...FILTROS_VACIOS, texto: 'c1' }).map((c) => c.id)).toEqual([
      'c3',
    ])
    expect(filtrarCharters(tres, { ...FILTROS_VACIOS, texto: 'gómez' }).map((c) => c.id)).toEqual([
      'c2',
    ])
  })

  it('categoría «ninguna» deja solo los sin categoría', () => {
    const r = filtrarCharters(tres, { ...FILTROS_VACIOS, categoria: 'ninguna' })
    expect(r.map((c) => c.id)).toEqual(['c2', 'c3', 'c4'])
  })

  it('estado «sin_cortes» deja los que no tienen corte', () => {
    const r = filtrarCharters(tres, { ...FILTROS_VACIOS, estado: 'sin_cortes' })
    expect(r.map((c) => c.id)).toEqual(['c1', 'c3'])
  })

  it('estado «con_vencidas» deja los que tienen vencidas en el último corte', () => {
    const r = filtrarCharters(tres, { ...FILTROS_VACIOS, estado: 'con_vencidas' })
    expect(r.map((c) => c.id)).toEqual(['c4'])
  })
})

describe('portafolio', () => {
  it('sin charters invita a crear el primero', async () => {
    abrir(conLista([]))
    expect(await screen.findByRole('heading', { name: 'Aún no tienes charters' })).toBeVisible()
  })

  it('lista los charters con su enlace y el contador', async () => {
    abrir(conLista(tres))
    expect(await screen.findByText('4 de 4 charters')).toBeInTheDocument()
    for (const c of tres) {
      expect(screen.getByRole('link', { name: new RegExp(c.nombre) })).toHaveAttribute(
        'href',
        `/charters/${c.id}`,
      )
    }
  })

  it('buscar filtra y «Limpiar filtros» los quita', async () => {
    const usuario = userEvent.setup()
    abrir(conLista(tres))
    await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar' }), 'xyz')
    expect(await screen.findByText('Ningún charter coincide')).toBeInTheDocument()
    expect(screen.getByText('0 de 4 charters')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(await screen.findByText('4 de 4 charters')).toBeInTheDocument()
  })

  it('muestra hace cuánto fue el último corte y el aviso sin cortes', async () => {
    abrir(conLista(tres))
    const conCorte = await screen.findByRole('link', { name: /Plataforma de control/ })
    expect(within(conCorte).getByText('hace 30 días')).toHaveClass('text-amarillo-texto')
    expect(within(conCorte).getByText('En riesgo')).toBeInTheDocument()
    const sinCorte = screen.getByRole('link', { name: /Potenciación/ })
    expect(within(sinCorte).getByText('Registra el primer corte')).toBeInTheDocument()
  })
})

describe('avance en el portafolio', () => {
  it('muestra real de planeado, el chip del último corte y las vencidas', async () => {
    abrir(conLista(tres))
    const fila = await screen.findByRole('link', { name: /Mesa de ayuda/ })
    expect(within(fila).getByText(/26,9\s%/)).toBeInTheDocument()
    expect(fila).toHaveTextContent(/26,9\s% de 38,2\s%/)
    expect(within(fila).getByText('En atención')).toBeInTheDocument()
    expect(within(fila).getByText('2 vencidas')).toHaveClass('text-vencida')
    expect(within(fila).getByText('hoy')).not.toHaveClass('text-amarillo-texto')
  })

  it('el filtro «Con vencidas» deja solo los que tienen', async () => {
    const usuario = userEvent.setup()
    abrir(conLista(tres))
    await usuario.selectOptions(await screen.findByLabelText('Estado'), 'con_vencidas')
    expect(await screen.findByText('1 de 4 charters')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mesa de ayuda/ })).toBeInTheDocument()
  })
})

describe('nuevo charter', () => {
  it('sin nombre no envía', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir(conLista([]))
    await usuario.click((await screen.findAllByRole('button', { name: /Nuevo charter/ }))[0]!)
    await usuario.click(screen.getByRole('button', { name: 'Crear charter' }))
    expect(await screen.findByText('Escribe el nombre del charter')).toBeInTheDocument()
    expect(llamadas.filter((l) => l.metodo === 'POST')).toHaveLength(0)
  })

  it('con nombre envía una sola vez y abre la ficha', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir((l) => {
      if (l.url === '/api/charters' && l.metodo === 'POST')
        return { estado: 201, cuerpo: { id: 'nuevo' }, demora: 50 }
      return conLista([])(l)
    })
    await usuario.click((await screen.findAllByRole('button', { name: /Nuevo charter/ }))[0]!)
    await usuario.type(screen.getByLabelText('Nombre'), 'Mi charter')
    await usuario.selectOptions(screen.getByLabelText('Categoría'), 'cat-a')
    await usuario.dblClick(screen.getByRole('button', { name: 'Crear charter' }))
    expect(await screen.findByText('Ficha abierta')).toBeInTheDocument()
    const posts = llamadas.filter((l) => l.metodo === 'POST')
    expect(posts).toHaveLength(1)
    expect(posts[0]!.cuerpo).toEqual({ nombre: 'Mi charter', categoriaId: 'cat-a' })
  })
})
