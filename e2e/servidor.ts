// API aislada para las pruebas E2E: base PGlite en memoria (nace vacía en cada corrida),
// con una cuenta Admin ya creada. No toca `data/pglite` ni el `npm run dev` del usuario.
import { construirApp } from '../apps/api/src/app'
import { promoverAdmin } from '../apps/api/src/auth/cuentas'
import { leerConfig } from '../apps/api/src/config'
import { crearDb } from '../apps/api/src/db/conexion'
import { ADMIN, PUERTO_API } from './datos'

const config = { ...leerConfig({}), puerto: PUERTO_API }
const db = await crearDb(':memory:')
const app = await construirApp({ config, db })

const registro = await app.inject({
  method: 'POST',
  url: '/api/auth/registro',
  headers: { 'x-requested-with': 'charter' },
  payload: ADMIN,
})
if (registro.statusCode !== 201) throw new Error(`No se creó el Admin: ${registro.body}`)
await promoverAdmin(db, ADMIN.correo, true)

await app.listen({ port: PUERTO_API, host: '127.0.0.1' })
console.log(`API de E2E en http://localhost:${PUERTO_API}`)
