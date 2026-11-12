import type { Estado } from '../calculo/cronograma'
import type { Reglas } from '../calculo/reglas'
import type { FechaISO } from '../calculo/tipos'
import type { Indicador, Riesgo, Rubro } from './complementos'
import { z } from './zod'

export const ESTADOS_CHARTER = ['activo', 'pausado', 'cerrado', 'cancelado'] as const
export const estadoCharter = z.enum(ESTADOS_CHARTER)

export const TIPOS_LISTA = ['objetivo', 'supuesto', 'criterio_exito'] as const
export const tipoLista = z.enum(TIPOS_LISTA)

const nombre = z
  .string({ error: 'Escribe el nombre del charter' })
  .trim()
  .min(1, { error: 'Escribe el nombre del charter' })
  .max(200, { error: 'El nombre puede tener máximo 200 caracteres' })

const textoCorto = (campo: string) =>
  z
    .string()
    .trim()
    .max(120, { error: `${campo} puede tener máximo 120 caracteres` })

const textoLargo = z
  .string()
  .trim()
  .max(4000, { error: 'El texto puede tener máximo 4000 caracteres' })

const idCatalogo = z.string().min(1).nullable()

export const charterCrear = z.object({
  nombre,
  categoriaId: idCatalogo.optional(),
  areaId: idCatalogo.optional(),
  razonDeSer: textoLargo.optional(),
})

export const charterEditar = z
  .object({
    nombre,
    codigo: z
      .string()
      .trim()
      .max(20, { error: 'El código puede tener máximo 20 caracteres' })
      .nullable()
      .transform((v) => (v ? v : null)),
    categoriaId: idCatalogo,
    areaId: idCatalogo,
    responsable: textoCorto('El responsable'),
    patrocinador: textoCorto('El patrocinador'),
    revision: textoCorto('La revisión'),
    razonDeSer: textoLargo,
    objetivoGeneral: textoLargo,
    estado: estadoCharter,
  })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, { error: 'No hay cambios para guardar' })

export const listaEntrada = z.object({
  items: z
    .array(
      z.object({
        texto: z
          .string()
          .trim()
          .min(1, { error: 'Escribe el texto del ítem' })
          .max(1000, { error: 'Cada ítem puede tener máximo 1000 caracteres' }),
      }),
    )
    .max(50, { error: 'Una lista puede tener máximo 50 ítems' }),
})

export type EstadoCharter = z.infer<typeof estadoCharter>
export type TipoLista = z.infer<typeof tipoLista>
export type CharterCrear = z.infer<typeof charterCrear>
export type CharterEditar = z.infer<typeof charterEditar>
export type ListaEntrada = z.infer<typeof listaEntrada>

// ── Respuestas ──────────────────────────────────────────────────────────

export interface CategoriaPublica {
  id: string
  nombre: string
  color: string
  colorFondo: string
  activa: boolean
}

export interface AreaPublica {
  id: string
  nombre: string
  activa: boolean
}

export interface ItemLista {
  id: string
  texto: string
}

export interface CharterResumen {
  id: string
  nombre: string
  codigo: string | null
  responsable: string
  estado: EstadoCharter
  categoria: CategoriaPublica | null
  area: AreaPublica | null
  propietario: { id: string; nombre: string }
  actualizadoEn: string
  /** Totales guardados del último corte (no se recalculan con el cronograma actual). */
  ultimoCorte: {
    fecha: FechaISO
    pv: number
    ev: number
    estado: Estado
    vencidas: number
  } | null
  /** Planeado y real guardados de cada corte, por fecha ascendente. */
  cortes: { fecha: FechaISO; pv: number; ev: number }[]
}

export interface CharterDetalle {
  id: string
  nombre: string
  codigo: string | null
  categoriaId: string | null
  areaId: string | null
  responsable: string
  patrocinador: string
  revision: string
  razonDeSer: string
  objetivoGeneral: string
  estado: EstadoCharter
  creadoEn: string
  actualizadoEn: string
  propietario: { id: string; nombre: string }
  listas: Record<TipoLista, ItemLista[]>
  permisos: { editar: boolean; reabrir: boolean }
  /** Reglas de cálculo del charter (copiadas de las vigentes al crearlo). */
  reglas: Reglas
  indicadores: Indicador[]
  riesgos: Riesgo[]
  /** Cada rubro con su desglose; `valor` ya es el calculado si tiene líneas. */
  rubros: Rubro[]
}
