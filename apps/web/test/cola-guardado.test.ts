import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorCliente } from '../src/api/cliente'
import { useColaGuardado } from '../src/pantallas/ficha/colaGuardado'

afterEach(() => vi.restoreAllMocks())

const esperar = (ms: number) => new Promise((fin) => setTimeout(fin, ms))

describe('useColaGuardado', () => {
  it('corre las tareas de una en una y en orden', async () => {
    const orden: number[] = []
    const { result } = renderHook(() => useColaGuardado())
    act(() => {
      result.current.encolar(async () => {
        await esperar(40)
        orden.push(1)
      })
      result.current.encolar(async () => {
        orden.push(2)
      })
    })
    expect(result.current.estado).toBe('guardando')
    await waitFor(() => expect(result.current.estado).toBe('guardado'))
    expect(orden).toEqual([1, 2])
    expect(result.current.ultimoGuardado).not.toBeNull()
  })

  it('si una falla se detiene hasta reintentar', async () => {
    let intentos = 0
    const segunda = vi.fn(async () => {})
    const { result } = renderHook(() => useColaGuardado())
    act(() => {
      result.current.encolar(async () => {
        intentos++
        if (intentos === 1) throw new ErrorCliente(500, 'error_interno', 'Falló')
      })
      result.current.encolar(segunda)
    })
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.error?.codigo).toBe('error_interno')
    expect(segunda).not.toHaveBeenCalled()

    act(() => result.current.reintentar())
    await waitFor(() => expect(result.current.estado).toBe('guardado'))
    expect(intentos).toBe(2)
    expect(segunda).toHaveBeenCalledTimes(1)
  })

  it('pide confirmar al salir mientras haya trabajo pendiente', async () => {
    const poner = vi.spyOn(window, 'addEventListener')
    const quitar = vi.spyOn(window, 'removeEventListener')
    const { result } = renderHook(() => useColaGuardado())
    act(() => result.current.encolar(() => esperar(30)))
    await waitFor(() =>
      expect(poner.mock.calls.some(([tipo]) => tipo === 'beforeunload')).toBe(true),
    )
    await waitFor(() => expect(result.current.estado).toBe('guardado'))
    expect(quitar.mock.calls.some(([tipo]) => tipo === 'beforeunload')).toBe(true)
  })
})
