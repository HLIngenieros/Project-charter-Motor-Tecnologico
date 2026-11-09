import { z } from './zod'

export const DOMINIO_POR_DEFECTO = 'hlingenieros.com'

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase()
}

/** El correo debe terminar exactamente en '@' + dominio (sin subdominios ni sufijos). */
export function esCorreoPermitido(correo: string, dominio: string): boolean {
  const normal = normalizarCorreo(correo)
  const sufijo = `@${normalizarCorreo(dominio)}`
  if (!normal.endsWith(sufijo)) return false
  const local = normal.slice(0, -sufijo.length)
  return /^[^\s@]+$/.test(local)
}

const correo = z
  .string({ error: 'Escribe tu correo' })
  .transform(normalizarCorreo)
  .pipe(z.email({ error: 'Escribe un correo válido' }))

const claveNueva = z
  .string({ error: 'Escribe una clave' })
  .min(10, { error: 'La clave debe tener al menos 10 caracteres' })
  .max(200, { error: 'La clave puede tener máximo 200 caracteres' })

export const registroEntrada = z.object({
  correo,
  nombre: z
    .string({ error: 'Escribe tu nombre' })
    .trim()
    .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
    .max(80, { error: 'El nombre puede tener máximo 80 caracteres' }),
  clave: claveNueva,
})

export const loginEntrada = z.object({
  correo,
  clave: z.string({ error: 'Escribe tu clave' }).min(1, { error: 'Escribe tu clave' }),
})

export const cambiarClaveEntrada = z.object({
  claveActual: z
    .string({ error: 'Escribe tu clave actual' })
    .min(1, { error: 'Escribe tu clave actual' }),
  claveNueva,
})

export const usuarioPublico = z.object({
  id: z.string(),
  correo: z.string(),
  nombre: z.string(),
  esAdmin: z.boolean(),
  debeCambiarClave: z.boolean(),
})

export type RegistroEntrada = z.infer<typeof registroEntrada>
export type LoginEntrada = z.infer<typeof loginEntrada>
export type CambiarClaveEntrada = z.infer<typeof cambiarClaveEntrada>
export type UsuarioPublico = z.infer<typeof usuarioPublico>
