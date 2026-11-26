// API aislada para las capturas del video: base PGlite en memoria con datos FICTICIOS.
// No toca `data/pglite`, ni Neon, ni el `npm run dev` del usuario.
// Uso (desde la raíz del repo): npx tsx video-presentacion/servidor-demo.ts
import { randomUUID } from 'node:crypto'
import { construirApp } from '../apps/api/src/app'
import { promoverAdmin } from '../apps/api/src/auth/cuentas'
import { leerConfig } from '../apps/api/src/config'
import { crearDb } from '../apps/api/src/db/conexion'

const PUERTO = 3400
export const DEMO = {
  correo: 'demo@hlingenieros.com',
  nombre: 'Usuario Demo',
  clave: 'demo-video-1234',
}

const config = { ...leerConfig({}), puerto: PUERTO }
const db = await crearDb(':memory:')
const app = await construirApp({ config, db })

let cookie = ''
async function pedir<T = unknown>(method: string, url: string, payload?: unknown): Promise<T> {
  const r = await app.inject({
    method: method as 'GET',
    url: `/api${url}`,
    headers: { 'x-requested-with': 'charter', ...(cookie ? { cookie } : {}) },
    ...(payload === undefined ? {} : { payload: payload as object }),
  })
  if (r.statusCode >= 400) throw new Error(`${method} ${url} → ${r.statusCode}: ${r.body}`)
  const puesta = r.headers['set-cookie']
  if (puesta) cookie = (Array.isArray(puesta) ? puesta[0]! : puesta).split(';')[0]!
  return (r.body ? JSON.parse(r.body) : null) as T
}

await pedir('POST', '/auth/registro', DEMO)
await promoverAdmin(db, DEMO.correo, true)

// Catálogos: las categorías vienen de la semilla; las áreas son inventadas.
const categorias = await pedir<{ id: string; nombre: string }[]>('GET', '/categorias')
const cat = (nombre: string) => categorias.find((c) => c.nombre === nombre)!.id
const areas: Record<string, string> = {}
for (const nombre of ['Compras', 'Operaciones', 'Calidad', 'Talento Humano']) {
  areas[nombre] = (await pedir<{ id: string }>('POST', '/admin/catalogos/areas', { nombre })).id
}

interface Hoja {
  nombre: string
  peso: number
  inicio: string
  fin: string
  entregable?: string
}
interface Grupo {
  nombre: string
  peso: number
  hojas: Hoja[]
}
interface Corte {
  fecha: string
  nota: string
  /** Avance por nombre de hoja (0 a 1). */
  avances: Record<string, number>
}
interface Demo {
  nombre: string
  codigo: string
  categoria: string
  area: string
  responsable: string
  grupos: Grupo[]
  cortes: Corte[]
}

async function crear(d: Demo): Promise<string> {
  const { id } = await pedir<{ id: string }>('POST', '/charters', { nombre: d.nombre })
  await pedir('PATCH', `/charters/${id}`, {
    codigo: d.codigo,
    categoriaId: cat(d.categoria),
    areaId: areas[d.area],
    responsable: d.responsable,
    patrocinador: `Gerencia de ${d.area}`,
    revision: 'Rev. A',
  })
  const actividades: object[] = []
  const idDe = new Map<string, string>()
  d.grupos.forEach((g, i) => {
    const gid = `${d.codigo}-g${i}`
    actividades.push({ id: gid, padreId: null, orden: i, nombre: g.nombre, peso: g.peso })
    g.hojas.forEach((h, j) => {
      const hid = `${gid}-h${j}`
      idDe.set(h.nombre, hid)
      actividades.push({
        id: hid,
        padreId: gid,
        orden: j,
        nombre: h.nombre,
        entregable: h.entregable ?? null,
        peso: h.peso,
        inicio: h.inicio,
        fin: h.fin,
        responsables: ['Equipo del proyecto'],
      })
    })
  })
  const { version } = await pedir<{ version: number }>('GET', `/charters/${id}/cronograma`)
  await pedir('PUT', `/charters/${id}/cronograma`, { version, actividades })
  for (const c of d.cortes) {
    await pedir('PUT', `/charters/${id}/cortes/${c.fecha}`, {
      nota: c.nota,
      avances: Object.entries(c.avances).map(([nombre, pct]) => ({
        actividadId: idDe.get(nombre)!,
        pct,
      })),
    })
  }
  return id
}

// Charter principal: proyecto inventado, cifras redondas y riesgos genéricos.
const principal = await crear({
  nombre: 'Portal de Proveedores',
  codigo: 'PP1',
  categoria: 'Automatización',
  area: 'Compras',
  responsable: 'Líder de Compras',
  grupos: [
    {
      nombre: 'Análisis',
      peso: 0.15,
      hojas: [
        { nombre: 'Levantamiento', peso: 0.5, inicio: '2026-09-01', fin: '2026-09-18' },
        { nombre: 'Diseño de la solución', peso: 0.5, inicio: '2026-09-21', fin: '2026-10-09' },
      ],
    },
    {
      nombre: 'Construcción',
      peso: 0.45,
      hojas: [
        { nombre: 'Registro de proveedores', peso: 0.35, inicio: '2026-10-12', fin: '2026-11-06' },
        { nombre: 'Carga de documentos', peso: 0.35, inicio: '2026-11-09', fin: '2026-12-04' },
        { nombre: 'Tablero de seguimiento', peso: 0.3, inicio: '2026-12-07', fin: '2027-01-08' },
      ],
    },
    {
      nombre: 'Pruebas',
      peso: 0.2,
      hojas: [
        { nombre: 'Pruebas internas', peso: 0.5, inicio: '2027-01-11', fin: '2027-01-29' },
        { nombre: 'Piloto', peso: 0.5, inicio: '2027-02-01', fin: '2027-02-12' },
      ],
    },
    {
      nombre: 'Salida en vivo',
      peso: 0.2,
      hojas: [
        { nombre: 'Capacitación', peso: 0.5, inicio: '2027-02-08', fin: '2027-02-19' },
        { nombre: 'Puesta en marcha', peso: 0.5, inicio: '2027-02-15', fin: '2027-02-26' },
      ],
    },
  ],
  cortes: [
    {
      fecha: '2026-09-30',
      nota: 'Levantamiento terminado.',
      avances: { Levantamiento: 1, 'Diseño de la solución': 0.4 },
    },
    {
      fecha: '2026-10-30',
      nota: 'Diseño aprobado; arranca la construcción.',
      avances: { Levantamiento: 1, 'Diseño de la solución': 1, 'Registro de proveedores': 0.5 },
    },
    {
      fecha: '2026-11-25',
      nota: 'Registro de proveedores en pruebas.',
      avances: {
        Levantamiento: 1,
        'Diseño de la solución': 1,
        'Registro de proveedores': 1,
        'Carga de documentos': 0.2,
      },
    },
  ],
})

await pedir('PATCH', `/charters/${principal}`, {
  razonDeSer:
    'Hoy los proveedores envían sus documentos por correo y el seguimiento se lleva en hojas de cálculo. Un portal único ordena el registro y deja ver el estado de cada trámite.',
  objetivoGeneral:
    'Poner en marcha un portal donde los proveedores se registren, carguen sus documentos y consulten el estado de sus trámites.',
})
await pedir('PUT', `/charters/${principal}/listas/objetivo`, {
  items: [
    { texto: 'Registrar al 100 % de los proveedores activos en el portal.' },
    { texto: 'Reducir a la mitad el tiempo de revisión de documentos.' },
    { texto: 'Dar a Compras un tablero con el estado de cada trámite.' },
  ],
})
await pedir('PUT', `/charters/${principal}/listas/supuesto`, {
  items: [
    { texto: 'Los proveedores cuentan con acceso a internet.' },
    { texto: 'El área de Compras asigna un líder funcional.' },
  ],
})
await pedir('PUT', `/charters/${principal}/listas/criterio_exito`, {
  items: [
    { texto: 'El piloto termina sin incidentes críticos.' },
    { texto: 'Ocho de cada diez proveedores califican el portal como fácil de usar.' },
  ],
})
const u = randomUUID
await pedir('PUT', `/charters/${principal}/indicadores`, {
  items: [
    {
      id: u(),
      nombre: 'Proveedores registrados',
      formula: 'Proveedores registrados / proveedores activos',
      metaOperador: '>=',
      metaValor: 90,
      metaUnidad: '%',
      observaciones: '',
    },
    {
      id: u(),
      nombre: 'Tiempo de revisión',
      formula: 'Días entre la carga y la aprobación',
      metaOperador: '<=',
      metaValor: 3,
      metaUnidad: 'días',
      observaciones: '',
    },
    {
      id: u(),
      nombre: 'Satisfacción de uso',
      formula: 'Promedio de la encuesta (1 a 5)',
      metaOperador: '>=',
      metaValor: 4,
      metaUnidad: 'puntos',
      observaciones: '',
    },
  ],
})
await pedir('PUT', `/charters/${principal}/riesgos`, {
  items: [
    {
      id: u(),
      riesgo: 'Retraso del proveedor',
      causa: 'Entregas fuera de la fecha acordada.',
      mitigacion: 'Hitos quincenales con entregables verificables.',
      probabilidad: 3,
      impacto: 4,
    },
    {
      id: u(),
      riesgo: 'Baja adopción',
      causa: 'Los usuarios siguen usando el correo.',
      mitigacion: 'Capacitación y acompañamiento en el piloto.',
      probabilidad: 2,
      impacto: 4,
    },
    {
      id: u(),
      riesgo: 'Cambios de alcance',
      causa: 'Solicitudes nuevas durante la construcción.',
      mitigacion: 'Control de cambios con el patrocinador.',
      probabilidad: 4,
      impacto: 2,
    },
    {
      id: u(),
      riesgo: 'Datos incompletos',
      causa: 'Información de origen desactualizada.',
      mitigacion: 'Depuración antes de la carga inicial.',
      probabilidad: 2,
      impacto: 2,
    },
    {
      id: u(),
      riesgo: 'Disponibilidad del equipo',
      causa: 'Personas compartidas con otros proyectos.',
      mitigacion: 'Dedicación acordada desde el inicio.',
      probabilidad: 4,
      impacto: 4,
    },
  ],
})
await pedir('PUT', `/charters/${principal}/presupuesto`, {
  rubros: [
    {
      id: u(),
      descripcion: 'Desarrollo',
      valor: 0,
      lineas: [
        { id: u(), concepto: 'Horas de desarrollo', cantidad: 400, valorUnitario: 50_000 },
        { id: u(), concepto: 'Horas de diseño', cantidad: 100, valorUnitario: 50_000 },
      ],
    },
    { id: u(), descripcion: 'Infraestructura', valor: 10_000_000, lineas: [] },
    { id: u(), descripcion: 'Capacitación', valor: 5_000_000, lineas: [] },
    { id: u(), descripcion: 'Licencias', valor: 10_000_000, lineas: [] },
  ],
})

// Resto del portafolio: charters inventados con distintos estados del semáforo.
function sencillo(
  nombre: string,
  codigo: string,
  categoria: string,
  area: string,
  responsable: string,
  inicio: [string, string, string, string, string, string],
  cortes: [string, number, number, number][],
): Demo {
  const hojas = ['Diseño', 'Construcción', 'Puesta en marcha']
  return {
    nombre,
    codigo,
    categoria,
    area,
    responsable,
    grupos: [
      {
        nombre: 'Proyecto',
        peso: 1,
        hojas: hojas.map((h, i) => ({
          nombre: h,
          peso: [0.3, 0.5, 0.2][i]!,
          inicio: inicio[i * 2]!,
          fin: inicio[i * 2 + 1]!,
        })),
      },
    ],
    cortes: cortes.map(([fecha, a, b, c]) => ({
      fecha,
      nota: 'Corte mensual.',
      avances: { Diseño: a, Construcción: b, 'Puesta en marcha': c },
    })),
  }
}

const FECHAS: [string, string, string, string, string, string] = [
  '2026-08-03',
  '2026-09-11',
  '2026-09-14',
  '2026-12-18',
  '2027-01-11',
  '2027-02-05',
]
await crear(
  sencillo(
    'Inventario en Línea',
    'IL1',
    'Análisis de Data',
    'Operaciones',
    'Líder de Operaciones',
    FECHAS,
    [
      ['2026-09-30', 1, 0.15, 0],
      ['2026-10-30', 1, 0.45, 0],
      ['2026-11-25', 1, 0.72, 0],
    ],
  ),
)
await crear(
  sencillo(
    'Mesa de Ayuda Digital',
    'MA1',
    'Automatización',
    'Talento Humano',
    'Líder de Talento',
    FECHAS,
    [
      ['2026-09-30', 0.9, 0.05, 0],
      ['2026-10-30', 1, 0.2, 0],
      ['2026-11-25', 1, 0.4, 0],
    ],
  ),
)
await crear(
  sencillo(
    'Archivo Digital',
    'AD1',
    'Gestión del Conocimiento',
    'Calidad',
    'Líder de Calidad',
    FECHAS,
    [
      ['2026-09-30', 0.6, 0, 0],
      ['2026-10-30', 0.8, 0.05, 0],
      ['2026-11-25', 0.9, 0.1, 0],
    ],
  ),
)
await crear(
  sencillo(
    'Tablero de Obra',
    'TO1',
    'Análisis de Data',
    'Operaciones',
    'Líder de Operaciones',
    ['2026-06-01', '2026-07-10', '2026-07-13', '2026-10-16', '2026-10-19', '2026-11-13'],
    [
      ['2026-08-31', 1, 0.5, 0],
      ['2026-10-30', 1, 1, 0.5],
      ['2026-11-20', 1, 1, 1],
    ],
  ),
)
await crear(
  sencillo(
    'App de Visitas',
    'AV1',
    'Gestión del Conocimiento',
    'Calidad',
    'Líder de Calidad',
    FECHAS,
    [
      ['2026-09-30', 1, 0.1, 0],
      ['2026-10-30', 1, 0.35, 0],
      ['2026-11-25', 1, 0.6, 0],
    ],
  ),
)

await app.listen({ port: PUERTO, host: '127.0.0.1' })
console.log(`API del video en http://localhost:${PUERTO} (datos ficticios)`)
