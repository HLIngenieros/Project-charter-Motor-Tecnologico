import { resolve } from 'node:path'
import { construirApp } from './app'
import { cargarEntorno, leerConfig } from './config'
import { crearDb, esUrlPostgres } from './db/conexion'

// El .env vive en la raíz del monorepo; la API se ejecuta desde apps/api.
cargarEntorno(resolve('../../.env'))
const config = leerConfig()
const destino = esUrlPostgres(config.urlDb) ? config.urlDb : resolve(config.urlDb)
const app = await construirApp({ config, db: await crearDb(destino) })

try {
  await app.listen({ port: config.puerto, host: '127.0.0.1' })
  console.log(
    `API escuchando en http://localhost:${config.puerto} · base: ${esUrlPostgres(destino) ? 'Postgres' : destino}`,
  )
} catch (error) {
  console.error(error)
  process.exit(1)
}
