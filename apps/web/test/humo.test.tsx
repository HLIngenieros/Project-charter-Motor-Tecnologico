import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app/App'

afterEach(() => vi.unstubAllGlobals())

describe('web', () => {
  it('muestra el nombre de la plataforma', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { codigo: 'no_autenticado', mensaje: '' } }), {
            status: 401,
          }),
      ),
    )
    render(<App />)
    expect(await screen.findByText('Project Charters')).toBeInTheDocument()
  })
})
