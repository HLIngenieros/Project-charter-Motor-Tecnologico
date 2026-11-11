import type { Reglas } from '../calculo/reglas'
import { z } from './zod'

const umbral = z
  .number({ error: 'Escribe un número' })
  .min(0, { error: 'El umbral no puede ser negativo' })
  .max(100, { error: 'El umbral puede ser máximo 100' })

export const reglasEntrada = z
  .object({
    sumaPesos: z.enum(['aviso', 'obligatoria']),
    sinPeso: z.enum(['fuera', 'repartir']),
    umbrales: z
      .object({ atencion: umbral, riesgo: umbral, atraso: umbral })
      .refine((u) => u.atencion < u.riesgo && u.riesgo < u.atraso, {
        error: 'Los umbrales deben ir de menor a mayor: atención, riesgo, atraso.',
      }),
    reparto: z.enum(['calendario', 'habiles']),
    proyeccion: z.enum(['desviacion', 'ritmo']),
    diasGracia: z
      .number({ error: 'Escribe un número' })
      .int({ error: 'Los días de gracia deben ser un número entero' })
      .min(0, { error: 'Los días de gracia no pueden ser negativos' })
      .max(365, { error: 'Los días de gracia pueden ser máximo 365' }),
  })
  .strict()

export type ReglasEntrada = z.infer<typeof reglasEntrada>

export interface ParametrosRespuesta {
  reglas: Reglas
  actualizadoPor: { id: string; nombre: string } | null
  actualizadoEn: string | null
}
