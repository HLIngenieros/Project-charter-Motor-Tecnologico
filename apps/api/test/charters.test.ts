import type { CharterDetalle, CharterResumen } from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { v7 } from 'uuid'
import { beforeEach, describe, expect, it } from 'vitest'
import { categoria, corte, itemLista } from '../src/db/esquema'
import { crearCharterPrueba, nuevaApp, pausa, sesionDe, type Contexto } from './ayudas'

const AUTOMATIZACION = '019a6a00-0000-7000-8000-000000000001'
const DATA = '019a6a00-0000-7000-8000-000000000002'
const CONOCIMIENTO = '019a6a00-0000-7000-8000-000000000003'

let ctx: Contexto
let app: FastifyInstance
let ana: Record<string, string>
let beto: Record<string, string>
let admin: Record<string, string>

beforeEach(async () => {
  ctx = await nuevaApp()
  app = ctx.app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
  beto = await sesionDe(app, 'beto@hlingenieros.com')
  admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
})

const pedir = (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  headers: Record<string, string>,
  payload?: unknown,
) =>
  app.inject({
    method,
    url,
    headers,
    ...(payload === undefined ? {} : { payload: payload as object }),
  })

const detalle = async (id: string, h = ana) =>
  (await pedir('GET', `/api/charters/${id}`, h)).json<CharterDetalle>()
const desactivarCategoria = async (id: string) => {
  await ctx.db.update(categoria).set({ activa: false }).where(eq(categoria.id, id))
}

describe('catálogos', () => {
  it('exigen sesión', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/categorias' })).statusCode).toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/areas' })).statusCode).toBe(401)
  })

  it('listan las categorías sembradas y las áreas', async () => {
    const r = await pedir('GET', '/api/categorias', ana)
    expect(r.statusCode).toBe(200)
    const lista = r.json<{ nombre: string; activa: boolean }[]>()
    expect(lista.map((c) => c.nombre)).toEqual([
      'Automatización',
      'Análisis de Data',
      'Gestión del Conocimiento',
    ])
    expect(lista.every((c) => c.activa)).toBe(true)
    expect((await pedir('GET', '/api/areas', ana)).json()).toEqual([])
  })
})

describe('crear charter', () => {
  it('crea el charter del usuario con listas vacías', async () => {
    const r = await pedir('POST', '/api/charters', ana, {
      nombre: '  Plan TI  ',
      categoriaId: AUTOMATIZACION,
      razonDeSer: 'Dejar el Excel',
    })
    expect(r.statusCode).toBe(201)
    const d = await detalle(r.json<{ id: string }>().id)
    expect(d).toMatchObject({
      nombre: 'Plan TI',
      categoriaId: AUTOMATIZACION,
      razonDeSer: 'Dejar el Excel',
      estado: 'activo',
      codigo: null,
      propietario: { nombre: 'ana Prueba' },
      listas: { objetivo: [], supuesto: [], criterio_exito: [] },
      permisos: { editar: true, reabrir: false },
    })
  })

  it('rechaza un nombre vacío', async () => {
    const r = await pedir('POST', '/api/charters', ana, { nombre: ' ' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.campos.nombre).toBe('Escribe el nombre del charter')
  })

  it('rechaza una categoría inexistente o inactiva', async () => {
    const inexistente = await pedir('POST', '/api/charters', ana, {
      nombre: 'X',
      categoriaId: v7(),
    })
    expect(inexistente.statusCode).toBe(400)
    expect(inexistente.json().error.campos.categoriaId).toBe('Elige una categoría válida')

    await desactivarCategoria(DATA)
    const inactiva = await pedir('POST', '/api/charters', ana, { nombre: 'X', categoriaId: DATA })
    expect(inactiva.statusCode).toBe(400)
  })

  it('rechaza un área inexistente', async () => {
    const r = await pedir('POST', '/api/charters', ana, { nombre: 'X', areaId: v7() })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.campos.areaId).toBe('Elige un área válida')
  })

  it('exige la cabecera anti-CSRF', async () => {
    const sinCsrf = { cookie: ana.cookie! }
    const r = await pedir('POST', '/api/charters', sinCsrf, { nombre: 'X' })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.codigo).toBe('csrf')
  })
})

describe('listar charters', () => {
  it('cada usuario ve solo los suyos, también el Admin', async () => {
    await crearCharterPrueba(app, ana, { nombre: 'A1' })
    await crearCharterPrueba(app, ana, { nombre: 'A2' })
    await crearCharterPrueba(app, beto, { nombre: 'B1' })
    await crearCharterPrueba(app, admin, { nombre: 'Del admin' })

    const nombres = async (h: Record<string, string>) =>
      (await pedir('GET', '/api/charters', h))
        .json<CharterResumen[]>()
        .map((c) => c.nombre)
        .sort()
    expect(await nombres(ana)).toEqual(['A1', 'A2'])
    expect(await nombres(beto)).toEqual(['B1'])
    expect(await nombres(admin)).toEqual(['Del admin'])
  })

  it('pone primero el editado más reciente y trae la categoría', async () => {
    const a = await crearCharterPrueba(app, ana, { nombre: 'A', categoriaId: CONOCIMIENTO })
    await pausa()
    await crearCharterPrueba(app, ana, { nombre: 'B' })
    await pausa()
    await pedir('PATCH', `/api/charters/${a}`, ana, { responsable: 'Líder TI' })

    const lista = (await pedir('GET', '/api/charters', ana)).json<CharterResumen[]>()
    expect(lista.map((c) => c.nombre)).toEqual(['A', 'B'])
    expect(lista[0]).toMatchObject({
      responsable: 'Líder TI',
      categoria: { id: CONOCIMIENTO, nombre: 'Gestión del Conocimiento', color: '#0A9C9B' },
      area: null,
      ultimoCorte: null,
    })
  })

  it('trae el último corte por fecha', async () => {
    const id = await crearCharterPrueba(app, ana)
    await ctx.db.insert(corte).values([
      { id: v7(), charterId: id, fecha: '2026-11-01', pvProyecto: 0.4, evProyecto: 0.3 },
      { id: v7(), charterId: id, fecha: '2026-10-01', pvProyecto: 0.2, evProyecto: 0.2 },
    ])
    const [c] = (await pedir('GET', '/api/charters', ana)).json<CharterResumen[]>()
    expect(c!.ultimoCorte).toMatchObject({ fecha: '2026-11-01', pv: 0.4, ev: 0.3, vencidas: 0 })
    expect(c!.cortes).toEqual([
      { fecha: '2026-10-01', pv: 0.2, ev: 0.2 },
      { fecha: '2026-11-01', pv: 0.4, ev: 0.3 },
    ])
  })

  it('sin cortes trae la serie vacía', async () => {
    await crearCharterPrueba(app, ana)
    const [c] = (await pedir('GET', '/api/charters', ana)).json<CharterResumen[]>()
    expect(c!.ultimoCorte).toBeNull()
    expect(c!.cortes).toEqual([])
  })

  it('el detalle trae las reglas del charter, con sus umbrales', async () => {
    const id = await crearCharterPrueba(app, ana)
    const d = (await pedir('GET', `/api/charters/${id}`, ana)).json<CharterDetalle>()
    expect(d.reglas.umbrales).toEqual({ atencion: 10, riesgo: 25, atraso: 50 })
  })
})

describe('editar charter', () => {
  it('guarda solo los campos enviados', async () => {
    const id = await crearCharterPrueba(app, ana)
    const r = await pedir('PATCH', `/api/charters/${id}`, ana, {
      responsable: 'Líder TI',
      codigo: '',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json<CharterDetalle>()).toMatchObject({
      nombre: 'Plan de prueba',
      responsable: 'Líder TI',
      codigo: null,
    })
  })

  it('rechaza un cuerpo vacío', async () => {
    const id = await crearCharterPrueba(app, ana)
    expect((await pedir('PATCH', `/api/charters/${id}`, ana, {})).statusCode).toBe(400)
  })

  it('un charter ajeno responde 404 y el Admin solo lee', async () => {
    const id = await crearCharterPrueba(app, ana)
    expect((await pedir('PATCH', `/api/charters/${id}`, beto, { nombre: 'X' })).statusCode).toBe(
      404,
    )
    expect((await pedir('GET', `/api/charters/${id}`, beto)).statusCode).toBe(404)

    const escribir = await pedir('PATCH', `/api/charters/${id}`, admin, { nombre: 'X' })
    expect(escribir.statusCode).toBe(403)
    expect(escribir.json().error.codigo).toBe('solo_lectura')
    const leido = await detalle(id, admin)
    expect(leido.permisos).toEqual({ editar: false, reabrir: false })
  })

  it('conserva una categoría que se desactivó pero no deja cambiar a otra inactiva', async () => {
    const id = await crearCharterPrueba(app, ana, { nombre: 'X', categoriaId: AUTOMATIZACION })
    await desactivarCategoria(AUTOMATIZACION)
    await desactivarCategoria(DATA)
    expect(
      (await pedir('PATCH', `/api/charters/${id}`, ana, { patrocinador: 'Gerencia' })).statusCode,
    ).toBe(200)
    expect(
      (await pedir('PATCH', `/api/charters/${id}`, ana, { categoriaId: AUTOMATIZACION }))
        .statusCode,
    ).toBe(200)
    const r = await pedir('PATCH', `/api/charters/${id}`, ana, { categoriaId: DATA })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.campos.categoriaId).toBe('Elige una categoría válida')
  })

  it('cerrar deja el charter en solo lectura hasta reabrirlo', async () => {
    const id = await crearCharterPrueba(app, ana)
    const cerrar = await pedir('PATCH', `/api/charters/${id}`, ana, { estado: 'cerrado' })
    expect(cerrar.statusCode).toBe(200)
    expect(cerrar.json<CharterDetalle>().permisos).toEqual({ editar: false, reabrir: true })

    const editar = await pedir('PATCH', `/api/charters/${id}`, ana, { nombre: 'X' })
    expect(editar.statusCode).toBe(409)
    expect(editar.json().error.codigo).toBe('charter_cerrado')
    expect(
      (await pedir('PATCH', `/api/charters/${id}`, ana, { estado: 'activo', nombre: 'X' }))
        .statusCode,
    ).toBe(409)

    const reabrir = await pedir('PATCH', `/api/charters/${id}`, ana, { estado: 'activo' })
    expect(reabrir.statusCode).toBe(200)
    expect(reabrir.json<CharterDetalle>().permisos).toEqual({ editar: true, reabrir: false })
  })

  it('el Admin no puede reabrir un charter ajeno', async () => {
    const id = await crearCharterPrueba(app, ana)
    await pedir('PATCH', `/api/charters/${id}`, ana, { estado: 'cancelado' })
    expect(
      (await pedir('PATCH', `/api/charters/${id}`, admin, { estado: 'activo' })).statusCode,
    ).toBe(403)
  })
})

describe('eliminar charter', () => {
  it('el dueño lo elimina con sus listas', async () => {
    const id = await crearCharterPrueba(app, ana)
    await ctx.db
      .insert(itemLista)
      .values({ id: v7(), charterId: id, tipo: 'objetivo', texto: 'Uno' })
    expect((await pedir('DELETE', `/api/charters/${id}`, ana)).statusCode).toBe(204)
    expect((await pedir('GET', `/api/charters/${id}`, ana)).statusCode).toBe(404)
    expect(await ctx.db.select().from(itemLista)).toHaveLength(0)
  })

  it('el dueño también elimina un charter cerrado', async () => {
    const id = await crearCharterPrueba(app, ana)
    await pedir('PATCH', `/api/charters/${id}`, ana, { estado: 'cerrado' })
    expect((await pedir('DELETE', `/api/charters/${id}`, ana)).statusCode).toBe(204)
  })

  it('el Admin recibe 403 y otro usuario 404', async () => {
    const id = await crearCharterPrueba(app, ana)
    expect((await pedir('DELETE', `/api/charters/${id}`, admin)).statusCode).toBe(403)
    expect((await pedir('DELETE', `/api/charters/${id}`, beto)).statusCode).toBe(404)
  })
})
