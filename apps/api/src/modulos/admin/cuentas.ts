import { editarCuentaEntrada, type CuentaAdmin } from '@charter/shared'
import { randomInt } from 'node:crypto'
import { and, asc, count, eq, max, ne } from 'drizzle-orm'
import { cifrarClave } from '../../auth/claves'
import { cerrarSesionesDe } from '../../auth/sesiones'
import type { BaseDatos } from '../../db/conexion'
import { charter, sesion, usuario, type FilaUsuario } from '../../db/esquema'
import { ErrorApi } from '../../errores'

/** Sin caracteres ambiguos (0/O, 1/l/I). */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const LARGO_TEMPORAL = 12

export function generarClaveTemporal(): string {
  let clave = ''
  for (let i = 0; i < LARGO_TEMPORAL; i++) clave += ALFABETO[randomInt(ALFABETO.length)]
  return clave
}

const noEncontrada = () => new ErrorApi(404, 'no_encontrado', 'La cuenta no existe')

function aCuenta(
  u: FilaUsuario,
  extra: { charters: number; ultimoAcceso: string | null },
): CuentaAdmin {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    esAdmin: u.esAdmin,
    activo: u.activo,
    debeCambiarClave: u.debeCambiarClave,
    charters: extra.charters,
    ultimoAcceso: extra.ultimoAcceso,
    creadoEn: u.creadoEn,
  }
}

async function extrasDe(db: BaseDatos, ids?: string[]) {
  const charters = await db
    .select({ id: charter.propietarioId, n: count() })
    .from(charter)
    .groupBy(charter.propietarioId)
  const accesos = await db
    .select({ id: sesion.usuarioId, ultimo: max(sesion.ultimoUso) })
    .from(sesion)
    .groupBy(sesion.usuarioId)
  const porId = new Map<string, { charters: number; ultimoAcceso: string | null }>()
  for (const id of ids ?? []) porId.set(id, { charters: 0, ultimoAcceso: null })
  for (const c of charters) porId.set(c.id, { charters: c.n, ultimoAcceso: null })
  for (const a of accesos) {
    const e = porId.get(a.id) ?? { charters: 0, ultimoAcceso: null }
    porId.set(a.id, { ...e, ultimoAcceso: a.ultimo })
  }
  return (id: string) => porId.get(id) ?? { charters: 0, ultimoAcceso: null }
}

export async function listarCuentas(db: BaseDatos): Promise<CuentaAdmin[]> {
  const filas = await db.select().from(usuario).orderBy(asc(usuario.nombre), asc(usuario.correo))
  const extra = await extrasDe(db)
  return filas.map((u) => aCuenta(u, extra(u.id)))
}

async function leerCuenta(db: BaseDatos, id: string): Promise<CuentaAdmin> {
  const [fila] = await db.select().from(usuario).where(eq(usuario.id, id)).limit(1)
  if (!fila) throw noEncontrada()
  const extra = await extrasDe(db)
  return aCuenta(fila, extra(id))
}

/** Clave temporal nueva: la cifra, obliga a cambiarla y cierra todas las sesiones de la cuenta. */
export async function restablecerClave(
  db: BaseDatos,
  id: string,
): Promise<{ claveTemporal: string }> {
  const [fila] = await db
    .select({ id: usuario.id })
    .from(usuario)
    .where(eq(usuario.id, id))
    .limit(1)
  if (!fila) throw noEncontrada()
  const claveTemporal = generarClaveTemporal()
  const hashClave = await cifrarClave(claveTemporal)
  await db.update(usuario).set({ hashClave, debeCambiarClave: true }).where(eq(usuario.id, id))
  await cerrarSesionesDe(db, id)
  return { claveTemporal }
}

/**
 * Activa/desactiva o da/quita el rol de Admin. `yoId` no puede desactivarse ni quitarse el
 * rol (400 `sobre_si_mismo`), y la operación no puede dejar el sistema sin Admin activo
 * (409 `ultimo_admin`). Desactivar cierra todas las sesiones de la cuenta.
 */
export async function editarCuenta(
  db: BaseDatos,
  yoId: string,
  id: string,
  cuerpo: unknown,
): Promise<CuentaAdmin> {
  const datos = editarCuentaEntrada.parse(cuerpo)
  if (id === yoId && (datos.activo === false || datos.esAdmin === false)) {
    throw new ErrorApi(
      400,
      'sobre_si_mismo',
      'No puedes desactivar tu propia cuenta ni quitarte el rol de Admin.',
    )
  }
  const desactivada = await db.transaction(async (tx) => {
    const [fila] = await tx.select().from(usuario).where(eq(usuario.id, id)).limit(1)
    if (!fila) throw noEncontrada()
    const quedaAdmin = (datos.esAdmin ?? fila.esAdmin) && (datos.activo ?? fila.activo)
    if (fila.esAdmin && fila.activo && !quedaAdmin) {
      const [otros] = await tx
        .select({ n: count() })
        .from(usuario)
        .where(and(eq(usuario.esAdmin, true), eq(usuario.activo, true), ne(usuario.id, id)))
      if ((otros?.n ?? 0) === 0) {
        throw new ErrorApi(409, 'ultimo_admin', 'Debe quedar al menos un Admin activo.')
      }
    }
    await tx.update(usuario).set(datos).where(eq(usuario.id, id))
    return fila.activo && datos.activo === false
  })
  if (desactivada) await cerrarSesionesDe(db, id)
  return leerCuenta(db, id)
}
