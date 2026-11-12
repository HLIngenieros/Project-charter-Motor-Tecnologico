import {
  REGLAS_POR_DEFECTO,
  type ActividadEntrada,
  type CharterDetalle,
  type CorteDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
} from '@charter/shared'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { porcentaje } from '../src/formato'
import { simularApi, type Llamada } from './simular-api'

let imprimir: ReturnType<typeof vi.fn>

beforeEach(() => {
  imprimir = vi.fn()
  vi.stubGlobal('print', imprimir)
})
afterEach(() => vi.unstubAllGlobals())

const detalle: CharterDetalle = {
  id: 'c1',
  nombre: 'Plan TI',
  codigo: 'TI-01',
  categoriaId: null,
  areaId: null,
  responsable: 'Ana Pérez',
  patrocinador: 'Gerencia',
  revision: 'B',
  razonDeSer: 'Ordenar la infraestructura.',
  objetivoGeneral: 'Migrar los servidores.',
  estado: 'activo',
  creadoEn: '2026-01-01T15:00:00.000Z',
  actualizadoEn: '2026-01-01T15:00:00.000Z',
  propietario: { id: 'u1', nombre: 'Ana Pérez' },
  listas: {
    objetivo: [{ id: 'o1', texto: 'Inventariar equipos' }],
    supuesto: [],
    criterio_exito: [{ id: 'k1', texto: 'Cero caídas' }],
  },
  permisos: { editar: true, reabrir: false },
  reglas: REGLAS_POR_DEFECTO,
  indicadores: [],
  riesgos: [],
  rubros: [],
}

const act = (
  id: string,
  padreId: string | null,
  orden: number,
  nombre: string,
  extra: Partial<ActividadEntrada> = {},
): ActividadEntrada => ({
  id,
  padreId,
  orden,
  nombre,
  entregable: null,
  peso: null,
  inicio: null,
  fin: null,
  responsables: [],
  ...extra,
})

const ACTS = [
  act('g', null, 0, 'Fase 1'),
  act('h1', 'g', 0, 'Diseño', { peso: 0.5, inicio: '2026-11-01', fin: '2026-11-30' }),
  act('h2', 'g', 1, 'Pruebas', { peso: 0.5, inicio: '2026-11-15', fin: '2026-12-15' }),
]

const corte = (fecha: string, pv: number, ev: number): CorteResumen => ({
  fecha,
  nota: `Nota del ${fecha}`,
  pv,
  ev,
  desv: 0,
  estado: 'en_atencion',
  vencidas: 0,
})
const cortes = [
  corte('2026-11-02', 0.04, 0.02),
  corte('2026-11-05', 0.14, 0.07),
  corte('2026-11-09', 0.2, 0.1),
]

const cronograma: CronogramaRespuesta = {
  version: 1,
  actividades: ACTS,
  ultimoCorte: { fecha: '2026-11-09', avances: { h1: { pct: 0.2 } } },
}

function abrir(url: string, charter: CharterDetalle = detalle) {
  simularApi((l: Llamada) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: charter }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma') return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: cortes }
    const fecha = l.url.match(/\/cortes\/(.+)$/)?.[1]
    const c = cortes.find((x) => x.fecha === fecha)
    if (c) {
      const foto: CorteDetalle = {
        ...c,
        avances: [
          {
            actividadId: 'h1',
            item: '1.1',
            nombre: 'Diseño',
            pct: c.ev * 2,
            peso: 0.5,
            inicio: '2026-11-01',
            fin: '2026-11-30',
            eliminada: false,
          },
          {
            actividadId: 'h2',
            item: '1.2',
            nombre: 'Pruebas',
            pct: 0,
            peso: 0.5,
            inicio: '2026-11-15',
            fin: '2026-12-15',
            eliminada: false,
          },
        ],
      }
      return { estado: 200, cuerpo: foto }
    }
    return undefined
  })
  render(
    <Proveedores>
      <MemoryRouter initialEntries={[url]}>
        <Rutas />
      </MemoryRouter>
    </Proveedores>,
  )
}

const TITULOS = [
  'Razón de ser',
  'Objetivo general',
  'Objetivos específicos',
  'Curva S',
  'Cronograma',
  'Supuestos',
  'Criterios de éxito',
  'Indicadores',
  'Riesgos',
  'Presupuesto',
  'Historial de cortes',
]

describe('vista de impresión', () => {
  it('incluye indicadores, riesgos con matriz estática y presupuesto', async () => {
    abrir('/charters/c1/imprimir', {
      ...detalle,
      indicadores: [
        {
          id: 'i1',
          nombre: 'Facturas sin intervención',
          formula: 'Automáticas ÷ recibidas',
          metaOperador: '>=',
          metaValor: 90,
          metaUnidad: '%',
          observaciones: '',
        },
      ],
      riesgos: [
        {
          id: 'r1',
          riesgo: 'Proveedores sin soportes',
          causa: 'Facturan al despachar',
          mitigacion: 'Circular',
          probabilidad: 4,
          impacto: 3,
        },
      ],
      rubros: [
        {
          id: 'b1',
          descripcion: 'Horas internas',
          valor: 8333,
          lineas: [{ id: 'l1', concepto: 'Desarrollo', cantidad: 2.5, valorUnitario: 3333 }],
        },
      ],
    })
    await waitFor(() => expect(imprimir).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Facturas sin intervención')).toBeInTheDocument()
    expect(screen.getByText('≥ 90 %')).toBeInTheDocument()
    expect(screen.getByText('Proveedores sin soportes')).toBeInTheDocument()
    expect(screen.getByText('Alto · 12')).toBeInTheDocument()
    const matriz = screen.getByRole('group', { name: 'Matriz de probabilidad e impacto' })
    expect(matriz.querySelectorAll('[tabindex]')).toHaveLength(0)
    expect(screen.getByText('COP 8.333')).toBeInTheDocument()
    expect(screen.getByText('Desarrollo')).toBeInTheDocument()
  })

  it('muestra las secciones en el orden de la ficha y llama a imprimir una vez', async () => {
    abrir('/charters/c1/imprimir')
    expect(await screen.findByRole('heading', { level: 1, name: 'Plan TI' })).toBeInTheDocument()
    await waitFor(() => expect(imprimir).toHaveBeenCalledTimes(1))
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titulos).toEqual(TITULOS)
    expect(screen.getByText('Ordenar la infraestructura.')).toBeInTheDocument()
    expect(screen.getByText('Inventariar equipos')).toBeInTheDocument()
    // Supuestos vacío.
    expect(screen.getByText('Sin registrar')).toBeInTheDocument()
    expect(screen.getByText('Nota del 2026-11-05')).toBeInTheDocument()
    expect(screen.getByText(/Generado el/)).toBeInTheDocument()
    expect(screen.getByText('Aún no hay indicadores.')).toBeInTheDocument()
    expect(screen.getByText('Aún no hay riesgos.')).toBeInTheDocument()
    expect(screen.getByText('Aún no hay presupuesto.')).toBeInTheDocument()
    // Un render más no vuelve a imprimir.
    await new Promise((r) => setTimeout(r, 50))
    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('el cronograma lista todas las filas, también las de las agrupadoras', async () => {
    abrir('/charters/c1/imprimir')
    const tabla = await screen.findByRole('table', { name: 'Cronograma' })
    await within(tabla).findByText('Diseño')
    for (const nombre of ['Fase 1', 'Diseño', 'Pruebas'])
      expect(within(tabla).getByText(nombre)).toBeInTheDocument()
  })

  it('en un corte pasado muestra lo guardado en ese corte', async () => {
    abrir('/charters/c1/imprimir?corte=2026-11-02')
    expect(await screen.findAllByText('Corte del 2 nov 2026')).not.toHaveLength(0)
    const resumen = within(await screen.findByRole('group', { name: 'Resumen del avance' }))
    await waitFor(() => expect(resumen.getByText(porcentaje(0.04))).toBeInTheDocument())
    expect(resumen.getByText(porcentaje(0.02))).toBeInTheDocument()
  })

  it('una fecha que no es un corte muestra el último con aviso', async () => {
    abrir('/charters/c1/imprimir?corte=2020-01-01')
    expect(
      await screen.findByText('No hay un corte en esa fecha; se muestra el último.'),
    ).toBeInTheDocument()
  })

  it('la curva no tiene botones de corte', async () => {
    abrir('/charters/c1/imprimir')
    const curva = (await screen.findByRole('heading', { name: 'Curva S' })).closest('section')!
    await waitFor(() => expect(curva.querySelectorAll('[data-corte]')).toHaveLength(3))
    expect(within(curva).queryAllByRole('button')).toHaveLength(0)
  })
})
