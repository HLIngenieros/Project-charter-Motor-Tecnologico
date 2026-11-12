import type { CuentaAdmin } from '@charter/shared'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { conSesion, crearCharterPrueba, CSRF, entrar, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>
let admin: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
  admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
})

const listar = async (h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'GET', url: '/api/admin/cuentas', headers: h })
const idDe = async (correo: string) =>
  (await listar()).json<CuentaAdmin[]>().find((c) => c.correo === correo)!.id
const restablecer = async (id: string, h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'POST', url: `/api/admin/cuentas/${id}/restablecer-clave`, headers: h })
const editar = async (id: string, cuerpo: object, h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'PATCH', url: `/api/admin/cuentas/${id}`, headers: h, payload: cuerpo })
const misCharters = (h: Record<string, string>) =>
  app.inject({ method: 'GET', url: '/api/charters', headers: h })

describe('GET /api/admin/cuentas', () => {
  it('lista a todos con charters y último acceso; ordena por nombre', async () => {
    await crearCharterPrueba(app, ana)
    const r = await listar()
    expect(r.statusCode).toBe(200)
    const cuentas = r.json<CuentaAdmin[]>()
    expect(cuentas.map((c) => c.correo)).toEqual(['admin@hlingenieros.com', 'ana@hlingenieros.com'])
    const [adm, an] = cuentas
    expect(an).toMatchObject({
      nombre: 'ana Prueba',
      esAdmin: false,
      activo: true,
      debeCambiarClave: false,
      charters: 1,
    })
    expect(an!.ultimoAcceso).toBeTruthy()
    expect(an!.creadoEn).toBeTruthy()
    expect(adm).toMatchObject({ esAdmin: true, charters: 0 })
  })

  it('un usuario que no es Admin recibe 403 en las tres rutas', async () => {
    const id = await idDe('ana@hlingenieros.com')
    for (const r of [
      await listar(ana),
      await restablecer(id, ana),
      await editar(id, { activo: false }, ana),
    ]) {
      expect(r.statusCode).toBe(403)
      expect(r.json().error.codigo).toBe('solo_admin')
    }
  })
})

describe('restablecer clave', () => {
  it('da una clave temporal, cierra la sesión y obliga a cambiarla', async () => {
    const id = await idDe('ana@hlingenieros.com')
    const r = await restablecer(id)
    expect(r.statusCode).toBe(200)
    const { claveTemporal } = r.json<{ claveTemporal: string }>()
    expect(claveTemporal).toMatch(
      /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]{12}$/,
    )

    // La cookie anterior ya no sirve.
    expect((await misCharters(ana)).statusCode).toBe(401)

    const login = await entrar(app, 'ana@hlingenieros.com', claveTemporal)
    expect(login.statusCode).toBe(200)
    expect(login.json().debeCambiarClave).toBe(true)
    const nueva = { ...conSesion(login), ...CSRF }
    const bloqueado = await misCharters(nueva)
    expect(bloqueado.statusCode).toBe(403)
    expect(bloqueado.json().error.codigo).toBe('debe_cambiar_clave')

    const cambio = await app.inject({
      method: 'POST',
      url: '/api/auth/cambiar-clave',
      headers: nueva,
      payload: { claveActual: claveTemporal, claveNueva: 'otra-clave-segura' },
    })
    expect(cambio.statusCode).toBe(204)
    expect((await misCharters(nueva)).statusCode).toBe(200)
    const cuenta = (await listar()).json<CuentaAdmin[]>().find((c) => c.id === id)!
    expect(cuenta.debeCambiarClave).toBe(false)
  })

  it('id inexistente → 404', async () => {
    const r = await restablecer('no-existe')
    expect(r.statusCode).toBe(404)
    expect(r.json().error.codigo).toBe('no_encontrado')
  })
})

describe('PATCH /api/admin/cuentas/:id', () => {
  it('desactivar cierra la sesión y bloquea el login; reactivar no revive la cookie', async () => {
    const id = await idDe('ana@hlingenieros.com')
    const r = await editar(id, { activo: false })
    expect(r.statusCode).toBe(200)
    expect(r.json<CuentaAdmin>().activo).toBe(false)
    expect((await misCharters(ana)).statusCode).toBe(401)
    const login = await entrar(app, 'ana@hlingenieros.com', 'clave-segura-1')
    expect(login.statusCode).toBe(403)
    expect(login.json().error.codigo).toBe('cuenta_inactiva')

    expect((await editar(id, { activo: true })).json<CuentaAdmin>().activo).toBe(true)
    expect((await misCharters(ana)).statusCode).toBe(401)
    const otraVez = await entrar(app, 'ana@hlingenieros.com', 'clave-segura-1')
    expect(otraVez.statusCode).toBe(200)
    expect((await misCharters({ ...conSesion(otraVez), ...CSRF })).statusCode).toBe(200)
  })

  it('da y quita el rol de Admin', async () => {
    const id = await idDe('ana@hlingenieros.com')
    expect((await editar(id, { esAdmin: true })).json<CuentaAdmin>().esAdmin).toBe(true)
    expect((await listar(ana)).statusCode).toBe(200)
    expect((await editar(id, { esAdmin: false })).json<CuentaAdmin>().esAdmin).toBe(false)
    expect((await listar(ana)).statusCode).toBe(403)
  })

  it('no permite desactivarse ni quitarse el rol a sí mismo', async () => {
    const yo = await idDe('admin@hlingenieros.com')
    for (const cuerpo of [{ activo: false }, { esAdmin: false }]) {
      const r = await editar(yo, cuerpo)
      expect(r.statusCode).toBe(400)
      expect(r.json().error.codigo).toBe('sobre_si_mismo')
    }
    // Reafirmar lo que ya tiene sí se permite.
    expect((await editar(yo, { activo: true })).statusCode).toBe(200)
  })

  it('id inexistente → 404 y cuerpo vacío → 400', async () => {
    expect((await editar('no-existe', { activo: false })).statusCode).toBe(404)
    const id = await idDe('ana@hlingenieros.com')
    expect((await editar(id, {})).statusCode).toBe(400)
    expect((await editar(id, { nombre: 'x' })).statusCode).toBe(400)
  })
})

describe('editarCuenta (servicio)', () => {
  it('409 ultimo_admin si la operación deja el sistema sin Admin activo', async () => {
    const { editarCuenta } = await import('../src/modulos/admin/cuentas')
    const yo = await idDe('admin@hlingenieros.com')
    const id = await idDe('ana@hlingenieros.com')
    // Un actor distinto (Ana, sin ser Admin) sobre el único Admin: el servicio no mira el rol del actor.
    await expect(editarCuenta(app.db, id, yo, { esAdmin: false })).rejects.toMatchObject({
      estado: 409,
      codigo: 'ultimo_admin',
    })
    await expect(editarCuenta(app.db, id, yo, { activo: false })).rejects.toMatchObject({
      codigo: 'ultimo_admin',
    })
  })
})
