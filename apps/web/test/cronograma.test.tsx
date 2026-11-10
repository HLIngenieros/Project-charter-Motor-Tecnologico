import type { ActividadEntrada, CharterDetalle, CronogramaRespuesta } from '@charter/shared'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

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
}

const hoja = (id: string, extra: Partial<ActividadEntrada> = {}): ActividadEntrada => ({
  id,
  padreId: null,
  orden: 0,
  nombre: id,
  entregable: null,
  peso: null,
  inicio: null,
  fin: null,
  responsables: [],
  ...extra,
})

interface Opciones {
  cronograma?: CronogramaRespuesta
  detalleCharter?: CharterDetalle
  alGuardar?: (l: Llamada, n: number) => Respuesta | undefined
}

function abrir({
  cronograma = { version: 0, actividades: [], ultimoCorte: null },
  detalleCharter = detalle,
  alGuardar,
}: Opciones = {}) {
  let version = cronograma.version
  let puts = 0
  const llamadas = simularApi((l) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: detalleCharter }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma' && l.metodo === 'GET')
      return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cronograma' && l.metodo === 'PUT') {
      puts++
      const propia = alGuardar?.(l, puts)
      if (propia) return propia
      version++
      const cuerpo = l.cuerpo as { actividades: ActividadEntrada[] }
      return {
        estado: 200,
        cuerpo: { version, actividades: cuerpo.actividades, ultimoCorte: cronograma.ultimoCorte },
      }
    }
    return undefined
  })
  const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={['/charters/c1']}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
  return { llamadas, usuario }
}

const puts = (llamadas: Llamada[]) =>
  llamadas.filter((l) => l.metodo === 'PUT' && l.url.endsWith('/cronograma'))

const esperarGuardado = () => act(() => vi.advanceTimersByTimeAsync(800))

/** La sección ya cargada (la cabecera de la tabla aparece al llegar el cronograma). */
async function seccion() {
  const s = within(await screen.findByRole('region', { name: 'Cronograma' }))
  await s.findByText('Fechas')
  return s
}

describe('cronograma de la ficha', () => {
  it('arma un árbol con el teclado y lo guarda en un solo PUT', async () => {
    const { llamadas, usuario } = abrir()
    const s = await seccion()
    await usuario.click(s.getByRole('button', { name: 'Agregar actividad' }))
    await usuario.keyboard('Diseño{Enter}Maqueta{Tab}')
    expect(s.getByText('1.1')).toBeInTheDocument()

    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    const cuerpo = puts(llamadas)[0]!.cuerpo as {
      version: number
      actividades: ActividadEntrada[]
    }
    expect(cuerpo.version).toBe(0)
    const [diseno, maqueta] = cuerpo.actividades
    expect(diseno!.nombre).toBe('Diseño')
    expect(maqueta).toMatchObject({ nombre: 'Maqueta', padreId: diseno!.id })
  })

  it('calcula el planeado al escribir peso y fechas', async () => {
    const { usuario } = abrir({
      cronograma: {
        version: 3,
        actividades: [hoja('a', { nombre: 'Levantamiento' })],
        ultimoCorte: { fecha: '2026-03-01', avances: {} },
      },
    })
    const s = await seccion()
    await usuario.click(s.getByText('Levantamiento'))
    await usuario.type(s.getByRole('textbox', { name: 'Peso (%)' }), '100{Enter}')
    await usuario.type(s.getByLabelText('Inicio'), '2026-02-01')
    await usuario.type(s.getByLabelText('Fin'), '2026-03-31')
    // Del 1-feb al 31-mar son 59 días; al 1-mar van 29: 49,2 % planeado.
    expect(s.getByText('49,2 %')).toBeInTheDocument()
    expect(s.getAllByText('En riesgo').length).toBeGreaterThan(0)
  })

  it('cada PUT lleva la versión que devolvió el anterior', async () => {
    const { llamadas, usuario } = abrir({
      cronograma: { version: 0, actividades: [hoja('a')], ultimoCorte: null },
    })
    const s = await seccion()
    await usuario.click(s.getByText('a'))
    const nombre = s.getByRole('textbox', { name: 'Actividad' })
    await usuario.type(nombre, 'b')
    await esperarGuardado()
    await usuario.type(nombre, 'c')
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(2))
    expect((puts(llamadas)[1]!.cuerpo as { version: number }).version).toBe(1)
  })

  it('un 409 por otra pestaña pide recargar', async () => {
    const { llamadas, usuario } = abrir({
      cronograma: { version: 0, actividades: [hoja('a')], ultimoCorte: null },
      alGuardar: () => ({
        estado: 409,
        cuerpo: { error: { codigo: 'cronograma_desactualizado', mensaje: 'Cambió' } },
      }),
    })
    const s = await seccion()
    await usuario.click(s.getByText('a'))
    await usuario.type(s.getByRole('textbox', { name: 'Actividad' }), 'x')
    await esperarGuardado()
    expect(await s.findByText('El cronograma cambió en otra pestaña.')).toBeInTheDocument()
    const antes = llamadas.filter((l) => l.metodo === 'GET' && l.url.endsWith('/cronograma'))
    await usuario.click(s.getByRole('button', { name: 'Recargar' }))
    await waitFor(() =>
      expect(
        llamadas.filter((l) => l.metodo === 'GET' && l.url.endsWith('/cronograma')).length,
      ).toBeGreaterThan(antes.length),
    )
  })

  it('avisa si los pesos no suman 100 %', async () => {
    abrir({
      cronograma: {
        version: 1,
        actividades: [
          hoja('a', { peso: 0.6, inicio: '2026-01-01', fin: '2026-01-31' }),
          hoja('b', { orden: 1, peso: 0.35, inicio: '2026-02-01', fin: '2026-02-28' }),
        ],
        ultimoCorte: null,
      },
    })
    const s = await seccion()
    expect(s.getByText(/suman 95 %/)).toBeInTheDocument()
  })

  it('eliminar una hoja con avances pide confirmación; sin avances no', async () => {
    const { usuario } = abrir({
      cronograma: {
        version: 1,
        actividades: [hoja('con'), hoja('sin', { orden: 1 })],
        ultimoCorte: { fecha: '2026-03-01', avances: { con: { pct: 0.5 } } },
      },
    })
    const s = await seccion()
    await usuario.click(s.getByText('sin'))
    await usuario.click(s.getByRole('button', { name: 'Eliminar actividad' }))
    expect(s.queryByText('sin')).not.toBeInTheDocument()

    await usuario.click(s.getByText('con'))
    await usuario.click(s.getByRole('button', { name: 'Eliminar actividad' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText(/Tiene avances registrados/)).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))
    expect(s.queryByText('con')).not.toBeInTheDocument()
  })

  it('en solo lectura no se edita', async () => {
    const { usuario } = abrir({
      detalleCharter: { ...detalle, estado: 'cerrado', permisos: { editar: false, reabrir: true } },
      cronograma: { version: 1, actividades: [hoja('a', { nombre: 'Uno' })], ultimoCorte: null },
    })
    const s = await seccion()
    expect(s.queryByRole('button', { name: 'Agregar actividad' })).not.toBeInTheDocument()
    await usuario.click(s.getByText('Uno'))
    expect(s.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
