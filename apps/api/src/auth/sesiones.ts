import { createHash, randomBytes } from 'node:crypto'
import { and, eq, lte, ne } from 'drizzle-orm'
import type { FastifyReply } from 'fastify'
import type { BaseDatos } from '../db/conexion'
import { sesion, usuario, type FilaUsuario } from '../db/esquema'

export const COOKIE_SESION = 'charter_sesion'
const DURACION_MS = 7 * 86_400_000
const RENOVAR_TRAS_MS = 3_600_000

export interface UsuarioSesion {
  id: string
  correo: string
  nombre: string
  esAdmin: boolean
  debeCambiarClave: boolean
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function aUsuarioSesion(u: FilaUsuario): UsuarioSesion {
  return {
    id: u.id,
    correo: u.correo,
    nombre: u.nombre,
    esAdmin: u.esAdmin,
    debeCambiarClave: u.debeCambiarClave,
  }
}

/**
 * Crea una sesión y devuelve el token en claro (solo se guarda su hash).
 * De paso borra las sesiones vencidas de todos (las que nadie volvió a usar).
 */
export async function crearSesion(db: BaseDatos, usuarioId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const ahora = Date.now()
  await db.delete(sesion).where(lte(sesion.expiraEn, new Date(ahora).toISOString()))
  await db.insert(sesion).values({
    id: hashToken(token),
    usuarioId,
    expiraEn: new Date(ahora + DURACION_MS).toISOString(),
    ultimoUso: new Date(ahora).toISOString(),
  })
  return token
}

export interface SesionValida {
  usuario: UsuarioSesion
  renovada: boolean
}

/**
 * Busca la sesión del token. Devuelve null si no existe, venció o la cuenta está inactiva
 * (las sesiones vencidas se borran). Renueva la sesión si su último uso tiene más de 1 hora.
 */
export async function validarSesion(db: BaseDatos, token: string): Promise<SesionValida | null> {
  const id = hashToken(token)
  const [fila] = await db
    .select({ sesion, usuario })
    .from(sesion)
    .innerJoin(usuario, eq(sesion.usuarioId, usuario.id))
    .where(eq(sesion.id, id))
    .limit(1)
  if (!fila) return null

  const ahora = Date.now()
  if (new Date(fila.sesion.expiraEn).getTime() <= ahora) {
    await db.delete(sesion).where(eq(sesion.id, id))
    return null
  }
  if (!fila.usuario.activo) return null

  const renovada = ahora - new Date(fila.sesion.ultimoUso).getTime() > RENOVAR_TRAS_MS
  if (renovada) {
    await db
      .update(sesion)
      .set({
        ultimoUso: new Date(ahora).toISOString(),
        expiraEn: new Date(ahora + DURACION_MS).toISOString(),
      })
      .where(eq(sesion.id, id))
  }
  return { usuario: aUsuarioSesion(fila.usuario), renovada }
}

export async function cerrarSesion(db: BaseDatos, token: string): Promise<void> {
  await db.delete(sesion).where(eq(sesion.id, hashToken(token)))
}

/** Cierra todas las sesiones del usuario, salvo la del token indicado. */
export async function cerrarSesionesDe(
  db: BaseDatos,
  usuarioId: string,
  exceptoToken?: string,
): Promise<void> {
  const condicion = exceptoToken
    ? and(eq(sesion.usuarioId, usuarioId), ne(sesion.id, hashToken(exceptoToken)))
    : eq(sesion.usuarioId, usuarioId)
  await db.delete(sesion).where(condicion)
}

export function ponerCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: reply.server.config.cookieSegura,
    maxAge: DURACION_MS / 1000,
  })
}

export function borrarCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_SESION, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: reply.server.config.cookieSegura,
  })
}
