import {
  crearAreaEntrada,
  crearCategoriaEntrada,
  editarAreaEntrada,
  editarCategoriaEntrada,
  normalizar,
  PALETA_CATEGORIAS,
  type CatalogoAdmin,
  type CategoriaAdmin,
} from '@charter/shared'
import { asc, count, eq, max } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'
import type { BaseDatos } from '../../db/conexion'
import { area, categoria, charter } from '../../db/esquema'
import { ErrorApi } from '../../errores'

type Tabla = typeof categoria | typeof area
type FilaCategoria = typeof categoria.$inferSelect
type FilaArea = typeof area.$inferSelect

const noEncontrada = () => new ErrorApi(404, 'no_encontrado', 'No existe')
const protegida = () =>
  new ErrorApi(409, 'protegida', 'La categoría Default no se puede desactivar ni eliminar.')

const columnaCharter = (tabla: Tabla) =>
  tabla === categoria ? charter.categoriaId : charter.areaId

/** Charters por id de categoría o de área. */
async function usosDe(db: BaseDatos, tabla: Tabla): Promise<Map<string, number>> {
  const col = columnaCharter(tabla)
  const filas = await db.select({ id: col, n: count() }).from(charter).groupBy(col)
  return new Map(filas.flatMap((f) => (f.id ? [[f.id, f.n] as const] : [])))
}

async function usosDeUna(db: BaseDatos, tabla: Tabla, id: string): Promise<number> {
  const [fila] = await db
    .select({ n: count() })
    .from(charter)
    .where(eq(columnaCharter(tabla), id))
  return fila?.n ?? 0
}

/** 409 `nombre_repetido` si otra fila (distinta de `salvoId`) tiene el mismo nombre normalizado. */
async function exigirNombreLibre(
  db: BaseDatos,
  tabla: Tabla,
  nombre: string,
  salvoId?: string,
): Promise<void> {
  const filas = await db.select({ id: tabla.id, nombre: tabla.nombre }).from(tabla as PgTable)
  const buscado = normalizar(nombre)
  if (filas.some((f) => f.id !== salvoId && normalizar(f.nombre) === buscado)) {
    throw new ErrorApi(409, 'nombre_repetido', 'Ya existe una con ese nombre.', {
      nombre: 'Ya existe una con ese nombre',
    })
  }
}

async function siguienteOrden(db: BaseDatos, tabla: Tabla): Promise<number> {
  const [fila] = await db.select({ m: max(tabla.orden) }).from(tabla as PgTable)
  return (fila?.m ?? -1) + 1
}

const aCatalogo = (f: FilaArea, charters: number): CatalogoAdmin => ({
  id: f.id,
  nombre: f.nombre,
  activa: f.activa,
  orden: f.orden,
  charters,
})

const aCategoriaAdmin = (f: FilaCategoria, charters: number): CategoriaAdmin => ({
  ...aCatalogo(f, charters),
  color: f.color,
  colorFondo: f.colorFondo,
  protegida: f.protegida,
})

const fondoDe = (color: string) => PALETA_CATEGORIAS.find((p) => p.color === color)!.colorFondo

// ── Categorías ──────────────────────────────────────────────────────────

export async function listarCategoriasAdmin(db: BaseDatos): Promise<CategoriaAdmin[]> {
  const filas = await db
    .select()
    .from(categoria)
    .orderBy(asc(categoria.orden), asc(categoria.nombre))
  const usos = await usosDe(db, categoria)
  return filas.map((f) => aCategoriaAdmin(f, usos.get(f.id) ?? 0))
}

async function leerCategoria(db: BaseDatos, id: string): Promise<FilaCategoria> {
  const [fila] = await db.select().from(categoria).where(eq(categoria.id, id)).limit(1)
  if (!fila) throw noEncontrada()
  return fila
}

export async function crearCategoria(db: BaseDatos, cuerpo: unknown): Promise<CategoriaAdmin> {
  const datos = crearCategoriaEntrada.parse(cuerpo)
  await exigirNombreLibre(db, categoria, datos.nombre)
  const [fila] = await db
    .insert(categoria)
    .values({
      id: v7(),
      nombre: datos.nombre,
      color: datos.color,
      colorFondo: fondoDe(datos.color),
      orden: await siguienteOrden(db, categoria),
    })
    .returning()
  return aCategoriaAdmin(fila!, 0)
}

export async function editarCategoria(
  db: BaseDatos,
  id: string,
  cuerpo: unknown,
): Promise<CategoriaAdmin> {
  const datos = editarCategoriaEntrada.parse(cuerpo)
  const actual = await leerCategoria(db, id)
  if (actual.protegida && datos.activa === false) throw protegida()
  if (datos.nombre !== undefined) await exigirNombreLibre(db, categoria, datos.nombre, id)
  const { color, ...resto } = datos
  const [fila] = await db
    .update(categoria)
    .set(color ? { ...resto, color, colorFondo: fondoDe(color) } : resto)
    .where(eq(categoria.id, id))
    .returning()
  return aCategoriaAdmin(fila!, await usosDeUna(db, categoria, id))
}

export async function eliminarCategoria(db: BaseDatos, id: string): Promise<void> {
  const actual = await leerCategoria(db, id)
  if (actual.protegida) throw protegida()
  if ((await usosDeUna(db, categoria, id)) > 0) {
    throw new ErrorApi(409, 'en_uso', 'Hay charters con esta categoría; puedes desactivarla.')
  }
  await db.delete(categoria).where(eq(categoria.id, id))
}

// ── Áreas ───────────────────────────────────────────────────────────────

export async function listarAreasAdmin(db: BaseDatos): Promise<CatalogoAdmin[]> {
  const filas = await db.select().from(area).orderBy(asc(area.orden), asc(area.nombre))
  const usos = await usosDe(db, area)
  return filas.map((f) => aCatalogo(f, usos.get(f.id) ?? 0))
}

async function leerArea(db: BaseDatos, id: string): Promise<FilaArea> {
  const [fila] = await db.select().from(area).where(eq(area.id, id)).limit(1)
  if (!fila) throw noEncontrada()
  return fila
}

export async function crearArea(db: BaseDatos, cuerpo: unknown): Promise<CatalogoAdmin> {
  const datos = crearAreaEntrada.parse(cuerpo)
  await exigirNombreLibre(db, area, datos.nombre)
  const [fila] = await db
    .insert(area)
    .values({ id: v7(), nombre: datos.nombre, orden: await siguienteOrden(db, area) })
    .returning()
  return aCatalogo(fila!, 0)
}

export async function editarArea(
  db: BaseDatos,
  id: string,
  cuerpo: unknown,
): Promise<CatalogoAdmin> {
  const datos = editarAreaEntrada.parse(cuerpo)
  await leerArea(db, id)
  if (datos.nombre !== undefined) await exigirNombreLibre(db, area, datos.nombre, id)
  const [fila] = await db.update(area).set(datos).where(eq(area.id, id)).returning()
  return aCatalogo(fila!, await usosDeUna(db, area, id))
}

export async function eliminarArea(db: BaseDatos, id: string): Promise<void> {
  await leerArea(db, id)
  if ((await usosDeUna(db, area, id)) > 0) {
    throw new ErrorApi(409, 'en_uso', 'Hay charters con esta área; puedes desactivarla.')
  }
  await db.delete(area).where(eq(area.id, id))
}
