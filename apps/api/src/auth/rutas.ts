import {
  cambiarClaveEntrada,
  esCorreoPermitido,
  loginEntrada,
  registroEntrada,
  type UsuarioPublico,
} from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { v7 } from 'uuid'
import { esViolacionUnica } from '../db/errores'
import { usuario } from '../db/esquema'
import { ErrorApi } from '../errores'
import { cifrarClave, hashDeRelleno, verificarClave } from './claves'
import { exigirSesion } from './guardas'
import {
  LimitePorCorreo,
  MAX_INTENTOS,
  MAX_REGISTROS,
  VENTANA_MS,
  VENTANA_REGISTRO_MS,
} from './limite'
import {
  aUsuarioSesion,
  borrarCookie,
  cerrarSesion,
  cerrarSesionesDe,
  COOKIE_SESION,
  crearSesion,
  ponerCookie,
  type UsuarioSesion,
} from './sesiones'

const publico = (u: UsuarioSesion): UsuarioPublico => ({ ...u })

const credencialesInvalidas = () =>
  new ErrorApi(401, 'credenciales_invalidas', 'El correo o la clave no son correctos')

/** Rutas de `/api/auth`. */
export async function rutasAuth(app: FastifyInstance): Promise<void> {
  const limiteCorreo = new LimitePorCorreo()
  const { db } = app

  const limiteRegistro = {
    config: { rateLimit: { max: MAX_REGISTROS, timeWindow: VENTANA_REGISTRO_MS } },
  }

  app.post('/registro', limiteRegistro, async (request, reply) => {
    const datos = registroEntrada.parse(request.body)
    if (!esCorreoPermitido(datos.correo, app.config.dominioPermitido)) {
      throw new ErrorApi(
        403,
        'dominio_no_permitido',
        `Usa tu correo @${app.config.dominioPermitido}`,
        { correo: `Usa tu correo @${app.config.dominioPermitido}` },
      )
    }
    const { correosPermitidos } = app.config
    if (correosPermitidos.length > 0 && !correosPermitidos.includes(datos.correo.toLowerCase())) {
      const mensaje = 'Este correo no tiene acceso. Pide que lo agreguen.'
      throw new ErrorApi(403, 'correo_no_permitido', mensaje, { correo: mensaje })
    }
    const rechazado = () =>
      new ErrorApi(409, 'registro_rechazado', 'No fue posible crear la cuenta con ese correo')
    const [existente] = await db
      .select({ id: usuario.id })
      .from(usuario)
      .where(eq(usuario.correo, datos.correo))
      .limit(1)
    if (existente) throw rechazado()

    const hashClave = await cifrarClave(datos.clave)
    let fila
    try {
      ;[fila] = await db
        .insert(usuario)
        .values({ id: v7(), correo: datos.correo, nombre: datos.nombre, hashClave })
        .returning()
    } catch (error) {
      if (esViolacionUnica(error)) throw rechazado()
      throw error
    }

    ponerCookie(reply, await crearSesion(db, fila!.id))
    return reply.status(201).send(publico(aUsuarioSesion(fila!)))
  })

  app.post(
    '/login',
    { config: { rateLimit: { max: MAX_INTENTOS, timeWindow: VENTANA_MS } } },
    async (request, reply) => {
      const datos = loginEntrada.parse(request.body)
      limiteCorreo.registrar(datos.correo)

      const [fila] = await db
        .select()
        .from(usuario)
        .where(eq(usuario.correo, datos.correo))
        .limit(1)
      const valida = await verificarClave(fila?.hashClave ?? (await hashDeRelleno()), datos.clave)
      if (!fila || !valida) throw credencialesInvalidas()
      if (!fila.activo) {
        throw new ErrorApi(
          403,
          'cuenta_inactiva',
          'Tu cuenta está desactivada. Habla con el administrador.',
        )
      }

      ponerCookie(reply, await crearSesion(db, fila.id))
      return publico(aUsuarioSesion(fila))
    },
  )

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[COOKIE_SESION]
    if (token) await cerrarSesion(db, token)
    borrarCookie(reply)
    return reply.status(204).send()
  })

  app.get('/yo', { preHandler: exigirSesion }, async (request) => publico(request.usuario!))

  app.post('/cambiar-clave', { preHandler: exigirSesion }, async (request, reply) => {
    const datos = cambiarClaveEntrada.parse(request.body)
    const yo = request.usuario!
    const [fila] = await db.select().from(usuario).where(eq(usuario.id, yo.id)).limit(1)
    if (!fila || !(await verificarClave(fila.hashClave, datos.claveActual))) {
      throw new ErrorApi(400, 'clave_incorrecta', 'La clave actual no es correcta', {
        claveActual: 'La clave actual no es correcta',
      })
    }
    await db
      .update(usuario)
      .set({ hashClave: await cifrarClave(datos.claveNueva), debeCambiarClave: false })
      .where(eq(usuario.id, yo.id))
    await cerrarSesionesDe(db, yo.id, request.cookies[COOKIE_SESION])
    return reply.status(204).send()
  })
}
