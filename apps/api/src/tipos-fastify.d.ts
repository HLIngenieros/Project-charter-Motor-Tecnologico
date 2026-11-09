import type { UsuarioSesion } from './auth/sesiones'
import type { Config } from './config'
import type { BaseDatos } from './db/conexion'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    db: BaseDatos
  }
  interface FastifyRequest {
    /** Lo pone `exigirSesion`. */
    usuario?: UsuarioSesion
  }
}
