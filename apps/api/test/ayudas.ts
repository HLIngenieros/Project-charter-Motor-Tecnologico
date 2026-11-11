import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { eq } from 'drizzle-orm'
import { construirApp } from '../src/app'
import { leerConfig } from '../src/config'
import type { PGlite } from '@electric-sql/pglite'
import { envolverPglite, prepararDb, type BaseDatos } from '../src/db/conexion'
import { usuario as tablaUsuario } from '../src/db/esquema'

export const CSRF = { 'x-requested-with': 'charter' }

export interface Contexto {
  app: FastifyInstance
  db: BaseDatos
}

/** Base migrada una sola vez por archivo de prueba; cada caso trabaja sobre un clon. */
let plantilla: Promise<PGlite> | undefined

export async function crearDbPrueba(): Promise<BaseDatos> {
  plantilla ??= (async () => {
    const { PGlite } = await import('@electric-sql/pglite')
    const cliente = new PGlite()
    await prepararDb(await envolverPglite(cliente))
    return cliente
  })()
  return envolverPglite((await (await plantilla).clone()) as PGlite)
}

export async function nuevaApp(
  preparar?: (app: FastifyInstance) => void | Promise<void>,
): Promise<Contexto> {
  const db = await crearDbPrueba()
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

/**
 * Registra una cuenta (opcionalmente Admin) y devuelve las cabeceras de su sesión,
 * con la cabecera anti-CSRF incluida.
 */
export async function sesionDe(
  app: FastifyInstance,
  correo: string,
  { admin = false }: { admin?: boolean } = {},
): Promise<Record<string, string>> {
  const nombre = correo.split('@')[0]!
  const r = await registrar(app, { correo, nombre: `${nombre} Prueba`, clave: 'clave-segura-1' })
  if (r.statusCode !== 201) throw new Error(`No se pudo registrar ${correo}: ${r.body}`)
  if (admin) {
    await app.db.update(tablaUsuario).set({ esAdmin: true }).where(eq(tablaUsuario.correo, correo))
  }
  return { ...conSesion(r), ...CSRF }
}

export async function crearCharterPrueba(
  app: FastifyInstance,
  cabeceras: Record<string, string>,
  cuerpo: Record<string, unknown> = { nombre: 'Plan de prueba' },
): Promise<string> {
  const r = await app.inject({
    method: 'POST',
    url: '/api/charters',
    headers: cabeceras,
    payload: cuerpo,
  })
  if (r.statusCode !== 201) throw new Error(`No se pudo crear el charter: ${r.body}`)
  return r.json<{ id: string }>().id
}

/** Pausa corta para que dos marcas de tiempo ISO no coincidan. */
export const pausa = (ms = 5) => new Promise((r) => setTimeout(r, ms))
