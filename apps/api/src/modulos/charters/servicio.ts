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
import { asc, desc, eq, inArray } from 'drizzle-orm'
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

const ESTADOS_CERRADOS = new Set<FilaCharter['estado']>(['cerrado', 'cancelado'])

const aCategoria = (c: typeof categoria.$inferSelect): CategoriaPublica => ({
  id: c.id,
  nombre: c.nombre,
  color: c.color,
  colorFondo: c.colorFondo,
  activa: c.activa,
})

const aArea = (a: typeof area.$inferSelect): AreaPublica => ({
  id: a.id,
  nombre: a.nombre,
  activa: a.activa,
})

export function listarCategorias(db: BaseDatos): CategoriaPublica[] {
  return db
    .select()
    .from(categoria)
    .orderBy(asc(categoria.orden), asc(categoria.nombre))
    .all()
    .map(aCategoria)
}

export function listarAreas(db: BaseDatos): AreaPublica[] {
  return db.select().from(area).orderBy(asc(area.orden), asc(area.nombre)).all().map(aArea)
}

/**
 * Una categoría o un área nueva debe existir y estar activa. Si el charter ya la tenía,
 * se acepta aunque se haya desactivado después.
 */
export function validarCatalogos(
  db: BaseDatos,
  datos: { categoriaId?: string | null; areaId?: string | null },
  actual?: FilaCharter,
): void {
  const campos: Record<string, string> = {}
  if (datos.categoriaId && datos.categoriaId !== actual?.categoriaId) {
    const fila = db.select().from(categoria).where(eq(categoria.id, datos.categoriaId)).get()
    if (!fila?.activa) campos.categoriaId = 'Elige una categoría válida'
  }
  if (datos.areaId && datos.areaId !== actual?.areaId) {
    const fila = db.select().from(area).where(eq(area.id, datos.areaId)).get()
    if (!fila?.activa) campos.areaId = 'Elige un área válida'
  }
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi(400, 'datos_invalidos', 'Revisa los datos del formulario', campos)
  }
}

export function listarMisCharters(db: BaseDatos, usuarioId: string): CharterResumen[] {
  const filas = db
    .select({ charter, categoria, area })
    .from(charter)
    .leftJoin(categoria, eq(charter.categoriaId, categoria.id))
    .leftJoin(area, eq(charter.areaId, area.id))
    .where(eq(charter.propietarioId, usuarioId))
    .orderBy(desc(charter.actualizadoEn), desc(charter.id))
    .all()
  if (filas.length === 0) return []

  // El primer corte de cada charter en orden descendente de fecha es el último.
  const ultimos = new Map<string, CharterResumen['ultimoCorte']>()
  const cortes = db
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
    .orderBy(desc(corte.fecha))
    .all()
  for (const c of cortes) {
    if (!ultimos.has(c.charterId)) ultimos.set(c.charterId, { fecha: c.fecha, pv: c.pv, ev: c.ev })
  }

  return filas.map(({ charter: c, categoria: cat, area: ar }) => ({
    id: c.id,
    nombre: c.nombre,
    codigo: c.codigo,
    responsable: c.responsable,
    estado: c.estado,
    categoria: cat ? aCategoria(cat) : null,
    area: ar ? aArea(ar) : null,
    actualizadoEn: c.actualizadoEn,
    ultimoCorte: ultimos.get(c.id) ?? null,
  }))
}

export function crearCharter(db: BaseDatos, usuarioId: string, datos: CharterCrear): string {
  validarCatalogos(db, datos)
  const id = v7()
  db.insert(charter)
    .values({
      id,
      propietarioId: usuarioId,
      nombre: datos.nombre,
      categoriaId: datos.categoriaId ?? null,
      areaId: datos.areaId ?? null,
      razonDeSer: datos.razonDeSer ?? '',
    })
    .run()
  return id
}

export function detalleCharter(
  db: BaseDatos,
  fila: FilaCharter,
  yo: UsuarioSesion,
): CharterDetalle {
  const propietario = db
    .select({ id: usuario.id, nombre: usuario.nombre })
    .from(usuario)
    .where(eq(usuario.id, fila.propietarioId))
    .get()!

  const listas = Object.fromEntries(TIPOS_LISTA.map((t) => [t, [] as ItemLista[]])) as Record<
    TipoLista,
    ItemLista[]
  >
  const items = db
    .select()
    .from(itemLista)
    .where(eq(itemLista.charterId, fila.id))
    .orderBy(asc(itemLista.orden))
    .all()
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
    propietario,
    listas,
    permisos: { editar: esDueno && !cerrado, reabrir: esDueno && cerrado },
  }
}

/** Aplica los cambios y devuelve la fila actualizada. */
export function editarCharter(db: BaseDatos, fila: FilaCharter, datos: CharterEditar): FilaCharter {
  validarCatalogos(db, datos, fila)
  return db.update(charter).set(datos).where(eq(charter.id, fila.id)).returning().get()!
}

export function eliminarCharter(db: BaseDatos, id: string): void {
  db.delete(charter).where(eq(charter.id, id)).run()
}
