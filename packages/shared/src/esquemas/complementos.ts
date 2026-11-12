import { z } from './zod'

export const OPERADORES_META = ['>=', '<=', '='] as const

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `El texto puede tener máximo ${max} caracteres` })

const corto = texto(300)
const largo = texto(1000)

const id = z.uuid({ error: 'Identificador no válido' })

const calificacion = z
  .int()
  .min(1, { error: 'La calificación va de 1 a 5' })
  .max(5, { error: 'La calificación va de 1 a 5' })
  .nullable()

const pesos = z
  .int({ error: 'El valor debe ser un número entero de pesos' })
  .min(0, { error: 'El valor no puede ser negativo' })
  .max(1e13, { error: 'El valor es demasiado grande' })

const indicador = z.object({
  id,
  nombre: corto,
  formula: largo,
  metaOperador: z.enum(OPERADORES_META),
  metaValor: z.number().finite().nullable(),
  metaUnidad: texto(40),
  observaciones: largo,
})

const riesgo = z.object({
  id,
  riesgo: corto,
  causa: largo,
  mitigacion: largo,
  probabilidad: calificacion,
  impacto: calificacion,
})

const lineaRubro = z.object({
  id,
  concepto: corto,
  cantidad: z
    .number()
    .finite()
    .min(0, { error: 'La cantidad no puede ser negativa' })
    .max(1e9, { error: 'La cantidad es demasiado grande' }),
  valorUnitario: pesos,
})

const rubro = z.object({
  id,
  descripcion: corto,
  valor: pesos,
  lineas: z.array(lineaRubro).max(50, { error: 'Un rubro puede tener máximo 50 líneas' }),
})

export const indicadoresEntrada = z.object({
  items: z.array(indicador).max(50, { error: 'Puede haber máximo 50 indicadores' }),
})

export const riesgosEntrada = z.object({
  items: z.array(riesgo).max(50, { error: 'Puede haber máximo 50 riesgos' }),
})

export const presupuestoEntrada = z.object({
  rubros: z.array(rubro).max(50, { error: 'Puede haber máximo 50 rubros' }),
})

export type OperadorMeta = (typeof OPERADORES_META)[number]
export type Indicador = z.infer<typeof indicador>
export type Riesgo = z.infer<typeof riesgo>
export type LineaRubro = z.infer<typeof lineaRubro>
export type Rubro = z.infer<typeof rubro>
export type IndicadoresEntrada = z.infer<typeof indicadoresEntrada>
export type RiesgosEntrada = z.infer<typeof riesgosEntrada>
export type PresupuestoEntrada = z.infer<typeof presupuestoEntrada>
