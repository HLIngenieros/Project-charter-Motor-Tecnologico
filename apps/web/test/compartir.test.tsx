import type { AccesoCharter, AccesoEntrada } from '@charter/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Proveedores } from '../src/app/Proveedores'
import { BotonCompartir } from '../src/pantallas/ficha/DialogoCompartir'
import { simularApi } from './simular-api'

afterEach(() => vi.unstubAllGlobals())

function abrir() {
  let accesos: AccesoCharter[] = []
  const llamadas = simularApi((l) => {
    if (l.url === '/api/charters/c1/accesos' && l.metodo === 'GET')
      return { estado: 200, cuerpo: accesos }
    if (l.url === '/api/charters/c1/accesos' && l.metodo === 'POST') {
      const { correo, rol } = l.cuerpo as AccesoEntrada
      if (correo.endsWith('@gmail.com'))
        return {
          estado: 400,
          cuerpo: {
            error: {
              codigo: 'datos_invalidos',
              mensaje: 'Revisa los datos',
              campos: { correo: 'Solo puedes compartir con correos @hlingenieros.com' },
            },
          },
        }
      accesos = [...accesos.filter((a) => a.correo !== correo), { correo, rol, nombre: null }]
      return { estado: 200, cuerpo: accesos }
    }
    if (l.url.startsWith('/api/charters/c1/accesos/') && l.metodo === 'DELETE') {
      const correo = decodeURIComponent(l.url.split('/').at(-1)!)
      accesos = accesos.filter((a) => a.correo !== correo)
      return { estado: 200, cuerpo: accesos }
    }
    return undefined
  })
  render(
    <Proveedores>
      <BotonCompartir charterId="c1" nombre="Radicación de facturas" />
    </Proveedores>,
  )
  return llamadas
}

describe('compartir charter', () => {
  it('agrega un correo pendiente, cambia su rol y lo quita', async () => {
    const usuario = userEvent.setup()
    const llamadas = abrir()
    await usuario.click(screen.getByRole('button', { name: 'Compartir' }))
    const dialogo = screen.getByRole('dialog', { name: 'Compartir charter' })
    expect(await within(dialogo).findByText('Aún no lo compartes con nadie.')).toBeTruthy()

    await usuario.type(within(dialogo).getByLabelText('Correo'), 'Beto@HLIngenieros.com')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Compartir' }))
    expect(await within(dialogo).findByText('Pendiente de registro')).toBeTruthy()
    expect(llamadas.find((l) => l.metodo === 'POST')?.cuerpo).toEqual({
      correo: 'beto@hlingenieros.com',
      rol: 'editor',
    })

    await usuario.selectOptions(
      within(dialogo).getByLabelText('Rol de beto@hlingenieros.com'),
      'lector',
    )
    expect(llamadas.filter((l) => l.metodo === 'POST').at(-1)?.cuerpo).toEqual({
      correo: 'beto@hlingenieros.com',
      rol: 'lector',
    })

    await usuario.click(
      within(dialogo).getByRole('button', { name: 'Quitar el acceso de beto@hlingenieros.com' }),
    )
    expect(await within(dialogo).findByText('Aún no lo compartes con nadie.')).toBeTruthy()
  })

  it('muestra el error de dominio en el campo', async () => {
    const usuario = userEvent.setup()
    abrir()
    await usuario.click(screen.getByRole('button', { name: 'Compartir' }))
    const dialogo = screen.getByRole('dialog', { name: 'Compartir charter' })
    await usuario.type(within(dialogo).getByLabelText('Correo'), 'x@gmail.com')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Compartir' }))
    expect(
      await within(dialogo).findByText('Solo puedes compartir con correos @hlingenieros.com'),
    ).toBeTruthy()
  })
})
