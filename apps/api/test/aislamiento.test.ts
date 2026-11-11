import { v7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import type { UsuarioSesion } from '../src/auth/sesiones'
import { charter, usuario as tablaUsuario } from '../src/db/esquema'
import type { ErrorApi } from '../src/errores'
import { cargarCharter, type ModoAcceso } from '../src/modulos/charters/acceso'
import { exigirSesion } from '../src/auth/guardas'
import { conSesion, cookieDe, crearDbPrueba, datosRegistro, nuevaApp, registrar } from './ayudas'

async function escenario() {
  const db = await crearDbPrueba()
  const usuario = (nombre: string, esAdmin = false): UsuarioSesion => ({
    id: v7(),
    correo: `${nombre}@hlingenieros.com`,
    nombre,
    esAdmin,
    debeCambiarClave: false,
  })
  const a = usuario('a')
  const b = usuario('b')
  const admin = usuario('admin', true)
  await db.insert(tablaUsuario).values([a, b, admin].map((u) => ({ ...u, hashClave: 'x' })))
  const nuevoCharter = async (dueno: UsuarioSesion, estado: 'activo' | 'cerrado' = 'activo') => {
    const id = v7()
    await db
      .insert(charter)
      .values({ id, propietarioId: dueno.id, nombre: `De ${dueno.nombre}`, estado })
    return id
  }
  return { db, a, b, admin, nuevoCharter }
}

async function errorDe(p: Promise<unknown>): Promise<ErrorApi> {
  const e = await p.then(
    () => null,
    (x: unknown) => x,
  )
  // Por nombre y no con instanceof: en Windows vitest a veces carga dos copias del módulo
  // (la letra de unidad llega en mayúscula por una ruta y en minúscula por otra).
  expect((e as Error).name).toBe('ErrorApi')
  return e as ErrorApi
}

const serializar = (e: ErrorApi) =>
  JSON.stringify({ estado: e.estado, codigo: e.codigo, mensaje: e.message, campos: e.campos })

describe('cargarCharter', () => {
  it('el dueño lee y escribe su charter', async () => {
    const { db, a, nuevoCharter } = await escenario()
    const id = await nuevoCharter(a)
    for (const modo of ['lectura', 'escritura', 'reapertura'] as ModoAcceso[]) {
      expect((await cargarCharter(db, id, a, modo)).id).toBe(id)
    }
  })

  it('otro usuario recibe el mismo 404 que con un id inexistente', async () => {
    const { db, a, b, nuevoCharter } = await escenario()
    const id = await nuevoCharter(a)
    const inexistente = await errorDe(cargarCharter(db, v7(), b, 'lectura'))
    expect(inexistente.estado).toBe(404)
    expect(inexistente.codigo).toBe('no_encontrado')
    for (const modo of ['lectura', 'escritura', 'reapertura'] as ModoAcceso[]) {
      const ajeno = await errorDe(cargarCharter(db, id, b, modo))
      expect(serializar(ajeno)).toBe(serializar(inexistente))
    }
  })

  it('el Admin lee el charter ajeno pero no lo escribe', async () => {
    const { db, a, admin, nuevoCharter } = await escenario()
    const id = await nuevoCharter(a)
    expect((await cargarCharter(db, id, admin, 'lectura')).id).toBe(id)
    const e = await errorDe(cargarCharter(db, id, admin, 'escritura'))
    expect([e.estado, e.codigo]).toEqual([403, 'solo_lectura'])
    const r = await errorDe(cargarCharter(db, id, admin, 'reapertura'))
    expect([r.estado, r.codigo]).toEqual([403, 'solo_lectura'])
  })

  it('el Admin escribe su propio charter', async () => {
    const { db, admin, nuevoCharter } = await escenario()
    const id = await nuevoCharter(admin)
    expect((await cargarCharter(db, id, admin, 'escritura')).id).toBe(id)
  })

  it('un charter cerrado no se escribe pero el dueño lo puede reabrir', async () => {
    const { db, a, nuevoCharter } = await escenario()
    const id = await nuevoCharter(a, 'cerrado')
    const e = await errorDe(cargarCharter(db, id, a, 'escritura'))
    expect([e.estado, e.codigo]).toEqual([409, 'charter_cerrado'])
    expect((await cargarCharter(db, id, a, 'reapertura')).estado).toBe('cerrado')
    expect((await cargarCharter(db, id, a, 'lectura')).id).toBe(id)
  })

  it('por HTTP, el 404 ajeno es idéntico byte a byte al de un id inexistente', async () => {
    const { app, db } = await nuevaApp((a) => {
      a.get<{ Params: { id: string } }>(
        '/api/prueba-charter/:id',
        { preHandler: exigirSesion },
        async (request) => {
          const c = await cargarCharter(a.db, request.params.id, request.usuario!, 'lectura')
          return { id: c.id }
        },
      )
    })
    const duenoId = (await registrar(app)).json().id as string
    const otro = await registrar(app, { ...datosRegistro, correo: 'otro@hlingenieros.com' })
    const id = v7()
    await db.insert(charter).values({ id, propietarioId: duenoId, nombre: 'Privado' })

    const ajeno = await app.inject({ url: `/api/prueba-charter/${id}`, headers: conSesion(otro) })
    const inexistente = await app.inject({
      url: `/api/prueba-charter/${v7()}`,
      headers: conSesion(otro),
    })
    expect(ajeno.statusCode).toBe(404)
    expect(ajeno.body).toBe(inexistente.body)
    expect(ajeno.body).not.toContain('Privado')
    expect(cookieDe(otro)).toBeDefined()
  })
})
