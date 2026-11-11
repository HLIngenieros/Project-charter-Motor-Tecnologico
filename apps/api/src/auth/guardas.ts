import type { FastifyReply, FastifyRequest } from 'fastify'
import { ErrorApi } from '../errores'
import { borrarCookie, COOKIE_SESION, ponerCookie, validarSesion } from './sesiones'

const METODOS_MUTACION = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Hook onRequest: toda mutación exige la cabecera `X-Requested-With: charter`. */
export async function exigirCabeceraCsrf(request: FastifyRequest): Promise<void> {
  if (METODOS_MUTACION.has(request.method) && request.headers['x-requested-with'] !== 'charter') {
    throw new ErrorApi(403, 'csrf', 'La solicitud no es válida. Recarga la página.')
  }
}

/** preHandler: exige una sesión válida y deja el usuario en `request.usuario`. */
export async function exigirSesion(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies[COOKIE_SESION]
  const valida = token ? await validarSesion(request.server.db, token) : null
  if (!token || !valida) {
    borrarCookie(reply)
    throw new ErrorApi(401, 'no_autenticado', 'Tu sesión terminó. Entra de nuevo.')
  }
  if (valida.renovada) ponerCookie(reply, token)
  request.usuario = valida.usuario

  const ruta = request.routeOptions.url ?? request.url
  if (valida.usuario.debeCambiarClave && !ruta.startsWith('/api/auth/')) {
    throw new ErrorApi(403, 'debe_cambiar_clave', 'Debes cambiar tu clave antes de continuar.')
  }
}

/** preHandler (después de exigirSesion): solo el perfil Admin. */
export async function exigirAdmin(request: FastifyRequest): Promise<void> {
  if (!request.usuario?.esAdmin) {
    throw new ErrorApi(403, 'solo_admin', 'Esta opción es solo para administradores.')
  }
}
