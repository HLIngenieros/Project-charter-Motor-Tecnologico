import type { AccesoCharter, CharterDetalle, CharterResumen } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

async function escenario() {
  const { app } = await nuevaApp()
  const ana = await sesionDe(app, 'ana@hlingenieros.com')
  const id = await crearCharterPrueba(app, ana)
  return { app, ana, id }
}

const compartir = (
  app: FastifyInstance,
  cab: Record<string, string>,
  id: string,
  correo: string,
  rol = 'editor',
) =>
  app.inject({
    method: 'POST',
    url: `/api/charters/${id}/accesos`,
    headers: cab,
    payload: { correo, rol },
  })

const escribirLista = (app: FastifyInstance, cab: Record<string, string>, id: string) =>
  app.inject({
    method: 'PUT',
    url: `/api/charters/${id}/listas/objetivo`,
    headers: cab,
    payload: { items: [{ texto: 'Objetivo' }] },
  })

const detalle = async (app: FastifyInstance, cab: Record<string, string>, id: string) =>
  app.inject({ method: 'GET', url: `/api/charters/${id}`, headers: cab })

describe('compartir charters', () => {
  it('el dueño comparte con un correo sin cuenta: queda pendiente y vale al registrarse', async () => {
    const { app, ana, id } = await escenario()
    const r = await compartir(app, ana, id, '  Beto@HLIngenieros.com ', 'editor')
    expect(r.statusCode).toBe(200)
    expect(r.json<AccesoCharter[]>()).toEqual([
      { correo: 'beto@hlingenieros.com', rol: 'editor', nombre: null },
    ])

    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const lista = await app.inject({ method: 'GET', url: '/api/charters', headers: beto })
    expect(lista.json<CharterResumen[]>().map((c) => [c.id, c.compartido])).toEqual([
      [id, 'editor'],
    ])
    const d = (await detalle(app, beto, id)).json<CharterDetalle>()
    expect(d.rol).toBe('editor')
    expect(d.permisos).toEqual({ editar: true, reabrir: false, compartir: false })
    expect((await escribirLista(app, beto, id)).statusCode).toBe(200)

    const accesos = await app.inject({
      method: 'GET',
      url: `/api/charters/${id}/accesos`,
      headers: ana,
    })
    expect(accesos.json<AccesoCharter[]>()[0]!.nombre).toBe('beto Prueba')
  })

  it('el lector consulta pero no escribe', async () => {
    const { app, ana, id } = await escenario()
    await compartir(app, ana, id, 'luz@hlingenieros.com', 'lector')
    const luz = await sesionDe(app, 'luz@hlingenieros.com')
    const d = (await detalle(app, luz, id)).json<CharterDetalle>()
    expect(d.rol).toBe('lector')
    expect(d.permisos.editar).toBe(false)
    const r = await escribirLista(app, luz, id)
    expect(r.statusCode).toBe(403)
    expect(r.json().error).toMatchObject({
      codigo: 'solo_lectura',
      mensaje: 'Tienes acceso de solo lectura a este charter.',
    })
  })

  it('el editor no cambia el estado, no elimina ni comparte', async () => {
    const { app, ana, id } = await escenario()
    await compartir(app, ana, id, 'beto@hlingenieros.com')
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const patch = (payload: object) =>
      app.inject({ method: 'PATCH', url: `/api/charters/${id}`, headers: beto, payload })
    expect((await patch({ nombre: 'Nuevo nombre' })).statusCode).toBe(200)
    const estado = await patch({ estado: 'pausado' })
    expect(estado.statusCode).toBe(403)
    expect(estado.json().error).toMatchObject({ codigo: 'solo_dueno' })
    expect(
      (await app.inject({ method: 'DELETE', url: `/api/charters/${id}`, headers: beto }))
        .statusCode,
    ).toBe(403)
    expect((await compartir(app, beto, id, 'luz@hlingenieros.com')).statusCode).toBe(403)
  })

  it('cambiar el rol no duplica y quitar el acceso lo oculta', async () => {
    const { app, ana, id } = await escenario()
    await compartir(app, ana, id, 'beto@hlingenieros.com', 'editor')
    const r = await compartir(app, ana, id, 'beto@hlingenieros.com', 'lector')
    expect(r.json<AccesoCharter[]>()).toEqual([
      { correo: 'beto@hlingenieros.com', rol: 'lector', nombre: null },
    ])
    const quitar = await app.inject({
      method: 'DELETE',
      url: `/api/charters/${id}/accesos/beto@hlingenieros.com`,
      headers: ana,
    })
    expect(quitar.json()).toEqual([])
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    expect((await detalle(app, beto, id)).statusCode).toBe(404)
  })

  it('valida el dominio y el correo del dueño', async () => {
    const { app, ana, id } = await escenario()
    const fuera = await compartir(app, ana, id, 'x@gmail.com')
    expect(fuera.statusCode).toBe(400)
    expect(fuera.json().error.campos.correo).toBe(
      'Solo puedes compartir con correos @hlingenieros.com',
    )
    const propio = await compartir(app, ana, id, 'ana@hlingenieros.com')
    expect(propio.json().error.campos.correo).toBe('Ese es el correo del dueño del charter')
    expect((await compartir(app, ana, id, 'beto@hlingenieros.com', 'jefe')).statusCode).toBe(400)
  })

  it('eliminar el charter borra sus accesos', async () => {
    const { app, ana, id } = await escenario()
    await compartir(app, ana, id, 'beto@hlingenieros.com')
    const r = await app.inject({ method: 'DELETE', url: `/api/charters/${id}`, headers: ana })
    expect(r.statusCode).toBe(204)
  })
})
