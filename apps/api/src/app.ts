import Fastify, { type FastifyInstance } from 'fastify'
import type { Config } from './config'

export interface OpcionesApp {
  config: Config
}

export async function construirApp({ config }: OpcionesApp): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.decorate('config', config)

  await app.register(
    async (api) => {
      api.get('/salud', async () => ({ ok: true }))
    },
    { prefix: '/api' },
  )

  return app
}
