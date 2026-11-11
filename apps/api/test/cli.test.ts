import { describe, expect, it } from 'vitest'
import { promoverAdmin } from '../src/auth/cuentas'
import { usuario } from '../src/db/esquema'
import { nuevaApp, registrar } from './ayudas'

describe('promoverAdmin', () => {
  it('promueve y quita el perfil Admin de un correo registrado', async () => {
    const { app, db } = await nuevaApp()
    await registrar(app)
    await promoverAdmin(db, ' ANA@hlingenieros.com ', true)
    expect((await db.select().from(usuario))[0]?.esAdmin).toBe(true)
    await promoverAdmin(db, 'ana@hlingenieros.com', false)
    expect((await db.select().from(usuario))[0]?.esAdmin).toBe(false)
  })

  it('lanza usuario_inexistente con un correo no registrado', async () => {
    const { db } = await nuevaApp()
    await expect(promoverAdmin(db, 'nadie@hlingenieros.com', true)).rejects.toThrow(
      'usuario_inexistente',
    )
  })
})
