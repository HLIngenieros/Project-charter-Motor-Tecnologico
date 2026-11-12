import {
  REGLAS_POR_DEFECTO,
  type CharterDetalle,
  type CorteDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
} from '@charter/shared'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada } from './simular-api'

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

const corte = (fecha: string): CorteResumen => ({
  fecha,
  nota: '',
  pv: 0.1,
  ev: 0.05,
  desv: 0,
  estado: 'al_dia',
  vencidas: 0,
})
const cortes = [corte('2026-11-02'), corte('2026-11-09')]

const cronograma: CronogramaRespuesta = {
  version: 1,
  actividades: [
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
  ],
  ultimoCorte: { fecha: '2026-11-09', avances: { h1: { pct: 0.05 } } },
}

/** El Blob de jsdom no trae `text()`. */
const leer = (b: Blob) =>
  new Promise<string>((listo) => {
    const r = new FileReader()
    r.onload = () => listo(String(r.result))
    r.readAsText(b)
  })

let descargado: { nombre: string; tipo: string; texto: Promise<string> } | null
let abiertas: string[]

beforeEach(() => {
  descargado = null
  abiertas = []
  vi.stubGlobal('open', (url: string) => {
    abiertas.push(url)
    return null
  })
  URL.createObjectURL = vi.fn((b: Blob) => {
    descargado = { nombre: '', tipo: b.type, texto: leer(b) }
    return 'blob:x'
  })
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (descargado) descargado.nombre = this.download
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function abrir(url: string, charter: CharterDetalle = detalle) {
  const llamadas = simularApi((l: Llamada) => {
    if (l.url === '/api/charters/c1') return { estado: 200, cuerpo: charter }
    if (l.url === '/api/categorias' || l.url === '/api/areas') return { estado: 200, cuerpo: [] }
    if (l.url === '/api/charters/c1/cronograma') return { estado: 200, cuerpo: cronograma }
    if (l.url === '/api/charters/c1/cortes') return { estado: 200, cuerpo: cortes }
    if (l.url.startsWith('/api/charters/c1/exportar')) {
      const pedido = new URL(l.url, 'http://x').searchParams.get('corte')
      return {
        estado: 200,
        cuerpo: { formato: 'project-charter', version: 1, corte: pedido ?? '2026-11-09' },
      }
    }
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
  return { llamadas, usuario: userEvent.setup() }
}

const exportar = async (usuario: ReturnType<typeof userEvent.setup>, opcion: 'PDF' | 'JSON') => {
  await usuario.click(await screen.findByRole('button', { name: 'Exportar' }))
  await usuario.click(screen.getByRole('menuitem', { name: new RegExp(opcion) }))
}

describe('exportar la ficha', () => {
  it('«JSON» pide la exportación y la descarga con el nombre del charter', async () => {
    const { llamadas, usuario } = abrir('/charters/c1')
    await exportar(usuario, 'JSON')
    await waitFor(() => expect(descargado?.nombre).toBe('charter-plan-ti-2026-11-09.json'))
    expect(llamadas.some((l) => l.url === '/api/charters/c1/exportar')).toBe(true)
    expect(descargado?.tipo).toBe('application/json')
    expect(JSON.parse(await descargado!.texto)).toMatchObject({ formato: 'project-charter' })
  })

  it('en un corte pasado exporta ese corte, en JSON y en PDF', async () => {
    const { llamadas, usuario } = abrir('/charters/c1?corte=2026-11-02')
    await screen.findByText(/Estás viendo el charter como estaba/)
    await exportar(usuario, 'JSON')
    await waitFor(() => expect(descargado?.nombre).toBe('charter-plan-ti-2026-11-02.json'))
    expect(llamadas.some((l) => l.url === '/api/charters/c1/exportar?corte=2026-11-02')).toBe(true)

    await exportar(usuario, 'PDF')
    expect(abiertas).toEqual(['/charters/c1/imprimir?corte=2026-11-02'])
  })

  it('el menú también está en solo lectura', async () => {
    const { usuario } = abrir('/charters/c1', {
      ...detalle,
      propietario: { id: 'u2', nombre: 'Luis Gómez' },
      permisos: { editar: false, reabrir: false },
    })
    await exportar(usuario, 'PDF')
    expect(abiertas).toEqual(['/charters/c1/imprimir'])
  })
})
