import type { CharterDetalle, CharterResumen, ItemLista } from '@charter/shared'
import type { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { crearCharterPrueba, nuevaApp, pausa, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
})

const textos = (...t: string[]) => ({ items: t.map((texto) => ({ texto })) })

const guardar = (id: string, tipo: string, cuerpo: unknown, h = ana) =>
  app.inject({
    method: 'PUT',
    url: `/api/charters/${id}/listas/${tipo}`,
    headers: h,
    payload: cuerpo as object,
  })

const detalle = async (id: string) =>
  (
    await app.inject({ method: 'GET', url: `/api/charters/${id}`, headers: ana })
  ).json<CharterDetalle>()

describe('PUT /charters/:id/listas/:tipo', () => {
  it('guarda la lista en el orden recibido', async () => {
    const id = await crearCharterPrueba(app, ana)
    const r = await guardar(id, 'objetivo', textos('Uno', ' Dos ', 'Tres'))
    expect(r.statusCode).toBe(200)
    expect(r.json<ItemLista[]>().map((i) => i.texto)).toEqual(['Uno', 'Dos', 'Tres'])
    expect((await detalle(id)).listas.objetivo.map((i) => i.texto)).toEqual(['Uno', 'Dos', 'Tres'])
  })

  it('reemplaza la lista sin tocar las otras', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 'objetivo', textos('Uno', 'Dos', 'Tres'))
    await guardar(id, 'supuesto', textos('Hay presupuesto'))
    await guardar(id, 'objetivo', textos('Dos', 'Uno'))
    const { listas } = await detalle(id)
    expect(listas.objetivo.map((i) => i.texto)).toEqual(['Dos', 'Uno'])
    expect(listas.supuesto.map((i) => i.texto)).toEqual(['Hay presupuesto'])
    expect(listas.criterio_exito).toEqual([])
  })

  it('una lista vacía la deja vacía', async () => {
    const id = await crearCharterPrueba(app, ana)
    await guardar(id, 'criterio_exito', textos('Uno'))
    expect((await guardar(id, 'criterio_exito', { items: [] })).statusCode).toBe(200)
    expect((await detalle(id)).listas.criterio_exito).toEqual([])
  })

  it('rechaza un tipo desconocido, más de 50 ítems y textos vacíos', async () => {
    const id = await crearCharterPrueba(app, ana)
    expect((await guardar(id, 'riesgo', textos('X'))).statusCode).toBe(400)
    const muchos = textos(...Array.from({ length: 51 }, (_, i) => `Ítem ${i}`))
    expect((await guardar(id, 'objetivo', muchos)).statusCode).toBe(400)
    const vacio = await guardar(id, 'objetivo', textos('Uno', ' '))
    expect(vacio.statusCode).toBe(400)
    expect(vacio.json().error.campos.items).toBeTruthy()
  })

  it('respeta el aislamiento y el estado cerrado', async () => {
    const id = await crearCharterPrueba(app, ana)
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
    expect((await guardar(id, 'objetivo', textos('X'), beto)).statusCode).toBe(404)
    expect((await guardar(id, 'objetivo', textos('X'), admin)).statusCode).toBe(403)

    await app.inject({
      method: 'PATCH',
      url: `/api/charters/${id}`,
      headers: ana,
      payload: { estado: 'cerrado' },
    })
    const cerrado = await guardar(id, 'objetivo', textos('X'))
    expect(cerrado.statusCode).toBe(409)
    expect(cerrado.json().error.codigo).toBe('charter_cerrado')
  })

  it('sube el charter al primer lugar del portafolio', async () => {
    const a = await crearCharterPrueba(app, ana, { nombre: 'A' })
    await pausa()
    await crearCharterPrueba(app, ana, { nombre: 'B' })
    await pausa()
    await guardar(a, 'objetivo', textos('Uno'))
    const lista = (await app.inject({ method: 'GET', url: '/api/charters', headers: ana })).json<
      CharterResumen[]
    >()
    expect(lista.map((c) => c.nombre)).toEqual(['A', 'B'])
  })
})
