import { z } from './zod'

export const respuestaError = z.object({
  error: z.object({
    codigo: z.string(),
    mensaje: z.string(),
    campos: z.record(z.string(), z.string()).optional(),
  }),
})

export type RespuestaError = z.infer<typeof respuestaError>
