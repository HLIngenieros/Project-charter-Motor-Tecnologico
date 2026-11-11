import {
  calcularCronograma,
  construirArbol,
  type ActividadEntrada,
  type CharterDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
} from '@charter/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { porcentaje } from '../src/formato'
import { simularApi } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

const detalle: CharterDetalle = {
  id: 'c1',
  nombre: 'Plan TI',
  codigo: null,
  categoriaId: null,
  areaId: null,
  responsable: '',
  patrocinador: '',
  revision: '',
  razonDeSer: '',
  objetivoGeneral: '',
  estado: 'activo',
  creadoEn: '2026-01-01T15:00:00.000Z',
  actualizadoEn: '2026-01-01T15:00:00.000Z',
  propietario: { id: 'u1', nombre: 'Ana Pérez' },
  listas: { objetivo: [], supuesto: [], criterio_exito: [] },
  permisos: { editar: true, reabrir: false },
  umbrales: { atencion: 10, riesgo: 25, atraso: 50 },
}

const ACTS: ActividadEntrada[] = [
  {
    id: 'h1',
    padreId: null,
    orden: 0,
    nombre: 'Diseño',
    entregable: null,
    peso: 1,
    inicio: '2026-11-01',
    fin: '2026-11-30',
    responsables: [],
  },
]

const corte = (fecha: string, pv: number, ev: number): CorteResumen => ({
  fecha,
  nota: '',
  pv,
  ev,
  desv: pv - ev,
  estado: 'en_atencion',
  vencidas: 0,
})

function Ubicacion() {
  const l = useLocation()
  return <output data-testid="ubicacion">{l.pathname + l.search}</output>
}

function abrir({
  actividades = ACTS,
  pct = 0.125,
  conCortes = true,
}: { actividades?: ActividadEntrada[]; pct?: number; conCortes?: boolean } = {}) {
  const vivo = calcularCronograma(construirArbol(actividades), { h1: { pct } }, '2026-11-09')
  const cortes = conCortes
    ? [corte('2026-11-02', 0.04, 0.02), corte('2026-11-09', vivo.proyecto.pv, pct)]
    : []
  const cronograma: CronogramaRespuesta = {
    version: 1,
    actividades,
    ultimoCorte: conCortes
      ? {
          fecha: '2026-11-09',
          avances: { h1: { pct, terminadaEn: pct >= 1 ? '2026-11-09' : null } },
        }
      : null,
  }
  simularApi((l) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma') return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: cortes }
    return undefined
  })
  const usuario = userEvent.setup()
  const vista = render(
    <Proveedores>
      <MemoryRouter initialEntries={['/charters/c1']}>
        <Rutas />
        <Ubicacion />
      </MemoryRouter>
    </Proveedores>,
  )
  return { usuario, vivo, container: vista.container }
}

const seccion = async () => within(await screen.findByRole('region', { name: 'Curva S' }))

describe('curva S de la ficha', () => {
  it('lee el último corte y el fin al ritmo actual', async () => {
    const { vivo } = abrir()
    const s = await seccion()
    const lectura = within(await s.findByRole('group', { name: 'Lectura de la curva' }))
    expect(lectura.getByText('Último corte')).toBeInTheDocument()
    expect(lectura.getByText('9 nov 2026')).toBeInTheDocument()
    expect(lectura.getByText(porcentaje(vivo.proyecto.pv))).toBeInTheDocument()
    expect(lectura.getByText('12,5 %')).toBeInTheDocument()
    expect(lectura.getByText('Fin al ritmo actual')).toBeInTheDocument()
    expect(s.getByRole('img', { name: /^Curva S/ })).toBeInTheDocument()
  })

  it('con avance pendiente dibuja la proyección', async () => {
    const { container } = abrir()
    await seccion()
    await screen.findByRole('group', { name: 'Lectura de la curva' })
    expect(container.querySelector('[data-curva="proyeccion"]')).not.toBeNull()
  })

  it('clic en un punto de corte elige ese corte', async () => {
    const { usuario } = abrir()
    const s = await seccion()
    await usuario.click(await s.findByRole('button', { name: 'Corte del 2 nov 2026, En atención' }))
    expect(screen.getByTestId('ubicacion').textContent).toBe('/charters/c1?corte=2026-11-02')
    expect(await screen.findByText(/\(corte 1 de 2\)/)).toBeInTheDocument()
  })

  it('el zoom cambia entre todo el proyecto y los cortes', async () => {
    const { usuario } = abrir()
    const s = await seccion()
    const cortes = await s.findByRole('button', { name: 'Cortes' })
    expect(s.getByRole('button', { name: 'Todo el proyecto' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await usuario.click(cortes)
    expect(cortes).toHaveAttribute('aria-pressed', 'true')
  })

  it('sin cortes dibuja solo la planeada y pide el primero', async () => {
    const { container } = abrir({ conCortes: false })
    const s = await seccion()
    expect(
      await s.findByText('Registra el primer corte para ver el avance real.'),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-curva="planeada"]')).not.toBeNull()
    expect(container.querySelector('[data-curva="real"]')).toBeNull()
  })

  it('sin cronograma programado lleva al cronograma', async () => {
    abrir({ actividades: [], conCortes: false })
    const s = await seccion()
    expect(await s.findByText('Programa el cronograma para ver la curva S.')).toBeInTheDocument()
    expect(s.getByRole('link', { name: 'Ir al cronograma' })).toHaveAttribute('href', '#cronograma')
  })

  it('un charter al 100 % no tiene proyección', async () => {
    const { container } = abrir({ pct: 1 })
    await seccion()
    await screen.findByRole('group', { name: 'Lectura de la curva' })
    expect(container.querySelector('[data-curva="real"]')).not.toBeNull()
    expect(container.querySelector('[data-curva="proyeccion"]')).toBeNull()
  })
})
