import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Aviso } from '../src/componentes/Aviso'
import { Boton } from '../src/componentes/Boton'
import { Campo } from '../src/componentes/Campo'
import { Dialogo } from '../src/componentes/Dialogo'
import { Pestanas } from '../src/componentes/Pestanas'

describe('Boton', () => {
  it('con cargando queda deshabilitado y anuncia "Cargando"', () => {
    render(<Boton cargando>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: /guardar/i })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveTextContent('Cargando')
  })

  it('sin cargando está habilitado y es type="button" por defecto', () => {
    render(<Boton variante="secundario">Cancelar</Boton>)
    const boton = screen.getByRole('button', { name: 'Cancelar' })
    expect(boton).toBeEnabled()
    expect(boton).toHaveAttribute('type', 'button')
  })
})

describe('Campo', () => {
  it('muestra el error y lo enlaza con aria-describedby', () => {
    render(
      <Campo
        etiqueta="Correo"
        error="Usa tu correo @hlingenieros.com"
        ayuda="Tu correo de trabajo"
      />,
    )
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Usa tu correo @hlingenieros.com/)
    expect(input).toHaveAccessibleDescription(/Tu correo de trabajo/)
  })

  it('sin error no queda inválido', () => {
    render(<Campo etiqueta="Nombre" />)
    expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('aria-invalid')
  })
})

function ConDialogo() {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button onClick={() => setAbierto(true)}>Abrir</button>
      <Dialogo abierto={abierto} alCerrar={() => setAbierto(false)} titulo="Eliminar actividad">
        <p>¿Seguro?</p>
        <button>Primero</button>
        <button>Último</button>
      </Dialogo>
    </>
  )
}

describe('Dialogo', () => {
  it('se cierra con Esc y devuelve el foco al disparador', async () => {
    const usuario = userEvent.setup()
    render(<ConDialogo />)
    const disparador = screen.getByRole('button', { name: 'Abrir' })
    await usuario.click(disparador)

    const dialogo = await screen.findByRole('dialog', { name: 'Eliminar actividad' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toContainElement(document.activeElement as HTMLElement)

    await usuario.keyboard('{Escape}')
    await expect.poll(() => screen.queryByRole('dialog')).toBeNull()
    expect(disparador).toHaveFocus()
  })

  it('atrapa el foco con Tab', async () => {
    const usuario = userEvent.setup()
    render(<ConDialogo />)
    await usuario.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialogo = await screen.findByRole('dialog')
    for (let i = 0; i < 6; i++) {
      await usuario.tab()
      expect(dialogo).toContainElement(document.activeElement as HTMLElement)
    }
  })
})

describe('Aviso y Pestanas', () => {
  it('un aviso de alerta usa role="alert"', () => {
    render(<Aviso tono="alerta">No fue posible crear la cuenta</Aviso>)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible crear la cuenta')
  })

  it('las pestañas se recorren con las flechas', async () => {
    const usuario = userEvent.setup()
    function Prueba() {
      const [activa, setActiva] = useState('definicion')
      return (
        <Pestanas
          etiqueta="Secciones"
          pestanas={[
            { id: 'definicion', etiqueta: 'Definición' },
            { id: 'cronograma', etiqueta: 'Cronograma' },
          ]}
          activa={activa}
          alCambiar={setActiva}
        />
      )
    }
    render(<Prueba />)
    await usuario.click(screen.getByRole('tab', { name: 'Definición' }))
    await usuario.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Cronograma' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Cronograma' })).toHaveFocus()
  })
})
