import type {
  ActividadEntrada,
  CharterDetalle,
  CorteDetalle,
  CorteResumen,
  CronogramaRespuesta,
} from '@charter/shared'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 2, 10, 12))
})
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
  umbrales: { atencion: 10, riesgo: 25, atraso: 50 },
}

const hoja = (
  id: string,
  orden: number,
  nombre: string,
  peso: number,
  inicio: string,
  fin: string,
): ActividadEntrada => ({
  id,
  padreId: null,
  orden,
  nombre,
  entregable: null,
  peso,
  inicio,
  fin,
  responsables: ['Luis'],
})

const cronograma: CronogramaRespuesta = {
  version: 3,
  actividades: [
    hoja('a', 0, 'Levantamiento', 0.25, '2026-02-01', '2026-03-01'),
    hoja('b', 1, 'Diseño', 0.25, '2026-03-01', '2026-03-31'),
    hoja('c', 2, 'Pruebas', 0.5, '2026-04-01', '2026-04-30'),
  ],
  ultimoCorte: { fecha: '2026-03-05', avances: { a: { pct: 0.4 }, b: { pct: 0.6 } } },
}

const resumen: CorteResumen = {
  fecha: '2026-03-05',
  nota: 'Arranque',
  pv: 0.3,
  ev: 0.25,
  desv: 0,
  estado: 'al_dia',
  vencidas: 1,
}

const fotoDelCorte: CorteDetalle = {
  ...resumen,
  avances: [
    {
      actividadId: 'a',
      item: '1',
      nombre: 'Levantamiento',
      pct: 0.4,
      peso: 0.25,
      inicio: '2026-02-01',
      fin: '2026-03-01',
      eliminada: false,
    },
    {
      actividadId: 'b',
      item: '2',
      nombre: 'Diseño',
      pct: 0.6,
      peso: 0.25,
      inicio: '2026-03-01',
      fin: '2026-03-31',
      eliminada: false,
    },
    {
      actividadId: 'x',
      item: '3',
      nombre: 'Viejo',
      pct: 0.3,
      peso: 0.1,
      inicio: '2026-02-01',
      fin: '2026-02-20',
      eliminada: true,
    },
  ],
}

function abrir(ruta = '/charters/c1/corte', alGuardar?: (l: Llamada) => Respuesta) {
  const llamadas = simularApi((l) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: detalle }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma') return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: [resumen] }
    if (l.url === '/api/charters/c1/cortes/2026-03-05' && l.metodo === 'GET')
      return { estado: 200, cuerpo: fotoDelCorte }
    if (l.metodo === 'PUT' && l.url.startsWith('/api/charters/c1/cortes/'))
      return alGuardar?.(l) ?? { estado: 200, cuerpo: fotoDelCorte }
    return undefined
  })
  const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario }
}

const grupo = (nombre: RegExp) => within(screen.getByRole('region', { name: nombre }))
const campo = (nombre: string) =>
  screen.getByRole('textbox', { name: `Real de ${nombre}, en porcentaje` })

describe('registrar corte', () => {
  it('precarga los avances del último corte', async () => {
    abrir()
    await screen.findByRole('heading', { name: 'Registrar corte' })
    expect(campo('Levantamiento')).toHaveValue('40')
    expect(grupo(/^Vencidas/).getByText('Antes 40 %')).toBeInTheDocument()
    expect(grupo(/^En curso/).getByText('Diseño')).toBeInTheDocument()
    expect(screen.getByText('Corte anterior: 5 mar 2026')).toBeInTheDocument()
  })

  it('una vencida completada sale del grupo al cambiar la fecha', async () => {
    const { usuario } = abrir()
    await screen.findByRole('heading', { name: 'Registrar corte' })
    await usuario.clear(campo('Levantamiento'))
    await usuario.type(campo('Levantamiento'), '100')
    expect(grupo(/^Vencidas/).getByText('Levantamiento')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Fecha de corte'), { target: { value: '2026-03-09' } })
    expect(grupo(/^Vencidas/).queryByText('Levantamiento')).not.toBeInTheDocument()
  })

  it('avisa si el avance baja frente al corte anterior', async () => {
    const { usuario } = abrir()
    await screen.findByRole('heading', { name: 'Registrar corte' })
    await usuario.clear(campo('Diseño'))
    await usuario.type(campo('Diseño'), '50')
    expect(screen.getByText('Baja frente al corte anterior (60 %)')).toBeInTheDocument()
  })

  it('guarda todas las hojas con la fecha de hoy y vuelve a la ficha', async () => {
    const { llamadas, usuario } = abrir()
    await screen.findByRole('heading', { name: 'Registrar corte' })
    await usuario.type(screen.getByLabelText('Nota del corte'), 'Avanza')
    await usuario.click(screen.getAllByRole('button', { name: 'Guardar corte' })[0]!)
    expect(await screen.findByText('Corte guardado')).toBeInTheDocument()
    const put = llamadas.find((l) => l.metodo === 'PUT')!
    expect(put.url).toBe('/api/charters/c1/cortes/2026-03-10')
    expect(put.cuerpo).toEqual({
      nota: 'Avanza',
      avances: [
        { actividadId: 'a', pct: 0.4 },
        { actividadId: 'b', pct: 0.6 },
        { actividadId: 'c', pct: 0 },
      ],
    })
  })

  it('al editar usa la foto del corte y rotula las actividades eliminadas', async () => {
    abrir('/charters/c1/corte?fecha=2026-03-05')
    await screen.findByRole('heading', { name: 'Editar corte' })
    expect(await screen.findByText('actividad eliminada')).toBeInTheDocument()
    expect(screen.getByLabelText('Nota del corte')).toHaveValue('Arranque')
    expect(screen.queryByLabelText('Fecha de corte')).not.toBeInTheDocument()
  })

  it('muestra el error de la API junto al botón', async () => {
    const { usuario } = abrir('/charters/c1/corte', () => ({
      estado: 400,
      cuerpo: {
        error: {
          codigo: 'corte_anterior',
          mensaje: 'Ya hay un corte más reciente. Edítalo o usa una fecha posterior.',
        },
      },
    }))
    await screen.findByRole('heading', { name: 'Registrar corte' })
    await usuario.click(screen.getAllByRole('button', { name: 'Guardar corte' })[0]!)
    await waitFor(() =>
      expect(
        screen.getAllByText('Ya hay un corte más reciente. Edítalo o usa una fecha posterior.')[0],
      ).toBeInTheDocument(),
    )
  })
})
