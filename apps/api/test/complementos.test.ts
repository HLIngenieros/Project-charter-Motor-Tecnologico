import type { CharterDetalle, Indicador, Riesgo, Rubro } from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { v7 } from 'uuid'
import { beforeEach, describe, expect, it } from 'vitest'
import { medicion } from '../src/db/esquema'
import { crearCharterPrueba, nuevaApp, sesionDe } from './ayudas'

let app: FastifyInstance
let ana: Record<string, string>

beforeEach(async () => {
  app = (await nuevaApp()).app
  ana = await sesionDe(app, 'ana@hlingenieros.com')
})

const indicador = (nombre: string, id = v7()): Indicador => ({
  id,
  nombre,
  formula: 'Días entre cierre y radicación',
  metaOperador: '<=',
  metaValor: 5,
  metaUnidad: 'días',
  observaciones: '',
})

const riesgo = (texto: string, probabilidad: number | null = 3, impacto: number | null = 4) => ({
  id: v7(),
  riesgo: texto,
  causa: '',
  mitigacion: '',
  probabilidad,
  impacto,
})

const rubro = (descripcion: string, valor = 1000, lineas: Rubro['lineas'] = []): Rubro => ({
  id: v7(),
  descripcion,
  valor,
  lineas,
})

const linea = (concepto: string, cantidad: number, valorUnitario: number) => ({
  id: v7(),
  concepto,
  cantidad,
  valorUnitario,
})

const put = (id: string, ruta: string, payload: object, h = ana) =>
  app.inject({ method: 'PUT', url: `/api/charters/${id}/${ruta}`, headers: h, payload })

const detalle = async (id: string) =>
  (
    await app.inject({ method: 'GET', url: `/api/charters/${id}`, headers: ana })
  ).json<CharterDetalle>()

describe('complementos del charter', () => {
  it('un charter nuevo los trae vacíos', async () => {
    const id = await crearCharterPrueba(app, ana)
    const d = await detalle(id)
    expect(d.indicadores).toEqual([])
    expect(d.riesgos).toEqual([])
    expect(d.rubros).toEqual([])
  })

  it('guarda y devuelve en orden', async () => {
    const id = await crearCharterPrueba(app, ana)
    const inds = [indicador('Días de radicación'), { ...indicador('Pendientes'), metaValor: null }]
    const r1 = await put(id, 'indicadores', { items: inds })
    expect(r1.statusCode).toBe(200)
    expect(r1.json<Indicador[]>()).toEqual(inds)

    const rs = [riesgo('Sin orden de compra'), riesgo('', 2, null)]
    const r2 = await put(id, 'riesgos', { items: rs })
    expect(r2.statusCode).toBe(200)
    expect(r2.json<Riesgo[]>()).toEqual(rs)

    const rubros = [rubro('Licencias', 5000), rubro('Consultoría', 0, [linea('Horas', 10, 150)])]
    const r3 = await put(id, 'presupuesto', { rubros })
    expect(r3.statusCode).toBe(200)
    expect(r3.json<Rubro[]>().map((r) => r.valor)).toEqual([5000, 1500])

    const d = await detalle(id)
    expect(d.indicadores).toEqual(inds)
    expect(d.riesgos).toEqual(rs)
    expect(d.rubros).toEqual([rubros[0], { ...rubros[1], valor: 1500 }])
  })

  it('conserva ids y borra los que faltan', async () => {
    const id = await crearCharterPrueba(app, ana)
    const a = riesgo('A')
    const b = riesgo('B')
    await put(id, 'riesgos', { items: [a, b] })
    const b2 = { ...b, riesgo: 'B editado', probabilidad: 5 }
    await put(id, 'riesgos', { items: [b2] })
    expect((await detalle(id)).riesgos).toEqual([b2])

    const r = rubro('R', 0, [linea('x', 1, 10), linea('y', 1, 20)])
    await put(id, 'presupuesto', { rubros: [r] })
    const r2 = { ...r, lineas: [{ ...r.lineas[1]!, cantidad: 2 }] }
    await put(id, 'presupuesto', { rubros: [r2] })
    expect((await detalle(id)).rubros).toEqual([{ ...r2, valor: 40 }])
  })

  it('reordena', async () => {
    const id = await crearCharterPrueba(app, ana)
    const a = indicador('A')
    const b = indicador('B')
    await put(id, 'indicadores', { items: [a, b] })
    await put(id, 'indicadores', { items: [b, a] })
    expect((await detalle(id)).indicadores.map((i) => i.nombre)).toEqual(['B', 'A'])
  })

  it('editar un indicador conserva sus mediciones', async () => {
    const id = await crearCharterPrueba(app, ana)
    const ind = indicador('Días')
    await put(id, 'indicadores', { items: [ind] })
    await app.db
      .insert(medicion)
      .values({ id: v7(), indicadorId: ind.id, periodo: '2026-11', valor: 7 })
    await put(id, 'indicadores', { items: [{ ...ind, nombre: 'Días hábiles' }] })
    const filas = await app.db.select().from(medicion).where(eq(medicion.indicadorId, ind.id))
    expect(filas).toHaveLength(1)
  })

  it('el valor de un rubro con líneas es el calculado', async () => {
    const id = await crearCharterPrueba(app, ana)
    const r = rubro('Software', 1, [linea('Licencia', 2.5, 3333)])
    const res = await put(id, 'presupuesto', { rubros: [r] })
    expect(res.json<Rubro[]>()[0]!.valor).toBe(8333)
    expect((await detalle(id)).rubros[0]!.valor).toBe(8333)
  })

  it('rechaza ids de otro charter y repetidos', async () => {
    const id = await crearCharterPrueba(app, ana)
    const otro = await crearCharterPrueba(app, ana, { nombre: 'Otro' })
    const a = riesgo('A')
    await put(otro, 'riesgos', { items: [a] })
    const ajeno = await put(id, 'riesgos', { items: [a] })
    expect(ajeno.statusCode).toBe(400)
    expect(ajeno.json().error.codigo).toBe('id_ajeno')
    // El otro charter no cambia.
    expect((await detalle(otro)).riesgos).toEqual([a])

    const r = rubro('R', 0, [linea('x', 1, 10)])
    await put(otro, 'presupuesto', { rubros: [r] })
    const lineaAjena = await put(id, 'presupuesto', {
      rubros: [{ ...rubro('Mío'), lineas: r.lineas }],
    })
    expect(lineaAjena.statusCode).toBe(400)
    expect(lineaAjena.json().error.codigo).toBe('id_ajeno')

    const b = indicador('B')
    const dup = await put(id, 'indicadores', { items: [b, { ...b, nombre: 'C' }] })
    expect(dup.statusCode).toBe(400)
    expect(dup.json().error.codigo).toBe('id_duplicado')

    const l = linea('x', 1, 1)
    const dupLinea = await put(id, 'presupuesto', {
      rubros: [rubro('A', 0, [l]), rubro('B', 0, [l])],
    })
    expect(dupLinea.statusCode).toBe(400)
    expect(dupLinea.json().error.codigo).toBe('id_duplicado')
  })

  it('más de 50 → 400', async () => {
    const id = await crearCharterPrueba(app, ana)
    const muchos = Array.from({ length: 51 }, (_, i) => riesgo(`R${i}`))
    expect((await put(id, 'riesgos', { items: muchos })).statusCode).toBe(400)
  })

  it('respeta el aislamiento y el estado cerrado', async () => {
    const id = await crearCharterPrueba(app, ana)
    const beto = await sesionDe(app, 'beto@hlingenieros.com')
    const admin = await sesionDe(app, 'admin@hlingenieros.com', { admin: true })
    const cuerpo = { items: [indicador('X')] }
    expect((await put(id, 'indicadores', cuerpo, beto)).statusCode).toBe(404)
    expect((await put(id, 'indicadores', cuerpo, admin)).statusCode).toBe(403)
    expect((await put(id, 'presupuesto', { rubros: [] }, admin)).statusCode).toBe(403)

    await app.inject({
      method: 'PATCH',
      url: `/api/charters/${id}`,
      headers: ana,
      payload: { estado: 'cerrado' },
    })
    const cerrado = await put(id, 'riesgos', { items: [] })
    expect(cerrado.statusCode).toBe(409)
    expect(cerrado.json().error.codigo).toBe('charter_cerrado')
  })
})
