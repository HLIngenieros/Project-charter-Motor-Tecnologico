import {
  REGLAS_POR_DEFECTO,
  reglasEntrada,
  type ParametrosRespuesta,
  type Reglas,
} from '@charter/shared'
import { eq } from 'drizzle-orm'
import type { BaseDatos } from '../../db/conexion'
import { parametros, usuario, type FilaCharter } from '../../db/esquema'

const FILA = 1

/** Reglas sin umbrales: lo que guarda `charter.reglas`. */
export type ReglasCharter = Omit<Reglas, 'umbrales'>

/** Reglas vigentes para los charters nuevos (las de fábrica si nadie las cambió). */
export function leerReglasVigentes(db: BaseDatos): Reglas {
  const fila = db.select().from(parametros).where(eq(parametros.id, FILA)).get()
  if (!fila) return REGLAS_POR_DEFECTO
  return { ...REGLAS_POR_DEFECTO, ...(JSON.parse(fila.reglas) as Partial<Reglas>) }
}

export function leerParametros(db: BaseDatos): ParametrosRespuesta {
  const fila = db
    .select({
      reglas: parametros.reglas,
      actualizadoEn: parametros.actualizadoEn,
      porId: usuario.id,
      porNombre: usuario.nombre,
    })
    .from(parametros)
    .leftJoin(usuario, eq(usuario.id, parametros.actualizadoPor))
    .where(eq(parametros.id, FILA))
    .get()
  if (!fila) return { reglas: REGLAS_POR_DEFECTO, actualizadoPor: null, actualizadoEn: null }
  return {
    reglas: { ...REGLAS_POR_DEFECTO, ...(JSON.parse(fila.reglas) as Partial<Reglas>) },
    actualizadoPor: fila.porId ? { id: fila.porId, nombre: fila.porNombre! } : null,
    actualizadoEn: fila.actualizadoEn,
  }
}

export function guardarReglas(
  db: BaseDatos,
  usuarioId: string,
  cuerpo: unknown,
): ParametrosRespuesta {
  const reglas = reglasEntrada.parse(cuerpo)
  const valores = {
    reglas: JSON.stringify(reglas),
    actualizadoPor: usuarioId,
    actualizadoEn: new Date().toISOString(),
  }
  db.insert(parametros)
    .values({ id: FILA, ...valores })
    .onConflictDoUpdate({ target: parametros.id, set: valores })
    .run()
  return leerParametros(db)
}

/** Separa las reglas en lo que va a la columna JSON y los umbrales (en sus columnas). */
export function columnasDeReglas(r: Reglas) {
  const { umbrales, ...resto } = r
  return {
    reglas: JSON.stringify(resto satisfies ReglasCharter),
    umbralAtencion: umbrales.atencion,
    umbralRiesgo: umbrales.riesgo,
    umbralAtraso: umbrales.atraso,
  }
}

/** Reglas con que calcula un charter: la columna JSON más sus umbrales. */
export function reglasDeCharter(fila: FilaCharter): Reglas {
  return {
    ...REGLAS_POR_DEFECTO,
    ...(JSON.parse(fila.reglas) as Partial<ReglasCharter>),
    umbrales: {
      atencion: fila.umbralAtencion,
      riesgo: fila.umbralRiesgo,
      atraso: fila.umbralAtraso,
    },
  }
}
