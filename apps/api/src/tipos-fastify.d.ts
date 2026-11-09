import type { Config } from './config'
import type { BaseDatos } from './db/conexion'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    db: BaseDatos
  }
}
