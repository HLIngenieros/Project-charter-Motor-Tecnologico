import { aDia } from '../calculo/fechas'
import { z } from './zod'

/** true si la fecha existe en el calendario (rechaza 2025-02-29 o 2025-04-31). */
function existe(f: string): boolean {
  try {
    aDia(f)
    return true
  } catch {
    return false
  }
}

export const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Usa el formato AAAA-MM-DD' })
  .refine(existe, { error: 'La fecha no existe' })

export const actividadEntrada = z.object({
  id: z.string().min(1),
  padreId: z.string().min(1).nullable(),
  orden: z.number().int(),
  nombre: z.string().trim().max(300),
  entregable: z.string().max(1000).nullable().optional(),
  peso: z
    .number()
    .min(0, { error: 'El peso no puede ser negativo' })
    .max(1, { error: 'El peso no puede pasar de 100 %' })
    .nullable()
    .optional(),
  inicio: fechaISO.nullable().optional(),
  fin: fechaISO.nullable().optional(),
  responsables: z.array(z.string().trim().min(1)).optional(),
})

export type ActividadEntradaEsquema = z.infer<typeof actividadEntrada>
