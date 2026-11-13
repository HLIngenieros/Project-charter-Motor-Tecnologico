import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { exigirSesion } from '../src/auth/guardas'
import { sesion, usuario } from '../src/db/esquema'
import { construirApp } from '../src/app'
import { leerConfig } from '../src/config'
import {
  CSRF,
  conSesion,
  cookieDe,
  crearDbPrueba,
  datosRegistro,
  entrar,
  nuevaApp,
  registrar,
} from './ayudas'

describe('registro', () => {
  it('crea la cuenta y la sesión con una cookie HttpOnly y SameSite=Lax', async () => {
    const { app } = await nuevaApp()
    const r = await registrar(app)
    expect(r.statusCode).toBe(201)
    expect(r.json()).toEqual({
      id: expect.any(String),
      correo: 'ana@hlingenieros.com',
      nombre: 'Ana Pérez',
      esAdmin: false,
      debeCambiarClave: false,
    })
    const cookie = cookieDe(r)
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' })
    expect(cookie?.secure).toBeFalsy()

    const yo = await app.inject({ method: 'GET', url: '/api/auth/yo', headers: conSesion(r) })
    expect(yo.statusCode).toBe(200)
    expect(yo.json().correo).toBe('ana@hlingenieros.com')
  })

  it('normaliza el correo con espacios y mayúsculas', async () => {
    const { app } = await nuevaApp()
    const r = await registrar(app, { ...datosRegistro, correo: ' JUrbina@HLIngenieros.com ' })
    expect(r.statusCode).toBe(201)
    expect(r.json().correo).toBe('jurbina@hlingenieros.com')
  })

  it.each(['x@gmail.com', 'x@hlingenieros.com.co', 'x@sub.hlingenieros.com'])(
    'rechaza %s con 403 dominio_no_permitido',
    async (correo) => {
      const { app } = await nuevaApp()
      const r = await registrar(app, { ...datosRegistro, correo })
      expect(r.statusCode).toBe(403)
      expect(r.json().error.codigo).toBe('dominio_no_permitido')
    },
  )

  it('con CORREOS_PERMITIDOS, solo esos correos se registran', async () => {
    const app = await construirApp({
      db: await crearDbPrueba(),
      config: leerConfig({ CORREOS_PERMITIDOS: 'ana@hlingenieros.com' }),
    })
    const fuera = await registrar(app, { ...datosRegistro, correo: 'otro@hlingenieros.com' })
    expect(fuera.statusCode).toBe(403)
    expect(fuera.json().error.codigo).toBe('correo_no_permitido')
    expect(
      (await registrar(app, { ...datosRegistro, correo: 'ANA@hlingenieros.com' })).statusCode,
    ).toBe(201)
    await app.close()
  })

  it('sin CORREOS_PERMITIDOS, cualquiera del dominio se registra', async () => {
    const { app } = await nuevaApp()
    const r = await registrar(app, { ...datosRegistro, correo: 'otro@hlingenieros.com' })
    expect(r.statusCode).toBe(201)
  })

  it('rechaza un correo repetido aunque cambien las mayúsculas', async () => {
    const { app } = await nuevaApp()
    await registrar(app)
    const r = await registrar(app, { ...datosRegistro, correo: 'ANA@hlingenieros.com' })
    expect(r.statusCode).toBe(409)
    expect(r.json()).toEqual({
      error: {
        codigo: 'registro_rechazado',
        mensaje: 'No fue posible crear la cuenta con ese correo',
      },
    })
  })

  it('registro concurrente con el mismo correo da un 201 y un 409', async () => {
    const { app } = await nuevaApp()
    const respuestas = await Promise.all([registrar(app), registrar(app)])
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409])
    const rechazo = respuestas.find((r) => r.statusCode === 409)!
    expect(rechazo.json().error.codigo).toBe('registro_rechazado')
  })

  it('una clave de 7 caracteres da 400 con el campo clave', async () => {
    const { app } = await nuevaApp()
    const r = await registrar(app, { ...datosRegistro, clave: '1234567' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error).toMatchObject({
      codigo: 'datos_invalidos',
      campos: { clave: 'La clave debe tener al menos 8 caracteres' },
    })
  })

  it('no guarda la clave ni el token en claro', async () => {
    const { app, db } = await nuevaApp()
    const r = await registrar(app)
    const token = cookieDe(r)!.value
    const [u] = await db.select().from(usuario)
    expect(u!.hashClave).not.toContain(datosRegistro.clave)
    expect(u!.hashClave).toMatch(/^\$argon2id\$/)
    const sesiones = await db.select().from(sesion)
    expect(sesiones).toHaveLength(1)
    expect(sesiones[0]!.id).not.toBe(token)
    expect(JSON.stringify(sesiones)).not.toContain(token)
  })
})

describe('login', () => {
  it('entra con la clave correcta y da el mismo error en los dos fallos', async () => {
    const { app } = await nuevaApp()
    await registrar(app)

    const ok = await entrar(app, ' Ana@HLIngenieros.com', datosRegistro.clave)
    expect(ok.statusCode).toBe(200)
    expect(ok.json().correo).toBe('ana@hlingenieros.com')
    expect(cookieDe(ok)?.value).toBeTruthy()

    const claveMala = await entrar(app, datosRegistro.correo, 'otra-clave-123')
    const noExiste = await entrar(app, 'nadie@hlingenieros.com', datosRegistro.clave)
    expect(claveMala.statusCode).toBe(401)
    expect(noExiste.statusCode).toBe(401)
    expect(claveMala.json()).toEqual(noExiste.json())
    expect(claveMala.json().error.codigo).toBe('credenciales_invalidas')
  })

  it('una cuenta inactiva da 403 cuenta_inactiva', async () => {
    const { app, db } = await nuevaApp()
    await registrar(app)
    await db.update(usuario).set({ activo: false })
    const r = await entrar(app, datosRegistro.correo, datosRegistro.clave)
    expect(r.statusCode).toBe(403)
    expect(r.json().error.codigo).toBe('cuenta_inactiva')
  })

  it('el intento 11 por correo da 429 aunque cambie la IP', async () => {
    const { app } = await nuevaApp()
    await registrar(app)
    for (let i = 0; i < 10; i++) {
      const r = await entrar(app, datosRegistro.correo, 'mala-clave-xx', `10.0.0.${i}`)
      expect(r.statusCode).toBe(401)
    }
    const r = await entrar(app, datosRegistro.correo, datosRegistro.clave, '10.0.1.1')
    expect(r.statusCode).toBe(429)
    expect(r.json().error.codigo).toBe('demasiados_intentos')
  })

  it('el registro 21 desde la misma IP en una hora da 429', async () => {
    const { app } = await nuevaApp()
    const registrarDesde = (i: number) =>
      app.inject({
        method: 'POST',
        url: '/api/auth/registro',
        headers: CSRF,
        remoteAddress: '10.7.7.7',
        payload: { ...datosRegistro, correo: `r${i}@hlingenieros.com` },
      })
    for (let i = 0; i < 20; i++) expect((await registrarDesde(i)).statusCode).toBe(201)
    const r = await registrarDesde(20)
    expect(r.statusCode).toBe(429)
    expect(r.json().error.codigo).toBe('demasiados_intentos')
  })

  it('el intento 11 por IP da 429 aunque cambie el correo', async () => {
    const { app } = await nuevaApp()
    for (let i = 0; i < 10; i++) {
      const r = await entrar(app, `u${i}@hlingenieros.com`, 'mala-clave-xx', '10.9.9.9')
      expect(r.statusCode).toBe(401)
    }
    const r = await entrar(app, 'otro@hlingenieros.com', 'mala-clave-xx', '10.9.9.9')
    expect(r.statusCode).toBe(429)
    expect(r.json().error.codigo).toBe('demasiados_intentos')
  })
})

describe('sesiones inválidas', () => {
  async function esperar401(app: Awaited<ReturnType<typeof nuevaApp>>['app'], token: string) {
    const r = await app.inject({ method: 'GET', url: '/api/auth/yo', headers: conSesion(token) })
    expect(r.statusCode).toBe(401)
    expect(r.json().error.codigo).toBe('no_autenticado')
    const cookie = cookieDe(r)
    expect(cookie?.value).toBe('')
    expect(new Date(cookie!.expires!).getTime()).toBeLessThan(Date.now())
  }

  it('sin cookie da 401', async () => {
    const { app } = await nuevaApp()
    const r = await app.inject({ method: 'GET', url: '/api/auth/yo' })
    expect(r.statusCode).toBe(401)
  })

  it('una sesión vencida da 401 y borra la cookie', async () => {
    const { app, db } = await nuevaApp()
    const token = cookieDe(await registrar(app))!.value
    await db.update(sesion).set({ expiraEn: '2000-01-01T00:00:00.000Z' })
    await esperar401(app, token)
  })

  it('una cookie después de salir da 401', async () => {
    const { app } = await nuevaApp()
    const token = cookieDe(await registrar(app))!.value
    const salir = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { ...CSRF, ...conSesion(token) },
    })
    expect(salir.statusCode).toBe(204)
    expect(cookieDe(salir)?.value).toBe('')
    await esperar401(app, token)
  })

  it('una cuenta desactivada da 401', async () => {
    const { app, db } = await nuevaApp()
    const token = cookieDe(await registrar(app))!.value
    await db.update(usuario).set({ activo: false })
    await esperar401(app, token)
  })

  it('un token inventado da 401', async () => {
    const { app } = await nuevaApp()
    await esperar401(app, 'token-inventado')
  })

  it('renueva la sesión si el último uso tiene más de una hora', async () => {
    const { app, db } = await nuevaApp()
    const token = cookieDe(await registrar(app))!.value
    const hace2h = new Date(Date.now() - 2 * 3600_000).toISOString()
    await db
      .update(sesion)
      .set({ ultimoUso: hace2h, expiraEn: new Date(Date.now() + 3600_000).toISOString() })

    const r = await app.inject({ method: 'GET', url: '/api/auth/yo', headers: conSesion(token) })
    expect(r.statusCode).toBe(200)
    expect(cookieDe(r)?.value).toBe(token)
    const [s] = await db.select().from(sesion)
    expect(new Date(s!.expiraEn).getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000)
    expect(s!.ultimoUso > hace2h).toBe(true)
  })
})

describe('protección CSRF', () => {
  it('un POST sin X-Requested-With da 403 csrf', async () => {
    const { app } = await nuevaApp()
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/registro',
      payload: datosRegistro,
    })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.codigo).toBe('csrf')
  })
})

describe('cambio de clave obligatorio', () => {
  it('bloquea las rutas privadas hasta que se cambia la clave', async () => {
    const { app, db } = await nuevaApp((a) => {
      a.get('/api/salud-privada', { preHandler: exigirSesion }, async () => ({ ok: true }))
    })
    const r = await registrar(app)
    const token = cookieDe(r)!.value
    await db.update(usuario).set({ debeCambiarClave: true })

    const bloqueada = await app.inject({
      method: 'GET',
      url: '/api/salud-privada',
      headers: conSesion(token),
    })
    expect(bloqueada.statusCode).toBe(403)
    expect(bloqueada.json().error.codigo).toBe('debe_cambiar_clave')

    const yo = await app.inject({ method: 'GET', url: '/api/auth/yo', headers: conSesion(token) })
    expect(yo.json().debeCambiarClave).toBe(true)

    const mala = await app.inject({
      method: 'POST',
      url: '/api/auth/cambiar-clave',
      headers: { ...CSRF, ...conSesion(token) },
      payload: { claveActual: 'no-es-la-clave', claveNueva: 'clave-nueva-123' },
    })
    expect(mala.statusCode).toBe(400)
    expect(mala.json().error.campos).toHaveProperty('claveActual')

    const cambio = await app.inject({
      method: 'POST',
      url: '/api/auth/cambiar-clave',
      headers: { ...CSRF, ...conSesion(token) },
      payload: { claveActual: datosRegistro.clave, claveNueva: 'clave-nueva-123' },
    })
    expect(cambio.statusCode).toBe(204)

    const libre = await app.inject({
      method: 'GET',
      url: '/api/salud-privada',
      headers: conSesion(token),
    })
    expect(libre.statusCode).toBe(200)
    const [cambiado] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.correo, datosRegistro.correo))
    expect(cambiado?.debeCambiarClave).toBe(false)
  })

  it('cambiar la clave cierra las demás sesiones', async () => {
    const { app } = await nuevaApp()
    const actual = cookieDe(await registrar(app))!.value
    const otra = cookieDe(await entrar(app, datosRegistro.correo, datosRegistro.clave))!.value

    await app.inject({
      method: 'POST',
      url: '/api/auth/cambiar-clave',
      headers: { ...CSRF, ...conSesion(actual) },
      payload: { claveActual: datosRegistro.clave, claveNueva: 'clave-nueva-123' },
    })

    const yoActual = await app.inject({
      method: 'GET',
      url: '/api/auth/yo',
      headers: conSesion(actual),
    })
    const yoOtra = await app.inject({
      method: 'GET',
      url: '/api/auth/yo',
      headers: conSesion(otra),
    })
    expect(yoActual.statusCode).toBe(200)
    expect(yoOtra.statusCode).toBe(401)
    expect((await entrar(app, datosRegistro.correo, 'clave-nueva-123')).statusCode).toBe(200)
  })
})
