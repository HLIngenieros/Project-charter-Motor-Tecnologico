import { z } from './zod'

export const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Usa el formato AAAA-MM-DD' })

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
