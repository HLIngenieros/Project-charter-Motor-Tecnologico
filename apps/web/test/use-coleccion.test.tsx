import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContextoGuardado, useColaGuardado } from '../src/pantallas/ficha/colaGuardado'
import { textoMeta } from '../src/pantallas/ficha/complementos/textos'
import { useColeccion } from '../src/pantallas/ficha/complementos/useColeccion'

interface Fila {
  id: string
  texto: string
  nota: string
  n: number | null
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

function Cola({ children }: { children: ReactNode }) {
  const cola = useColaGuardado()
  return <ContextoGuardado.Provider value={cola}>{children}</ContextoGuardado.Provider>
}

function montar(
  inicial: Fila[],
  guardar = vi.fn<(items: Fila[]) => Promise<void>>(async () => {}),
) {
  const hook = renderHook(
    () =>
      useColeccion<Fila>({
        inicial,
        guardar,
        vacia: (f) => !f.texto.trim() && !f.nota.trim() && f.n === null,
        maximo: 3,
      }),
    { wrapper: Cola },
  )
  return { hook, guardar }
}

const fila = (id: string, texto = '', n: number | null = null): Fila => ({
  id,
  texto,
  nota: '',
  n,
})
const esperar = (ms = 800) => act(() => vi.advanceTimersByTimeAsync(ms))

describe('useColeccion', () => {
  it('escribir dispara un solo envío a los 800 ms', async () => {
    const { hook, guardar } = montar([fila('a', 'Uno')])
    act(() => hook.result.current.editar('a', { texto: 'Uno y' }))
    await esperar(400)
    act(() => hook.result.current.editar('a', { texto: 'Uno y dos' }))
    await esperar(799)
    expect(guardar).not.toHaveBeenCalled()
    await esperar(1)
    expect(guardar).toHaveBeenCalledTimes(1)
    expect(guardar.mock.calls[0]![0]).toEqual([fila('a', 'Uno y dos')])
  })

  it('inmediato envía ya y no repite si nada cambió', async () => {
    const { hook, guardar } = montar([fila('a', 'Uno')])
    act(() => hook.result.current.editar('a', { n: 3 }, true))
    await esperar(0)
    expect(guardar).toHaveBeenCalledTimes(1)
    act(() => hook.result.current.salir('a'))
    await esperar(900)
    expect(guardar).toHaveBeenCalledTimes(1)
  })

  it('salir de una fila totalmente vacía la quita y envía sin ella', async () => {
    const { hook, guardar } = montar([fila('a', 'Uno')])
    act(() => hook.result.current.agregar(fila('b')))
    expect(hook.result.current.filas).toHaveLength(2)
    expect(hook.result.current.porEnfocar.current).toBe('b')
    act(() => hook.result.current.salir('b'))
    await esperar(0)
    expect(hook.result.current.filas.map((f) => f.id)).toEqual(['a'])
    // La lista no cambió respecto a lo guardado: no hay envío.
    expect(guardar).not.toHaveBeenCalled()
  })

  it('una fila con datos y sin texto se envía', async () => {
    const { hook, guardar } = montar([])
    act(() => hook.result.current.agregar(fila('b')))
    act(() => hook.result.current.editar('b', { n: 4 }, true))
    act(() => hook.result.current.salir('b'))
    await esperar(0)
    expect(hook.result.current.filas).toHaveLength(1)
    expect(guardar).toHaveBeenLastCalledWith([fila('b', '', 4)])
  })

  it('no envía las filas vacías aún abiertas', async () => {
    const { hook, guardar } = montar([fila('a', 'Uno')])
    act(() => hook.result.current.agregar(fila('b'), 0))
    act(() => hook.result.current.editar('a', { texto: 'Uno!' }, true))
    await esperar(0)
    expect(hook.result.current.filas.map((f) => f.id)).toEqual(['a', 'b'])
    expect(guardar).toHaveBeenLastCalledWith([fila('a', 'Uno!')])
  })

  it('con la respuesta demorada, seguir escribiendo no pisa el texto y el segundo envío lleva el último', async () => {
    const guardar = vi.fn<(items: Fila[]) => Promise<void>>(
      () => new Promise<void>((fin) => setTimeout(fin, 2000)),
    )
    const { hook } = montar([fila('a', 'Uno')], guardar)
    act(() => hook.result.current.editar('a', { texto: 'Dos' }, true))
    await esperar(100)
    act(() => hook.result.current.editar('a', { texto: 'Tres' }))
    await esperar(800)
    expect(hook.result.current.filas[0]!.texto).toBe('Tres')
    expect(guardar).toHaveBeenCalledTimes(1)
    await esperar(2000)
    expect(guardar).toHaveBeenCalledTimes(2)
    expect(guardar.mock.calls[1]![0]).toEqual([fila('a', 'Tres')])
    expect(hook.result.current.filas[0]!.texto).toBe('Tres')
  })

  it('mover envía el nuevo orden y quitar envía sin la fila', async () => {
    const { hook, guardar } = montar([fila('a', 'Uno'), fila('b', 'Dos')])
    act(() => hook.result.current.mover('b', -1))
    await esperar(0)
    expect(guardar).toHaveBeenLastCalledWith([fila('b', 'Dos'), fila('a', 'Uno')])
    expect(hook.result.current.porEnfocar.current).toBe('b')
    act(() => hook.result.current.mover('b', -1))
    await esperar(0)
    expect(guardar).toHaveBeenCalledTimes(1)
    act(() => hook.result.current.quitar('a'))
    await esperar(0)
    expect(guardar).toHaveBeenLastCalledWith([fila('b', 'Dos')])
  })

  it('no agrega más del máximo', () => {
    const { hook } = montar([fila('a', '1'), fila('b', '2'), fila('c', '3')])
    act(() => hook.result.current.agregar(fila('d')))
    expect(hook.result.current.filas).toHaveLength(3)
  })
})

describe('textoMeta', () => {
  it('une operador, valor y unidad', () => {
    expect(textoMeta('>=', 90, '%')).toBe('≥ 90 %')
    expect(textoMeta('<=', 72, 'horas')).toBe('≤ 72 horas')
    expect(textoMeta('=', 1, '')).toBe('= 1')
    expect(textoMeta('>=', 1500.5, 'COP')).toBe('≥ 1.500,5 COP')
    expect(textoMeta('>=', null, '%')).toBe('Sin meta')
  })
})
