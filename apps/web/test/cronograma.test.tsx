import { REGLAS_POR_DEFECTO } from '@charter/shared'
import type { ActividadEntrada, CharterDetalle, CronogramaRespuesta } from '@charter/shared'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { Rutas } from '../src/app/rutas'
import { simularApi, type Llamada, type Respuesta } from './simular-api'

// jsdom no trae PointerEvent: MouseEvent conserva clientX, que es lo que usa el arrastre.
window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent

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
  rol: 'dueno',
  permisos: { editar: true, reabrir: false, compartir: true },
  reglas: REGLAS_POR_DEFECTO,
  indicadores: [],
  riesgos: [],
  rubros: [],
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
  it('usa los umbrales del charter para el semáforo', async () => {
    // Al 16 ene el plan va en 51,6 % y el real en 45 %: brecha de 6,6 puntos.
    const cronograma: CronogramaRespuesta = {
      version: 1,
      actividades: [
        hoja('A', { nombre: 'Diseño', peso: 1, inicio: '2026-01-01', fin: '2026-01-31' }),
      ],
      ultimoCorte: { fecha: '2026-01-16', avances: { A: { pct: 0.45, terminadaEn: null } } },
    }
    abrir({
      cronograma,
      detalleCharter: {
        ...detalle,
        reglas: { ...REGLAS_POR_DEFECTO, umbrales: { atencion: 5, riesgo: 25, atraso: 50 } },
      },
    })
    await seccion()
    expect(document.querySelector('[data-fila="A"] [data-estado="en_atencion"]')).not.toBeNull()
  })

  it('con «repartir», una hoja sin peso muestra su peso efectivo y la marca auto', async () => {
    const fechas = { inicio: '2026-01-01', fin: '2026-01-31' }
    abrir({
      cronograma: {
        version: 1,
        actividades: [
          hoja('A', { nombre: 'Diseño', orden: 0, peso: 0.8, ...fechas }),
          hoja('B', { nombre: 'Pruebas', orden: 1, ...fechas }),
        ],
        ultimoCorte: null,
      },
      detalleCharter: { ...detalle, reglas: { ...REGLAS_POR_DEFECTO, sinPeso: 'repartir' } },
    })
    const s = await seccion()
    const fila = s.getByRole('button', { name: 'Pruebas' }).closest('[data-fila]') as HTMLElement
    const peso = within(fila).getByTitle('Peso repartido automáticamente')
    expect(peso).toHaveTextContent('20 %')
    expect(peso).toHaveTextContent('auto')
  })

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
    const resumen = s.getByRole('group', { name: 'Resumen de pesos' })
    expect(resumen).toHaveTextContent('proyecto 95 %')
    expect(resumen).toHaveTextContent('falta 5 %')
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
      detalleCharter: { ...detalle, estado: 'cerrado', permisos: { editar: false, reabrir: true, compartir: true } },
      cronograma: { version: 1, actividades: [hoja('a', { nombre: 'Uno' })], ultimoCorte: null },
    })
    const s = await seccion()
    expect(s.queryByRole('button', { name: 'Agregar actividad' })).not.toBeInTheDocument()
    await usuario.click(s.getByText('Uno'))
    expect(s.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('pista del Gantt', () => {
  const programada = (): CronogramaRespuesta => ({
    version: 2,
    actividades: [
      hoja('a', { nombre: 'Diseño', peso: 1, inicio: '2026-02-01', fin: '2026-02-20' }),
    ],
    ultimoCorte: { fecha: '2026-02-10', avances: {} },
  })
  const enviado = (llamadas: Llamada[]) =>
    (puts(llamadas).at(-1)!.cuerpo as { actividades: ActividadEntrada[] }).actividades[0]!

  it('con el teclado: flecha mueve la barra, Mayús + flecha cambia el fin', async () => {
    const { llamadas, usuario } = abrir({ cronograma: programada() })
    const s = await seccion()
    const barra = s.getByRole('slider', { name: 'Fechas de Diseño' })
    barra.focus()
    await usuario.keyboard('{ArrowRight}')
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(enviado(llamadas)).toMatchObject({ inicio: '2026-02-02', fin: '2026-02-21' })

    await usuario.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(2))
    expect(enviado(llamadas)).toMatchObject({ inicio: '2026-02-02', fin: '2026-02-20' })
  })

  it('arrastrar el extremo derecho cambia solo el fin', async () => {
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ width: 1000, left: 0, top: 0, right: 1000, bottom: 36 } as DOMRect)
    const { llamadas } = abrir({ cronograma: programada() })
    const s = await seccion()
    const asa = s.getByTestId('asa-fin-a')
    fireEvent.pointerDown(asa, { clientX: 400, pointerId: 1, button: 0 })
    fireEvent.pointerMove(asa, { clientX: 600, pointerId: 1 })
    fireEvent.pointerUp(asa, { clientX: 600, pointerId: 1 })
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    const a = enviado(llamadas)
    expect(a.inicio).toBe('2026-02-01')
    expect(a.fin! > '2026-02-20').toBe(true)
    rect.mockRestore()
  })

  it('en solo lectura la barra no se mueve', async () => {
    abrir({
      detalleCharter: { ...detalle, estado: 'cerrado', permisos: { editar: false, reabrir: true, compartir: true } },
      cronograma: programada(),
    })
    const s = await seccion()
    expect(s.queryByRole('slider')).not.toBeInTheDocument()
  })
})

describe('Gantt completo', () => {
  it('una hoja atrasada muestra su fin proyectado; una al día no', async () => {
    abrir({
      cronograma: {
        version: 1,
        actividades: [
          hoja('a', { nombre: 'Atrasada', peso: 0.5, inicio: '2026-02-01', fin: '2026-02-28' }),
          hoja('b', {
            nombre: 'Al día',
            orden: 1,
            peso: 0.5,
            inicio: '2026-02-01',
            fin: '2026-02-28',
          }),
        ],
        ultimoCorte: {
          fecha: '2026-02-15',
          avances: { a: { pct: 0.1, terminadaEn: null }, b: { pct: 0.6, terminadaEn: null } },
        },
      },
    })
    const s = await seccion()
    const marcas = s.getAllByRole('img', { name: /^Fin proyectado/ })
    expect(marcas).toHaveLength(1)
    expect(marcas[0]!.closest('[data-fila]')).toHaveAttribute('data-fila', 'a')
  })

  it('«Plegar a grupos» deja solo el primer nivel y «Desplegar todo» lo devuelve', async () => {
    const { usuario } = abrir({
      cronograma: {
        version: 1,
        actividades: [
          hoja('g1', { nombre: 'Grupo 1' }),
          hoja('h1', { padreId: 'g1', nombre: 'Hoja 1', peso: 0.5 }),
          hoja('g2', { nombre: 'Grupo 2', orden: 1 }),
          hoja('g21', { padreId: 'g2', nombre: 'Subgrupo' }),
          hoja('h2', { padreId: 'g21', nombre: 'Hoja 2', peso: 0.5 }),
        ],
        ultimoCorte: null,
      },
    })
    const s = await seccion()
    expect(s.getByText('Hoja 2')).toBeInTheDocument()
    await usuario.click(s.getByRole('button', { name: 'Plegar a grupos' }))
    expect(s.queryByText('Hoja 1')).not.toBeInTheDocument()
    expect(s.queryByText('Subgrupo')).not.toBeInTheDocument()
    expect(s.getByText('Grupo 1')).toBeInTheDocument()
    expect(s.getByText('Grupo 2')).toBeInTheDocument()
    await usuario.click(s.getByRole('button', { name: 'Desplegar todo' }))
    expect(s.getByText('Hoja 2')).toBeInTheDocument()
  })
})

describe('columnas de fechas y colores por estado', () => {
  const cronograma: CronogramaRespuesta = {
    version: 1,
    actividades: [
      hoja('A', { nombre: 'Diseño', peso: 1, inicio: '2026-11-23', fin: '2026-12-04' }),
    ],
    ultimoCorte: { fecha: '2026-12-01', avances: { A: { pct: 0, terminadaEn: null } } },
  }

  it('la cabecera tiene Inicio y Fin y no Estado', async () => {
    abrir({ cronograma })
    const s = await seccion()
    expect(s.getByText('Inicio')).toBeInTheDocument()
    expect(s.getByText('Fin')).toBeInTheDocument()
    expect(s.queryByText('Estado')).not.toBeInTheDocument()
  })

  it('la fila muestra inicio y fin sin el año', async () => {
    abrir({ cronograma })
    const s = await seccion()
    const fila = s.getByText('Diseño').closest('[data-fila]') as HTMLElement
    expect(within(fila).getByText('23 nov')).toBeInTheDocument()
    expect(within(fila).getByText('4 dic')).toBeInTheDocument()
  })

  it('la barra lleva el estado de la actividad', async () => {
    abrir({ cronograma })
    await seccion()
    const fila = document.querySelector('[data-fila="A"]')!
    expect(fila.querySelector('[data-estado="atrasada"]')).not.toBeNull()
  })

  it('la leyenda muestra las convenciones de estado', async () => {
    abrir({ cronograma })
    const s = await seccion()
    const leyenda = s.getByRole('list', { name: 'Convenciones' })
    for (const t of [
      'Al día',
      'En atención',
      'En riesgo',
      'Atrasada',
      'Vencida',
      'Terminada',
      'Por iniciar',
    ])
      expect(within(leyenda).getByText(t)).toBeInTheDocument()
  })
})

describe('duración y corrimiento', () => {
  const cronograma = (): CronogramaRespuesta => ({
    version: 1,
    actividades: [
      hoja('A', { nombre: 'Diseño', orden: 0, peso: 0.5, inicio: '2026-11-23', fin: '2026-11-27' }),
      hoja('B', {
        nombre: 'Pruebas',
        orden: 1,
        peso: 0.5,
        inicio: '2026-11-30',
        fin: '2026-12-04',
      }),
    ],
    ultimoCorte: null,
  })
  const ultimas = (llamadas: Llamada[]) =>
    (puts(llamadas).at(-1)!.cuerpo as { actividades: ActividadEntrada[] }).actividades
  const de = (acts: ActividadEntrada[], id: string) => acts.find((a) => a.id === id)!

  it('escribir los días hábiles recalcula el fin y lo guarda', async () => {
    const { llamadas, usuario } = abrir({ cronograma: cronograma() })
    const s = await seccion()
    await usuario.click(s.getByText('Pruebas'))
    const dias = s.getByRole('textbox', { name: 'Días hábiles' })
    expect(dias).toHaveValue('5')
    await usuario.clear(dias)
    await usuario.type(dias, '10{Enter}')
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(de(ultimas(llamadas), 'B').fin).toBe('2026-12-11')
  })

  it('cambiar el fin corre lo de abajo, avisa y se puede deshacer', async () => {
    const { llamadas, usuario } = abrir({ cronograma: cronograma() })
    const s = await seccion()
    await usuario.click(s.getByText('Diseño'))
    fireEvent.change(s.getByLabelText('Fin'), { target: { value: '2026-12-04' } })
    expect(await s.findByText('Se corrió 1 actividad 5 días hábiles después')).toBeInTheDocument()
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(de(ultimas(llamadas), 'B').inicio).toBe('2026-12-07')

    await usuario.click(s.getByRole('button', { name: 'Deshacer' }))
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(2))
    expect(de(ultimas(llamadas), 'A').fin).toBe('2026-11-27')
    expect(de(ultimas(llamadas), 'B').inicio).toBe('2026-11-30')
    expect(s.queryByText(/Se corrió/)).not.toBeInTheDocument()
  })

  it('el aviso se va solo a los 8 segundos', async () => {
    const { usuario } = abrir({ cronograma: cronograma() })
    const s = await seccion()
    await usuario.click(s.getByText('Diseño'))
    fireEvent.change(s.getByLabelText('Fin'), { target: { value: '2026-12-04' } })
    await s.findByText(/Se corrió/)
    await act(() => vi.advanceTimersByTimeAsync(8000))
    expect(s.queryByText(/Se corrió/)).not.toBeInTheDocument()
  })

  it('«Agregar actividad» encadena la nueva a la última', async () => {
    const { llamadas, usuario } = abrir({ cronograma: cronograma() })
    const s = await seccion()
    await usuario.click(s.getByRole('button', { name: 'Agregar actividad' }))
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    expect(ultimas(llamadas).at(-1)).toMatchObject({ inicio: '2026-12-07', fin: '2026-12-11' })
  })
})

describe('pesos relativos en la ficha', () => {
  const F = { inicio: '2026-11-23', fin: '2026-11-27' }
  const cronograma = (): CronogramaRespuesta => ({
    version: 1,
    actividades: [
      hoja('G', { nombre: 'Fase uno', orden: 0, peso: 0.3 }),
      hoja('g1', { nombre: 'Levantar', padreId: 'G', orden: 0, peso: 0.4, ...F }),
      hoja('g2', { nombre: 'Diseñar', padreId: 'G', orden: 1, peso: 0.5, ...F }),
      hoja('H', { nombre: 'Cierre', orden: 1, peso: 0.7, ...F }),
    ],
    ultimoCorte: null,
  })

  it('el grupo incompleto muestra su suma en la fila y en el resumen', async () => {
    abrir({ cronograma: cronograma() })
    const s = await seccion()
    const fila = s.getByText('Fase uno').closest('[data-fila]') as HTMLElement
    expect(within(fila).getByText('suma 90 %')).toBeInTheDocument()
    const resumen = s.getByRole('group', { name: 'Resumen de pesos' })
    expect(within(resumen).getByText(/proyecto 100 %/)).toBeInTheDocument()
    expect(within(resumen).getByRole('button', { name: '1 suma 90 %' })).toBeInTheDocument()
  })

  it('la fila de una hoja muestra su peso relativo y el global en el título', async () => {
    abrir({ cronograma: cronograma() })
    const s = await seccion()
    const fila = s.getByText('Levantar').closest('[data-fila]') as HTMLElement
    const peso = within(fila).getByText('40 %')
    expect(peso.closest('[title]')?.getAttribute('title')).toContain('12 % del proyecto')
  })

  it('el peso de una agrupadora se edita en su detalle', async () => {
    const { llamadas, usuario } = abrir({ cronograma: cronograma() })
    const s = await seccion()
    await usuario.click(s.getByText('Fase uno'))
    const campo = s.getByRole('textbox', { name: 'Peso (%)' })
    await usuario.clear(campo)
    await usuario.type(campo, '25{Enter}')
    await esperarGuardado()
    await waitFor(() => expect(puts(llamadas)).toHaveLength(1))
    const acts = (puts(llamadas)[0]!.cuerpo as { actividades: ActividadEntrada[] }).actividades
    expect(acts.find((a) => a.id === 'G')!.peso).toBe(0.25)
  })
})
