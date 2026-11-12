import { columnasDeReglas, leerReglasVigentes, reglasDeCharter } from '../admin/parametros'
import {
  TIPOS_LISTA,
  type AreaPublica,
  type CategoriaPublica,
  type CharterCrear,
  type CharterDetalle,
  type CharterEditar,
  type CharterResumen,
  type ItemLista,
  type TipoLista,
} from '@charter/shared'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { v7 } from 'uuid'
import type { UsuarioSesion } from '../../auth/sesiones'
import type { BaseDatos } from '../../db/conexion'
import {
  area,
  categoria,
  charter,
  corte,
  itemLista,
  usuario,
  type FilaCharter,
} from '../../db/esquema'
import { ErrorApi } from '../../errores'
import { listarCortes } from '../cortes/servicio'
import { leerComplementos } from './complementos'

const ESTADOS_CERRADOS = new Set<FilaCharter['estado']>(['cerrado', 'cancelado'])

const aCategoria = (c: typeof categoria.$inferSelect): CategoriaPublica => ({
  id: c.id,
  nombre: c.nombre,
  color: c.color,
  colorFondo: c.colorFondo,
  activa: c.activa,
  protegida: c.protegida,
})

const aArea = (a: typeof area.$inferSelect): AreaPublica => ({
  id: a.id,
  nombre: a.nombre,
  activa: a.activa,
})

export async function listarCategorias(db: BaseDatos): Promise<CategoriaPublica[]> {
  const filas = await db
    .select()
    .from(categoria)
    .orderBy(asc(categoria.orden), asc(categoria.nombre))
  return filas.map(aCategoria)
}

export async function listarAreas(db: BaseDatos): Promise<AreaPublica[]> {
  const filas = await db.select().from(area).orderBy(asc(area.orden), asc(area.nombre))
  return filas.map(aArea)
}

/**
 * Una categoría o un área nueva debe existir y estar activa. Si el charter ya la tenía,
 * se acepta aunque se haya desactivado después.
 */
export async function validarCatalogos(
  db: BaseDatos,
  datos: { categoriaId?: string | null; areaId?: string | null },
  actual?: FilaCharter,
): Promise<void> {
  const campos: Record<string, string> = {}
  if (datos.categoriaId && datos.categoriaId !== actual?.categoriaId) {
    const [fila] = await db
      .select()
      .from(categoria)
      .where(eq(categoria.id, datos.categoriaId))
      .limit(1)
    if (!fila?.activa) campos.categoriaId = 'Elige una categoría válida'
  }
  if (datos.areaId && datos.areaId !== actual?.areaId) {
    const [fila] = await db.select().from(area).where(eq(area.id, datos.areaId)).limit(1)
    if (!fila?.activa) campos.areaId = 'Elige un área válida'
  }
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi(400, 'datos_invalidos', 'Revisa los datos del formulario', campos)
  }
}

/** Resumen de los charters de `propietarioId`, o de todos si no viene (vista del Admin). */
export async function listarCharters(
  db: BaseDatos,
  { propietarioId }: { propietarioId?: string } = {},
): Promise<CharterResumen[]> {
  const filas = await db
    .select({
      charter,
      categoria,
      area,
      propietario: { id: usuario.id, nombre: usuario.nombre },
    })
    .from(charter)
    .innerJoin(usuario, eq(charter.propietarioId, usuario.id))
    .leftJoin(categoria, eq(charter.categoriaId, categoria.id))
    .leftJoin(area, eq(charter.areaId, area.id))
    .where(propietarioId ? eq(charter.propietarioId, propietarioId) : undefined)
    .orderBy(desc(charter.actualizadoEn), desc(charter.id))
  if (filas.length === 0) return []

  // Planeado y real guardados; estado y vencidas salen de la foto de cada corte.
  const series = new Map<string, CharterResumen['cortes']>()
  const cortes = await db
    .select({
      charterId: corte.charterId,
      fecha: corte.fecha,
      pv: corte.pvProyecto,
      ev: corte.evProyecto,
    })
    .from(corte)
    .where(
      inArray(
        corte.charterId,
        filas.map((f) => f.charter.id),
      ),
    )
    .orderBy(asc(corte.fecha))
  for (const c of cortes) {
    const serie = series.get(c.charterId) ?? []
    serie.push({ fecha: c.fecha, pv: c.pv, ev: c.ev })
    series.set(c.charterId, serie)
  }
  const ultimoDe = async (c: FilaCharter): Promise<CharterResumen['ultimoCorte']> => {
    const ultimo = series.get(c.id)?.at(-1)
    if (!ultimo) return null
    const r = (await listarCortes(db, c)).find((k) => k.fecha === ultimo.fecha)
    return { ...ultimo, estado: r?.estado ?? 'sin_programar', vencidas: r?.vencidas ?? 0 }
  }

  return Promise.all(
    filas.map(async ({ charter: c, categoria: cat, area: ar, propietario }) => ({
      id: c.id,
      nombre: c.nombre,
      codigo: c.codigo,
      responsable: c.responsable,
      estado: c.estado,
      categoria: cat ? aCategoria(cat) : null,
      area: ar ? aArea(ar) : null,
      propietario,
      actualizadoEn: c.actualizadoEn,
      ultimoCorte: await ultimoDe(c),
      cortes: series.get(c.id) ?? [],
    })),
  )
}

export async function crearCharter(
  db: BaseDatos,
  usuarioId: string,
  datos: CharterCrear,
): Promise<string> {
  await validarCatalogos(db, datos)
  const id = v7()
  await db.insert(charter).values({
    id,
    propietarioId: usuarioId,
    nombre: datos.nombre,
    categoriaId: datos.categoriaId ?? null,
    areaId: datos.areaId ?? null,
    razonDeSer: datos.razonDeSer ?? '',
    // El charter nace con las reglas vigentes y las conserva aunque el Admin las cambie.
    ...columnasDeReglas(await leerReglasVigentes(db)),
  })
  return id
}

export async function detalleCharter(
  db: BaseDatos,
  fila: FilaCharter,
  yo: UsuarioSesion,
): Promise<CharterDetalle> {
  const [propietario] = await db
    .select({ id: usuario.id, nombre: usuario.nombre })
    .from(usuario)
    .where(eq(usuario.id, fila.propietarioId))
    .limit(1)

  const listas = Object.fromEntries(TIPOS_LISTA.map((t) => [t, [] as ItemLista[]])) as Record<
    TipoLista,
    ItemLista[]
  >
  const items = await db
    .select()
    .from(itemLista)
    .where(eq(itemLista.charterId, fila.id))
    .orderBy(asc(itemLista.orden))
  for (const i of items) listas[i.tipo].push({ id: i.id, texto: i.texto })

  const esDueno = fila.propietarioId === yo.id
  const cerrado = ESTADOS_CERRADOS.has(fila.estado)
  return {
    id: fila.id,
    nombre: fila.nombre,
    codigo: fila.codigo,
    categoriaId: fila.categoriaId,
    areaId: fila.areaId,
    responsable: fila.responsable,
    patrocinador: fila.patrocinador,
    revision: fila.revision,
    razonDeSer: fila.razonDeSer,
    objetivoGeneral: fila.objetivoGeneral,
    estado: fila.estado,
    creadoEn: fila.creadoEn,
    actualizadoEn: fila.actualizadoEn,
    propietario: propietario!,
    listas,
    permisos: { editar: esDueno && !cerrado, reabrir: esDueno && cerrado },
    reglas: reglasDeCharter(fila),
    ...(await leerComplementos(db, fila.id)),
  }
}

/** Aplica los cambios y devuelve la fila actualizada. */
export async function editarCharter(
  db: BaseDatos,
  fila: FilaCharter,
  datos: CharterEditar,
): Promise<FilaCharter> {
  await validarCatalogos(db, datos, fila)
  const [editada] = await db.update(charter).set(datos).where(eq(charter.id, fila.id)).returning()
  return editada!
}

export async function eliminarCharter(db: BaseDatos, id: string): Promise<void> {
  await db.delete(charter).where(eq(charter.id, id))
}

/** Reemplaza la lista completa de un tipo, en el orden recibido, en una transacción. */
export async function reemplazarLista(
  db: BaseDatos,
  charterId: string,
  tipo: TipoLista,
  items: { texto: string }[],
): Promise<ItemLista[]> {
  const nuevos = items.map((i, orden) => ({ id: v7(), charterId, tipo, texto: i.texto, orden }))
  await db.transaction(async (tx) => {
    await tx
      .delete(itemLista)
      .where(and(eq(itemLista.charterId, charterId), eq(itemLista.tipo, tipo)))
    if (nuevos.length > 0) await tx.insert(itemLista).values(nuevos)
    // Cambiar una lista también cuenta como editar el charter (orden del portafolio).
    await tx
      .update(charter)
      .set({ actualizadoEn: new Date().toISOString() })
      .where(eq(charter.id, charterId))
  })
  return nuevos.map(({ id, texto }) => ({ id, texto }))
}
