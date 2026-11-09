import { resolve } from 'node:path'
import { construirApp } from './app'
import { cargarEntorno, leerConfig } from './config'
import { crearDb } from './db/conexion'

// El .env vive en la raíz del monorepo; la API se ejecuta desde apps/api.
cargarEntorno(resolve('../../.env'))
const config = leerConfig()
const rutaDb = resolve(config.rutaDb)
const app = await construirApp({ config, db: crearDb(rutaDb) })

try {
  await app.listen({ port: config.puerto, host: '127.0.0.1' })
  console.log(`API escuchando en http://localhost:${config.puerto} · base: ${rutaDb}`)
} catch (error) {
  console.error(error)
  process.exit(1)
}
