import { v7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import type { UsuarioSesion } from '../src/auth/sesiones'
import { crearDb } from '../src/db/conexion'
import { charter } from '../src/db/esquema'
import { ErrorApi } from '../src/errores'
import { cargarCharter, type ModoAcceso } from '../src/modulos/charters/acceso'
import { exigirSesion } from '../src/auth/guardas'
import { conSesion, cookieDe, datosRegistro, nuevaApp, registrar } from './ayudas'

function escenario() {
  const db = crearDb(':memory:')
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
  for (const u of [a, b, admin]) {
    db.$client
      .prepare(
        "insert into usuario (id, correo, nombre, hash_clave, es_admin, creado_en, actualizado_en) values (?, ?, ?, 'x', ?, '', '')",
      )
      .run(u.id, u.correo, u.nombre, u.esAdmin ? 1 : 0)
  }
  const nuevoCharter = (dueno: UsuarioSesion, estado: 'activo' | 'cerrado' = 'activo') => {
    const id = v7()
    db.insert(charter)
      .values({ id, propietarioId: dueno.id, nombre: `De ${dueno.nombre}`, estado })
      .run()
    return id
  }
  return { db, a, b, admin, nuevoCharter }
}

async function errorDe(p: Promise<unknown>): Promise<ErrorApi> {
  const e = await p.then(
    () => null,
    (x: unknown) => x,
  )
  expect(e).toBeInstanceOf(ErrorApi)
  return e as ErrorApi
}

const serializar = (e: ErrorApi) =>
  JSON.stringify({ estado: e.estado, codigo: e.codigo, mensaje: e.message, campos: e.campos })

describe('cargarCharter', () => {
  it('el dueño lee y escribe su charter', async () => {
    const { db, a, nuevoCharter } = escenario()
    const id = nuevoCharter(a)
    for (const modo of ['lectura', 'escritura', 'reapertura'] as ModoAcceso[]) {
      expect((await cargarCharter(db, id, a, modo)).id).toBe(id)
    }
  })

  it('otro usuario recibe el mismo 404 que con un id inexistente', async () => {
    const { db, a, b, nuevoCharter } = escenario()
    const id = nuevoCharter(a)
    const inexistente = await errorDe(cargarCharter(db, v7(), b, 'lectura'))
    expect(inexistente.estado).toBe(404)
    expect(inexistente.codigo).toBe('no_encontrado')
    for (const modo of ['lectura', 'escritura', 'reapertura'] as ModoAcceso[]) {
      const ajeno = await errorDe(cargarCharter(db, id, b, modo))
      expect(serializar(ajeno)).toBe(serializar(inexistente))
    }
  })

  it('el Admin lee el charter ajeno pero no lo escribe', async () => {
    const { db, a, admin, nuevoCharter } = escenario()
    const id = nuevoCharter(a)
    expect((await cargarCharter(db, id, admin, 'lectura')).id).toBe(id)
    const e = await errorDe(cargarCharter(db, id, admin, 'escritura'))
    expect([e.estado, e.codigo]).toEqual([403, 'solo_lectura'])
    const r = await errorDe(cargarCharter(db, id, admin, 'reapertura'))
    expect([r.estado, r.codigo]).toEqual([403, 'solo_lectura'])
  })

  it('el Admin escribe su propio charter', async () => {
    const { db, admin, nuevoCharter } = escenario()
    const id = nuevoCharter(admin)
    expect((await cargarCharter(db, id, admin, 'escritura')).id).toBe(id)
  })

  it('un charter cerrado no se escribe pero el dueño lo puede reabrir', async () => {
    const { db, a, nuevoCharter } = escenario()
    const id = nuevoCharter(a, 'cerrado')
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
    db.insert(charter).values({ id, propietarioId: duenoId, nombre: 'Privado' }).run()

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
