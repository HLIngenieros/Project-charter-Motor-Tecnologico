import {
  calcularCronograma,
  construirArbol,
  type ActividadEntrada,
  type CharterDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
  REGLAS_POR_DEFECTO,
} from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
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
  reglas: REGLAS_POR_DEFECTO,
}

const actividades: ActividadEntrada[] = [
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

const cronograma: CronogramaRespuesta = {
  version: 1,
  actividades,
  ultimoCorte: { fecha: '2026-11-09', avances: { h1: { pct: 0.125 } } },
}

const corte = (fecha: string, pv: number, ev: number, nota = ''): CorteResumen => ({
  fecha,
  nota,
  pv,
  ev,
  desv: 0,
  estado: 'en_atencion',
  vencidas: 0,
})

const CORTES = [corte('2026-11-02', 0.2, 0.1, 'Arranque'), corte('2026-11-09', 0.3, 0.125)]

function abrir(detalleCharter = detalle) {
  let cortes = [...CORTES]
  const llamadas = simularApi((l) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: detalleCharter }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma') return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: cortes }
    if (l.metodo === 'DELETE' && l.url.startsWith('/api/charters/c1/cortes/')) {
      const fecha = l.url.split('/').pop()
      cortes = cortes.filter((c) => c.fecha !== fecha)
      return { estado: 204 }
    }
    return undefined
  })
  const usuario = userEvent.setup()
  render(
    <Proveedores>
      <MemoryRouter initialEntries={['/charters/c1']}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario }
}

const historial = async () => within(await screen.findByRole('region', { name: 'Cortes' }))

describe('banda e historial de cortes', () => {
  it('lista los cortes del más reciente al más viejo', async () => {
    abrir()
    const h = await historial()
    await h.findByText('2 nov 2026')
    const filas = h.getAllByRole('row')
    expect(filas).toHaveLength(3)
    expect(within(filas[1]!).getByText('9 nov 2026')).toBeInTheDocument()
    expect(within(filas[1]!).getByText('12,5 %')).toBeInTheDocument()
    expect(within(filas[2]!).getByText('2 nov 2026')).toBeInTheDocument()
    expect(within(filas[2]!).getByText('Arranque')).toBeInTheDocument()
  })

  it('la banda muestra la situación al último corte', async () => {
    abrir()
    const banda = within(await screen.findByRole('group', { name: 'Situación del charter' }))
    const pv = calcularCronograma(construirArbol(actividades), { h1: { pct: 0.125 } }, '2026-11-09')
      .proyecto.pv
    expect(banda.getByText(porcentaje(pv))).toBeInTheDocument()
    expect(banda.getByText('12,5 %')).toBeInTheDocument()
    expect(banda.getByText('9 nov 2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar corte' })).toHaveAttribute(
      'href',
      '/charters/c1/corte',
    )
  })

  it('eliminar un corte pide confirmación y lo quita', async () => {
    const { llamadas, usuario } = abrir()
    const h = await historial()
    await h.findByText('2 nov 2026')
    await usuario.click(h.getByRole('button', { name: 'Eliminar el corte del 9 nov 2026' }))
    const dialogo = within(await screen.findByRole('dialog'))
    expect(
      dialogo.getByText(
        'Se eliminará el corte del 9 nov 2026. Sus avances no se pueden recuperar.',
      ),
    ).toBeInTheDocument()
    await usuario.click(dialogo.getByRole('button', { name: 'Eliminar corte' }))
    await waitFor(() => expect(h.queryByText('9 nov 2026')).not.toBeInTheDocument())
    expect(
      llamadas.some((l) => l.metodo === 'DELETE' && l.url === '/api/charters/c1/cortes/2026-11-09'),
    ).toBe(true)
  })

  it('en solo lectura no se registra ni se elimina', async () => {
    abrir({ ...detalle, estado: 'cerrado', permisos: { editar: false, reabrir: true } })
    const h = await historial()
    await h.findByText('2 nov 2026')
    expect(h.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar corte' })).not.toBeInTheDocument()
  })
})
