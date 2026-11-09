import { resolve } from 'node:path'
import { promoverAdmin } from '../auth/cuentas'
import { leerConfig } from '../config'
import { crearDb } from '../db/conexion'

const USO = 'Uso: npm run admin -- --promover <correo> | --quitar <correo>'

const [opcion, correo] = process.argv.slice(2)
if (!correo || (opcion !== '--promover' && opcion !== '--quitar')) {
  console.error(USO)
  process.exit(1)
}

const db = crearDb(resolve(leerConfig().rutaDb))
try {
  await promoverAdmin(db, correo, opcion === '--promover')
  console.log(opcion === '--promover' ? `${correo} ahora es Admin.` : `${correo} ya no es Admin.`)
} catch (error) {
  if (error instanceof Error && error.message === 'usuario_inexistente') {
    console.error(`No hay una cuenta registrada con ${correo}.`)
    process.exit(1)
  }
  throw error
}
