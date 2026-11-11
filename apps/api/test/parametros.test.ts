import {
  REGLAS_POR_DEFECTO,
  type ActividadEntrada,
  type CharterDetalle,
  type CorteDetalle,
  type CorteResumen,
  type CronogramaRespuesta,
  type ParametrosRespuesta,
  type Reglas,
} from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { charter } from '../src/db/esquema'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>
let admin: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
  admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
})

const URL = '/api/admin/parametros'
const leer = (h = admin) => app.inject({ method: 'GET', url: URL, headers: h })
const guardar = (reglas: Reglas, h = admin) =>
  app.inject({ method: 'PUT', url: URL, headers: h, payload: reglas })
const detalle = async (id: string, h = ana) =>
  (
    await app.inject({ method: 'GET', url: `/api/charters/${id}`, headers: h })
  ).json<CharterDetalle>()

const NUEVAS: Reglas = {
  ...REGLAS_POR_DEFECTO,
  sinPeso: 'repartir',
  umbrales: { atencion: 5, riesgo: 15, atraso: 30 },
}

describe('parámetros globales', () => {
  it('un usuario que no es Admin no los ve ni los cambia', async () => {
    expect((await leer(ana)).statusCode).toBe(403)
    expect((await leer(ana)).json().error.codigo).toBe('solo_admin')
    expect((await guardar(NUEVAS, ana)).statusCode).toBe(403)
  })

  it('sin cambios devuelve las reglas por defecto', async () => {
    const r = await leer()
    expect(r.statusCode).toBe(200)
    expect(r.json<ParametrosRespuesta>()).toEqual({
      reglas: REGLAS_POR_DEFECTO,
      actualizadoPor: null,
      actualizadoEn: null,
    })
  })

  it('guardar deja quién y cuándo; umbrales desordenados dan 400', async () => {
    const r = await guardar(NUEVAS)
    expect(r.statusCode).toBe(200)
    const p = r.json<ParametrosRespuesta>()
    expect(p.reglas).toEqual(NUEVAS)
    expect(p.actualizadoPor?.nombre).toBe('admin Prueba')
    expect(p.actualizadoEn).toBeTruthy()
    expect((await leer()).json<ParametrosRespuesta>().reglas).toEqual(NUEVAS)

    const malo = await guardar({ ...NUEVAS, umbrales: { atencion: 25, riesgo: 10, atraso: 50 } })
    expect(malo.statusCode).toBe(400)
  })

  it('solo los charters creados después usan las reglas nuevas', async () => {
    const antes = await crearCharterPrueba(app, ana)
    await guardar(NUEVAS)
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const despues = await crearCharterPrueba(app, beto)

    expect((await detalle(antes)).reglas).toEqual(REGLAS_POR_DEFECTO)
    expect((await detalle(despues, beto)).reglas).toEqual(NUEVAS)
  })

  it('un charter de antes de la migración conserva sus umbrales', async () => {
    const id = await crearCharterPrueba(app, ana)
    app.db
      .update(charter)
      .set({ umbralAtencion: 8, umbralRiesgo: 20, umbralAtraso: 40 })
      .where(eq(charter.id, id))
      .run()
    expect((await detalle(id)).reglas).toEqual({
      ...REGLAS_POR_DEFECTO,
      umbrales: { atencion: 8, riesgo: 20, atraso: 40 },
    })
  })
})

describe('cortes con las reglas del charter', () => {
  const hoja = (id: string, peso: number | null, orden = 0): ActividadEntrada => ({
    id,
    padreId: null,
    orden,
    nombre: id,
    peso,
    inicio: '2026-01-01',
    fin: '2026-02-28',
  })

  const conReglas = async (reglas: Reglas, actividades: ActividadEntrada[]) => {
    await guardar(reglas)
    const id = await crearCharterPrueba(app, ana)
    const { version } = (
      await app.inject({ method: 'GET', url: `/api/charters/${id}/cronograma`, headers: ana })
    ).json<CronogramaRespuesta>()
    const r = await app.inject({
      method: 'PUT',
      url: `/api/charters/${id}/cronograma`,
      headers: ana,
      payload: { version, actividades },
    })
    expect(r.statusCode).toBe(200)
    return { id, version: r.json<CronogramaRespuesta>().version }
  }
  const corte = (id: string, fecha: string, pct = 0.1, actividadId = 'A') =>
    app.inject({
      method: 'PUT',
      url: `/api/charters/${id}/cortes/${fecha}`,
      headers: ana,
      payload: { nota: '', avances: [{ actividadId, pct }] },
    })

  it('con suma obligatoria no se registra un corte con pesos incompletos', async () => {
    const obligatoria = { ...REGLAS_POR_DEFECTO, sumaPesos: 'obligatoria' as const }
    const { id } = await conReglas(obligatoria, [hoja('A', 0.5), hoja('B', 0.4, 1)])
    const r = await corte(id, '2026-01-15')
    expect(r.statusCode).toBe(409)
    expect(r.json().error).toEqual({
      codigo: 'pesos_incompletos',
      mensaje: 'Los pesos de las actividades deben sumar 100 % para registrar un corte.',
    })

    // Los ids de actividad son únicos en toda la base: otro charter, otros ids.
    const completo = await conReglas(obligatoria, [hoja('A2', 0.5), hoja('B2', 0.5, 1)])
    expect((await corte(completo.id, '2026-01-15', 0.1, 'A2')).statusCode).toBe(201)
  })

  it('editar un corte cuya foto suma 100 % pasa aunque el cronograma ya no sume', async () => {
    const obligatoria = { ...REGLAS_POR_DEFECTO, sumaPesos: 'obligatoria' as const }
    const { id, version } = await conReglas(obligatoria, [hoja('A', 0.5), hoja('B', 0.5, 1)])
    expect((await corte(id, '2026-01-15')).statusCode).toBe(201)
    await app.inject({
      method: 'PUT',
      url: `/api/charters/${id}/cronograma`,
      headers: ana,
      payload: { version, actividades: [hoja('A', 0.5), hoja('B', 0.2, 1)] },
    })
    expect((await corte(id, '2026-01-15', 0.2)).statusCode).toBe(200)
  })

  it('con repartir, la foto guarda el peso repartido', async () => {
    const { id } = await conReglas({ ...REGLAS_POR_DEFECTO, sinPeso: 'repartir' }, [
      hoja('A', 0.6),
      hoja('B', null, 1),
    ])
    expect((await corte(id, '2026-01-15')).statusCode).toBe(201)
    const d = (
      await app.inject({
        method: 'GET',
        url: `/api/charters/${id}/cortes/2026-01-15`,
        headers: ana,
      })
    ).json<CorteDetalle>()
    expect(d.avances.find((a) => a.actividadId === 'B')!.peso).toBeCloseTo(0.4, 9)
  })

  it('cambiar las reglas globales no mueve los cortes de un charter existente', async () => {
    const { id } = await conReglas(REGLAS_POR_DEFECTO, [hoja('A', 0.5), hoja('B', 0.5, 1)])
    expect((await corte(id, '2026-01-15', 0.02)).statusCode).toBe(201)
    const lista = async () =>
      (await app.inject({ method: 'GET', url: `/api/charters/${id}/cortes`, headers: ana })).json<
        CorteResumen[]
      >()
    const antes = await lista()
    await guardar({ ...NUEVAS, diasGracia: 10, reparto: 'habiles' })
    expect(await lista()).toEqual(antes)
  })
})
