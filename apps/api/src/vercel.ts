import type { IncomingMessage, ServerResponse } from 'node:http'
import type { FastifyInstance } from 'fastify'
import { construirApp } from './app'
import { leerConfig } from './config'
import { abrirDb } from './db/conexion'

type Manejador = (req: IncomingMessage, res: ServerResponse) => Promise<void>

/**
 * Función de Vercel: arranca la app una sola vez por instancia (también si llegan varias
 * peticiones en frío a la vez) y le pasa cada petición al servidor de Fastify.
 */
export function crearManejador(iniciar: () => Promise<FastifyInstance>): Manejador {
  let lista: Promise<FastifyInstance> | undefined
  return async (req, res) => {
    lista ??= iniciar()
      .then(async (app) => {
        await app.ready()
        return app
      })
      .catch((error: unknown) => {
        lista = undefined // que la siguiente petición lo reintente
        throw error
      })
    const app = await lista
    app.server.emit('request', req, res)
  }
}

// Sin migrar: las migraciones corren en el build (`npm run migrar`).
export default crearManejador(async () => {
  const config = leerConfig()
  return construirApp({ config, db: await abrirDb(config.urlDb) })
})
