import { resolve } from 'node:path'
import { cargarEntorno, leerConfig } from '../config'
import { abrirDb, cerrarDb, esUrlPostgres, prepararDb } from '../db/conexion'

// Aplica las migraciones y siembra los catálogos. En Vercel corre en el build, contra Neon.
cargarEntorno(resolve('../../.env'))
const { urlDb } = leerConfig()
const db = await abrirDb(esUrlPostgres(urlDb) ? urlDb : resolve(urlDb))
try {
  await prepararDb(db)
  console.log('Base lista')
} finally {
  await cerrarDb(db)
}
