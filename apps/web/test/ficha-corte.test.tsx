import {
  calcularCronograma,
  construirArbol,
  type ActividadEntrada,
  type CharterDetalle,
  type CorteDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
  REGLAS_POR_DEFECTO,
} from '@charter/shared'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { porcentaje } from '../src/formato'
import { simularApi, type Llamada } from './simular-api'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

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
  indicadores: [],
  riesgos: [],
  rubros: [],
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
  desv: 0,
  estado: 'en_atencion',
  vencidas: 0,
})

/** El último corte guardado coincide con el cálculo en vivo (salvo que se pida lo contrario). */
function armar(acts = ACTS) {
  const vivo = calcularCronograma(construirArbol(acts), { h1: { pct: 0.125 } }, '2026-11-09')
  const cortes = [
    corte('2026-11-02', 0.04, 0.02),
    corte('2026-11-05', 0.14, 0.07),
    corte('2026-11-09', vivo.proyecto.pv, 0.125),
  ]
  const cronograma: CronogramaRespuesta = {
    version: 1,
    actividades: acts,
    ultimoCorte: { fecha: '2026-11-09', avances: { h1: { pct: 0.125 } } },
  }
  return { cortes, cronograma }
}

function Ubicacion() {
  const l = useLocation()
  return <output data-testid="ubicacion">{l.pathname + l.search}</output>
}

const ubicacion = () => screen.getByTestId('ubicacion').textContent

function abrir(url: string, { cortes, cronograma } = armar()) {
  const llamadas = simularApi((l: Llamada) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma' && l.metodo === 'GET')
      return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cronograma' && l.metodo === 'PUT') {
      const cuerpo = l.cuerpo as { actividades: ActividadEntrada[] }
      return {
        estado: 200,
        cuerpo: { ...cronograma, version: 2, actividades: cuerpo.actividades },
      }
    }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: cortes }
    const fecha = l.url.match(/\/cortes\/(.+)$/)?.[1]
    const c = cortes.find((x) => x.fecha === fecha)
    if (c) {
      const foto: CorteDetalle = {
        ...c,
        avances: [
          {
            actividadId: 'h1',
            item: '1',
            nombre: 'Diseño',
            pct: c.ev,
            peso: 1,
            inicio: '2026-11-01',
            fin: '2026-11-30',
            eliminada: false,
          },
          {
            actividadId: 'x',
            item: '2',
            nombre: 'Compra vieja',
            pct: 0.5,
            peso: 0.2,
            inicio: '2026-11-01',
            fin: '2026-11-10',
            eliminada: true,
          },
        ],
      }
      return { estado: 200, cuerpo: foto }
    }
    return undefined
  })
  const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[url]}>
        <Rutas />
        <Ubicacion />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario }
}

const banda = async () =>
  within(await screen.findByRole('group', { name: 'Situación del charter' }))

describe('ficha en un corte elegido', () => {
  it('un corte pasado muestra lo guardado, en solo lectura', async () => {
    abrir('/charters/c1?corte=2026-11-02')
    expect(
      await screen.findByText(/Estás viendo el charter como estaba el 2 nov 2026 \(corte 1 de 3\)/),
    ).toBeInTheDocument()
    const b = await banda()
    expect(b.getByText(porcentaje(0.04))).toBeInTheDocument()
    expect(b.getByText(porcentaje(0.02))).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar corte' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Agregar actividad/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Estado del charter/ })).not.toBeInTheDocument()
  })

  it('«Volver al último corte» quita el parámetro y devuelve los controles', async () => {
    const { usuario } = abrir('/charters/c1?corte=2026-11-02')
    await usuario.click(await screen.findByRole('button', { name: 'Volver al último corte' }))
    expect(ubicacion()).toBe('/charters/c1')
    expect(await screen.findByRole('link', { name: 'Registrar corte' })).toBeInTheDocument()
    expect(screen.queryByText(/Estás viendo el charter/)).not.toBeInTheDocument()
  })

  it('una fecha que no es un corte muestra el último con un aviso', async () => {
    abrir('/charters/c1?corte=2020-01-01')
    expect(
      await screen.findByText('No hay un corte en esa fecha; se muestra el último.'),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Registrar corte' })).toBeInTheDocument()
  })

  it('el selector de la banda y el historial cambian el corte', async () => {
    const { usuario } = abrir('/charters/c1')
    await usuario.click(await screen.findByRole('button', { name: /^Corte: 9 nov/ }))
    await usuario.click(await screen.findByRole('menuitemradio', { name: /5 nov 2026/ }))
    expect(ubicacion()).toBe('/charters/c1?corte=2026-11-05')
    expect(await screen.findByText(/\(corte 2 de 3\)/)).toBeInTheDocument()

    const historial = within(screen.getByRole('region', { name: 'Cortes' }))
    await usuario.click(historial.getByRole('button', { name: 'Ver la ficha al 2 nov 2026' }))
    expect(ubicacion()).toBe('/charters/c1?corte=2026-11-02')
  })

  it('una edición pendiente se guarda aunque se cambie de corte', async () => {
    const { llamadas, usuario } = abrir('/charters/c1')
    const barra = await screen.findByRole('slider', { name: 'Fechas de Diseño' })
    barra.focus()
    await usuario.keyboard('{ArrowRight}')
    const historial = within(screen.getByRole('region', { name: 'Cortes' }))
    await usuario.click(historial.getByRole('button', { name: 'Ver la ficha al 2 nov 2026' }))
    await screen.findByText(/\(corte 1 de 3\)/)
    await act(() => vi.advanceTimersByTimeAsync(800))
    await waitFor(() =>
      expect(llamadas.some((l) => l.metodo === 'PUT' && l.url.endsWith('/cronograma'))).toBe(true),
    )
    await usuario.click(screen.getByRole('button', { name: 'Volver al último corte' }))
    expect(await screen.findByRole('slider', { name: 'Fechas de Diseño' })).toHaveAttribute(
      'aria-valuetext',
      '2 nov 2026 a 1 dic 2026',
    )
  })

  it('el Gantt de un corte marca lo que no existía y lo eliminado', async () => {
    const nueva: ActividadEntrada = { ...ACTS[0]!, id: 'h2', orden: 1, nombre: 'Pruebas' }
    abrir('/charters/c1?corte=2026-11-02', armar([...ACTS, nueva]))
    const s = within(await screen.findByRole('region', { name: 'Cronograma' }))
    expect(await s.findByText('no existía en este corte')).toBeInTheDocument()
    expect(s.getByText('Compra vieja')).toBeInTheDocument()
    expect(s.getByText('actividad eliminada')).toBeInTheDocument()
    expect(s.getByText(`${porcentaje(0.5)} real`)).toBeInTheDocument()
  })

  it('avisa si la línea base cambió desde el último corte', async () => {
    const datos = armar()
    const movidas = [{ ...ACTS[0]!, inicio: '2026-10-20' }]
    abrir('/charters/c1', { ...datos, cronograma: { ...datos.cronograma, actividades: movidas } })
    expect(await screen.findByText('Línea base modificada desde el corte')).toBeInTheDocument()
  })

  it('sin cambios no hay aviso de línea base', async () => {
    abrir('/charters/c1')
    await banda()
    await screen.findByRole('slider', { name: 'Fechas de Diseño' })
    expect(screen.queryByText('Línea base modificada desde el corte')).not.toBeInTheDocument()
  })
})
