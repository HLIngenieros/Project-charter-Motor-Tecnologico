import { resolve } from 'node:path'
import { construirApp } from './app'
import { leerConfig } from './config'
import { crearDb } from './db/conexion'

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
