import { construirApp } from './app'
import { leerConfig } from './config'

const config = leerConfig()
const app = await construirApp({ config })

try {
  await app.listen({ port: config.puerto, host: '127.0.0.1' })
  console.log(`API escuchando en http://localhost:${config.puerto}`)
} catch (error) {
  console.error(error)
  process.exit(1)
}
