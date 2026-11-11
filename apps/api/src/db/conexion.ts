import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as esquema from './esquema'
import { sembrar } from './semilla'

export type BaseDatos = PgDatabase<PgQueryResultHKT, typeof esquema>

type Motor = 'pg' | 'pglite'

/** Con qué driver se abrió cada base, para migrarla con el migrador que le corresponde. */
const motores = new WeakMap<BaseDatos, Motor>()

export const esUrlPostgres = (destino: string) => /^postgres(ql)?:\/\//.test(destino)

/** Carpeta de migraciones: `apps/api/drizzle`, tanto desde `src/db` como desde `dist`. */
function carpetaMigraciones(): string {
  const candidatas = ['../../drizzle', '../drizzle'].map((r) =>
    fileURLToPath(new URL(r, import.meta.url)),
  )
  const carpeta = candidatas.find((c) => existsSync(`${c}/meta/_journal.json`))
  if (!carpeta) throw new Error('No se encontró la carpeta de migraciones de la base de datos')
  return carpeta
}

/**
 * Abre la base sin migrarla. Una URL `postgres://` va a Postgres (Neon) con un pool de `pg`;
 * `':memory:'` es PGlite en memoria, y cualquier otra cosa, PGlite en esa carpeta.
 */
export async function abrirDb(destino: string): Promise<BaseDatos> {
  if (esUrlPostgres(destino)) {
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const db = drizzle(new Pool({ connectionString: destino, max: 3 }), { schema: esquema })
    motores.set(db, 'pg')
    return db
  }
  // PGlite solo con import dinámico: así no entra en la función de Vercel.
  const { PGlite } = await import('@electric-sql/pglite')
  if (destino !== ':memory:') mkdirSync(destino, { recursive: true })
  const cliente = destino === ':memory:' ? new PGlite() : new PGlite(destino)
  return envolverPglite(cliente)
}

/** Base de Drizzle sobre un cliente de PGlite ya abierto (las pruebas lo usan con `clone()`). */
export async function envolverPglite(
  cliente: import('@electric-sql/pglite').PGlite,
): Promise<BaseDatos> {
  const { drizzle } = await import('drizzle-orm/pglite')
  const db = drizzle(cliente, { schema: esquema })
  motores.set(db, 'pglite')
  return db
}

/** Aplica las migraciones pendientes y siembra los catálogos. */
export async function prepararDb(db: BaseDatos): Promise<void> {
  const migrationsFolder = carpetaMigraciones()
  if (motores.get(db) === 'pg') {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    await migrate(db as never, { migrationsFolder })
  } else {
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    await migrate(db as never, { migrationsFolder })
  }
  await sembrar(db)
}

/** Abre, migra y siembra (desarrollo, CLI y pruebas). Admite ':memory:'. */
export async function crearDb(destino: string): Promise<BaseDatos> {
  const db = await abrirDb(destino)
  await prepararDb(db)
  return db
}
