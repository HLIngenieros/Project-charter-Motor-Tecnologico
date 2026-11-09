import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { construirApp } from '../src/app'
import { leerConfig } from '../src/config'
import { crearDb, type BaseDatos } from '../src/db/conexion'

export const CSRF = { 'x-requested-with': 'charter' }

export interface Contexto {
  app: FastifyInstance
  db: BaseDatos
}

export async function nuevaApp(
  preparar?: (app: FastifyInstance) => void | Promise<void>,
): Promise<Contexto> {
  const db = crearDb(':memory:')
  const app = await construirApp({ db, config: leerConfig({}) })
  await preparar?.(app)
  await app.ready()
  return { app, db }
}

export function cookieDe(r: LightMyRequestResponse) {
  return r.cookies.find((c) => c.name === 'charter_sesion')
}

/** Cabecera Cookie para reenviar la sesión de una respuesta. */
export function conSesion(r: LightMyRequestResponse | string): Record<string, string> {
  const valor = typeof r === 'string' ? r : cookieDe(r)?.value
  return { cookie: `charter_sesion=${valor}` }
}

export const datosRegistro = {
  correo: 'ana@hlingenieros.com',
  nombre: 'Ana Pérez',
  clave: 'clave-segura-1',
}

export function registrar(app: FastifyInstance, cuerpo: Record<string, unknown> = datosRegistro) {
  return app.inject({ method: 'POST', url: '/api/auth/registro', headers: CSRF, payload: cuerpo })
}

export function entrar(
  app: FastifyInstance,
  correo: string,
  clave: string,
  remoteAddress = '127.0.0.1',
) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: CSRF,
    payload: { correo, clave },
    remoteAddress,
  })
}
