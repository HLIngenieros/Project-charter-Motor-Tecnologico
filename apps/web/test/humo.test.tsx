import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app/App'

describe('web', () => {
  it('muestra el nombre de la plataforma', () => {
    render(<App />)
    expect(screen.getByText('Project Charters')).toBeInTheDocument()
  })
})
