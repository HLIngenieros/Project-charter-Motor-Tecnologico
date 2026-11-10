import type { AvancesPorHoja, Estado } from '../calculo/cronograma'
import type { FilaFoto } from '../calculo/cortes'
import type { ActividadEntrada, FechaISO } from '../calculo/tipos'
import { actividadEntrada } from './actividad'
import { z } from './zod'

export const MAX_ACTIVIDADES = 500
export const MAX_NIVELES = 6

export const cronogramaEntrada = z.object({
  version: z.number().int().min(0),
  actividades: z
    .array(actividadEntrada)
    .max(MAX_ACTIVIDADES, { error: 'El cronograma admite hasta 500 actividades' }),
})

export const corteEntrada = z
  .object({
    nota: z
      .string()
      .trim()
      .max(2000, { error: 'La nota puede tener máximo 2000 caracteres' })
      .default(''),
    avances: z.array(
      z.object({
        actividadId: z.string().min(1),
        pct: z
          .number()
          .min(0, { error: 'El avance no puede ser negativo' })
          .max(1, { error: 'El avance no puede pasar de 100 %' }),
      }),
    ),
  })
  .strict()

export type CronogramaEntrada = z.infer<typeof cronogramaEntrada>
export type CorteEntrada = z.infer<typeof corteEntrada>

export interface CronogramaRespuesta {
  version: number
  actividades: ActividadEntrada[]
  /** Avances del último corte, con la fecha en que cada hoja llegó al 100 %. */
  ultimoCorte: { fecha: FechaISO; avances: AvancesPorHoja } | null
}

export interface AvanceFoto extends FilaFoto {
  /** La actividad ya no existe en el cronograma vigente. */
  eliminada: boolean
}

export interface CorteResumen {
  fecha: FechaISO
  nota: string
  pv: number
  ev: number
  desv: number
  estado: Estado
  vencidas: number
}

export interface CorteDetalle extends CorteResumen {
  avances: AvanceFoto[]
}
