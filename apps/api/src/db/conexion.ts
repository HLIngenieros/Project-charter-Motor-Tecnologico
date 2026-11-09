import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as esquema from './esquema'
import { sembrar } from './semilla'

export type BaseDatos = BetterSQLite3Database<typeof esquema>

/** Carpeta de migraciones: `apps/api/drizzle`, tanto desde `src/db` como desde `dist`. */
function carpetaMigraciones(): string {
  const candidatas = ['../../drizzle', '../drizzle'].map((r) =>
    fileURLToPath(new URL(r, import.meta.url)),
  )
  const carpeta = candidatas.find((c) => existsSync(`${c}/meta/_journal.json`))
  if (!carpeta) throw new Error('No se encontró la carpeta de migraciones de la base de datos')
  return carpeta
}

/** Abre (o crea) la base, aplica las migraciones y siembra los catálogos. Admite ':memory:'. */
export function crearDb(ruta: string): BaseDatos {
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true })
  const sqlite = new Database(ruta)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  const db = drizzle(sqlite, { schema: esquema })
  migrate(db, { migrationsFolder: carpetaMigraciones() })
  sembrar(db)
  return db
}
