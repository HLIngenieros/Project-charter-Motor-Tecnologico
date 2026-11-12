import {
  PALETA_CATEGORIAS,
  type CatalogoAdmin,
  type CategoriaAdmin,
  type CategoriaPublica,
} from '@charter/shared'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { categoria } from '../src/db/esquema'
import { ID_DEFAULT, sembrar } from '../src/db/semilla'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>
let admin: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
  admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
})

type Tipo = 'categorias' | 'areas'
const base = (tipo: Tipo) => `/api/admin/catalogos/${tipo}`
const listar = async (tipo: Tipo, h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'GET', url: base(tipo), headers: h })
const crear = async (tipo: Tipo, cuerpo: object, h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'POST', url: base(tipo), headers: h, payload: cuerpo })
const editar = async (
  tipo: Tipo,
  id: string,
  cuerpo: object,
  h = admin,
): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'PATCH', url: `${base(tipo)}/${id}`, headers: h, payload: cuerpo })
const eliminar = async (tipo: Tipo, id: string, h = admin): Promise<LightMyRequestResponse> =>
  app.inject({ method: 'DELETE', url: `${base(tipo)}/${id}`, headers: h })
const publicas = async () =>
  (await app.inject({ method: 'GET', url: '/api/categorias', headers: ana })).json<
    CategoriaPublica[]
  >()

const [NEUTRO, , , , VERDE] = PALETA_CATEGORIAS as { color: string; colorFondo: string }[]

describe('semilla', () => {
  it('trae «Default» primero y luego las 3 del Comité; sembrar dos veces no duplica', async () => {
    const cats = await publicas()
    expect(cats.map((c) => c.nombre)).toEqual([
      'Default',
      'Automatización',
      'Análisis de Data',
      'Gestión del Conocimiento',
    ])
    expect(cats[0]).toMatchObject({ id: ID_DEFAULT, color: NEUTRO!.color, activa: true })
    await sembrar(app.db)
    expect(await app.db.select().from(categoria)).toHaveLength(4)
  })

  it('solo el Admin administra los catálogos', async () => {
    expect((await listar('areas', ana)).statusCode).toBe(403)
    expect((await crear('areas', { nombre: 'X' }, ana)).json().error.codigo).toBe('solo_admin')
  })
})

describe('categorías', () => {
  it('crea con un color de la paleta y devuelve el par', async () => {
    const r = await crear('categorias', { nombre: 'Innovación', color: VERDE!.color })
    expect(r.statusCode).toBe(201)
    expect(r.json<CategoriaAdmin>()).toMatchObject({
      nombre: 'Innovación',
      color: VERDE!.color,
      colorFondo: VERDE!.colorFondo,
      activa: true,
      protegida: false,
      charters: 0,
      orden: 4,
    })
    expect((await publicas()).map((c) => c.nombre)).toContain('Innovación')
  })

  it('rechaza un color fuera de la paleta', async () => {
    const r = await crear('categorias', { nombre: 'X', color: '#123456' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.campos.color).toBeTruthy()
  })

  it('rechaza un nombre repetido sin distinguir tildes ni mayúsculas, también al renombrar', async () => {
    for (const nombre of ['automatizacion', 'AUTOMATIZACIÓN', ' Automatización ']) {
      const r = await crear('categorias', { nombre, color: VERDE!.color })
      expect(r.statusCode).toBe(409)
      expect(r.json().error.codigo).toBe('nombre_repetido')
    }
    const lista = (await listar('categorias')).json<CategoriaAdmin[]>()
    const data = lista.find((c) => c.nombre === 'Análisis de Data')!
    expect(
      (await editar('categorias', data.id, { nombre: 'gestion del conocimiento' })).statusCode,
    ).toBe(409)
    // Renombrarse a sí misma con otra capitalización sí se permite.
    const ok = await editar('categorias', data.id, { nombre: 'Análisis de data' })
    expect(ok.statusCode).toBe(200)
    expect(ok.json<CategoriaAdmin>().nombre).toBe('Análisis de data')
  })

  it('el listado del Admin incluye inactivas con su conteo de charters', async () => {
    const lista = (await listar('categorias')).json<CategoriaAdmin[]>()
    const auto = lista.find((c) => c.nombre === 'Automatización')!
    await crearCharterPrueba(app, ana, { nombre: 'A', categoriaId: auto.id })
    expect((await editar('categorias', auto.id, { activa: false })).statusCode).toBe(200)
    const despues = (await listar('categorias')).json<CategoriaAdmin[]>()
    expect(despues.find((c) => c.id === auto.id)).toMatchObject({ activa: false, charters: 1 })
    // Desactivada, no sirve para crear un charter.
    const r = await app.inject({
      method: 'POST',
      url: '/api/charters',
      headers: ana,
      payload: { nombre: 'B', categoriaId: auto.id },
    })
    expect(r.statusCode).toBe(400)
  })

  it('elimina solo si nadie la usa', async () => {
    const lista = (await listar('categorias')).json<CategoriaAdmin[]>()
    const auto = lista.find((c) => c.nombre === 'Automatización')!
    await crearCharterPrueba(app, ana, { nombre: 'A', categoriaId: auto.id })
    const r = await eliminar('categorias', auto.id)
    expect(r.statusCode).toBe(409)
    expect(r.json().error.codigo).toBe('en_uso')
    const data = lista.find((c) => c.nombre === 'Análisis de Data')!
    expect((await eliminar('categorias', data.id)).statusCode).toBe(204)
    expect((await publicas()).map((c) => c.nombre)).not.toContain('Análisis de Data')
    expect((await eliminar('categorias', data.id)).statusCode).toBe(404)
  })

  it('Default no se desactiva ni se elimina, pero sí se renombra y cambia de color', async () => {
    const off = await editar('categorias', ID_DEFAULT, { activa: false })
    expect(off.statusCode).toBe(409)
    expect(off.json().error.codigo).toBe('protegida')
    expect((await eliminar('categorias', ID_DEFAULT)).json().error.codigo).toBe('protegida')
    const ok = await editar('categorias', ID_DEFAULT, { nombre: 'General', color: VERDE!.color })
    expect(ok.statusCode).toBe(200)
    expect(ok.json<CategoriaAdmin>()).toMatchObject({
      nombre: 'General',
      colorFondo: VERDE!.colorFondo,
      protegida: true,
    })
  })

  it('cambia el orden', async () => {
    const lista = (await listar('categorias')).json<CategoriaAdmin[]>()
    const [, auto, data] = lista
    await editar('categorias', auto!.id, { orden: data!.orden })
    await editar('categorias', data!.id, { orden: auto!.orden })
    const nombres = (await publicas()).map((c) => c.nombre)
    expect(nombres.slice(0, 3)).toEqual(['Default', 'Análisis de Data', 'Automatización'])
    expect((await editar('categorias', auto!.id, {})).statusCode).toBe(400)
  })
})

describe('áreas', () => {
  it('crea, renombra, lista inactivas y elimina', async () => {
    const r = await crear('areas', { nombre: '  Financiera ' })
    expect(r.statusCode).toBe(201)
    const fin = r.json<CatalogoAdmin>()
    expect(fin).toMatchObject({ nombre: 'Financiera', activa: true, orden: 0, charters: 0 })
    expect((await crear('areas', { nombre: 'financiera' })).statusCode).toBe(409)

    const ok = await editar('areas', fin.id, { nombre: 'Finanzas', activa: false })
    expect(ok.json<CatalogoAdmin>()).toMatchObject({ nombre: 'Finanzas', activa: false })
    expect((await listar('areas')).json<CatalogoAdmin[]>()).toHaveLength(1)

    const op = (await crear('areas', { nombre: 'Operaciones' })).json<CatalogoAdmin>()
    expect(op.orden).toBe(1)
    await crearCharterPrueba(app, ana, { nombre: 'A', areaId: op.id })
    expect((await eliminar('areas', op.id)).json().error.codigo).toBe('en_uso')
    expect(
      (await listar('areas')).json<CatalogoAdmin[]>().find((a) => a.id === op.id)?.charters,
    ).toBe(1)
    expect((await eliminar('areas', fin.id)).statusCode).toBe(204)
    expect((await editar('areas', fin.id, { nombre: 'x' })).statusCode).toBe(404)
    expect((await editar('areas', op.id, { color: VERDE!.color })).statusCode).toBe(400)
  })
})
