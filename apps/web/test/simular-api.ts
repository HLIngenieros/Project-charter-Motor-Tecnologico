import { vi } from 'vitest'

export interface Llamada {
  url: string
  metodo: string
  cuerpo: unknown
}

export type Respuesta = { estado: number; cuerpo?: unknown; demora?: number }

export const usuarioAna = {
  id: 'u1',
  correo: 'ana@hlingenieros.com',
  nombre: 'Ana Pérez',
  esAdmin: false,
  debeCambiarClave: false,
}

/**
 * Simula `fetch`: `responder` recibe cada llamada y devuelve la respuesta. Por defecto
 * responde la sesión de Ana en `/api/auth/yo`. Devuelve la lista de llamadas.
 */
export function simularApi(responder: (l: Llamada) => Respuesta | undefined) {
  const llamadas: Llamada[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const l: Llamada = {
        url,
        metodo: init.method ?? 'GET',
        cuerpo: init.body ? JSON.parse(String(init.body)) : undefined,
      }
      llamadas.push(l)
      const r =
        responder(l) ??
        (url === '/api/auth/yo'
          ? { estado: 200, cuerpo: usuarioAna }
          : { estado: 404, cuerpo: { error: { codigo: 'no_encontrado', mensaje: 'No existe' } } })
      if (r.demora) await new Promise((fin) => setTimeout(fin, r.demora))
      return new Response(r.cuerpo === undefined ? null : JSON.stringify(r.cuerpo), {
        status: r.estado,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  return llamadas
}
